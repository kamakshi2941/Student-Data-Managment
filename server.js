const { response } = require("express");
var express = require("express");
var expressValidator = require('express-validator');
var app = express();
var path = require("path");
var HTTP_PORT = process.env.PORT || 8081;
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
const {check, validationResult} = require('express-validator');

const mongoose = require('mongoose');
var Schema = mongoose.Schema;

let dbConnection = mongoose.createConnection(`mongodb+srv://admin:12345@webprog8020f22.7j5i8qd.mongodb.net/test`, {useNewUrlParser: true, useUnifiedTopology: true});

//declare the model representation for document
let orderSchema = undefined;
let orderModel = undefined;
let studentData = undefined;

dbConnection.on('error', (err) => {console.log(`Cannot connect to database ${err}`);});
dbConnection.on('open', () => {
    console.log("Database connection successfully established")

    //initialize model representation for document/record if the connect to db is established
    orderSchema = new Schema({
        "ID": Number,
        "name": String,
        "email": String,
        "postcode": String
    });

    //register schema for collection and to receive model instance
    orderModel = dbConnection.model("students_collection", orderSchema);
});


const onHTTPStart = () => {
    console.log(`Express HTTP server listening on port ${HTTP_PORT}`);
    console.log(`open http://localhost:${HTTP_PORT} on the browser`);
}
app.get("/", function(request, response){
   // response.render('form'); 

    
        orderModel.find().count((error, totalOrders) => {
            console.log(`there are ${totalOrders} records in the collection.`);
        });

        orderModel.find({}).exec(function(error, studentList){
            if (error !== null){
                console.log(`Could not retrieve all the records from database : ${error}`);
            }
            studentData = studentList;
            response.render('form', {orders: studentList})
        });
   // }
});

let postalCode = /^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$/;
const customPostalCodeValidation = (postcode) => {
    if(postalCode.test(postcode))
    {
        return true
    }
    else
    {
        throw new Error(`Please enter Postal Number in correct format : A1A 1A1`);
    }
}

app.post("/", [
    check('name', 'Student Name is required').notEmpty(),
    check('ID', 'Student ID is required').notEmpty(),
    check('email', 'Please enter email in valid format').isEmail(),
    check('postcode', '').custom(customPostalCodeValidation)
], function(request, response){
   
    const errors = validationResult(request);
    console.log(errors);
    
    if(!errors.isEmpty())
    {
        response.render('form', {errors : errors.array()});
    }else{
            if (request.body === undefined)
        {
            console.log(`not receive any data in request object ${request}`);
            response.render('form', {errorMessage : "No data received"});
        }
        else
        {
            console.log(`request.body received : ${request.body}`);
            var name = request.body.name;
            var studentID = request.body.ID;
            var email = request.body.email;
            var PostalCode = request.body.postcode;

            var pageData = {
                ID: studentID,
                name: name,
                email: email,
                postcode: PostalCode,
            };
            //response.render('form', pageData);
            if(pageData != null){
                let myOrder = new orderModel(pageData);
    
                    //save the document to collection
                myOrder.save((err) => {
                    if (err){
                        console.log(`Cannot insert document to collection : ${err}`);
                    }else{
                        console.log(`Insert document successfully saved in the database`);
                    }
                });
                pageData = null;  
            }
            //window.location.reload();
            response.redirect("/");
        }
    }
});

app.listen(HTTP_PORT, onHTTPStart);