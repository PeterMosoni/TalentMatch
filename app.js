/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------
// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var util = require('util');
var request = require('request');
var Cloudant = require('cloudant');
var crypto = require('crypto');



// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
	console.log("server starting on " + appEnv.url);

});



var dbURL = "https://241d47a6-cc56-4f32-b4ca-e74d969d5768-bluemix:4f08adeee6f4f8f53968fb40b57d06052e6ae66cce96ee1375d567de811dea49@241d47a6-cc56-4f32-b4ca-e74d969d5768-bluemix.cloudant.com";

app.get('/companyData', function(req, res) {
	var companies = {"companies":[]};
	 request.get({
	        url: dbURL +"/company/_design/companies/_view/companies",
	        headers: {
	            'Content-Type': 'application/json'
	        }}, function (error, response, body) {
	        	if ((error) || (!response.statusCode)) {
	        		console.log("ERROR: Can't get target db's docs." +error);
	        	}
	        	else {
	        		if((response.statusCode < 300)) {
	        			console.log("=== body ===");
	        			console.log(body);
	        			res.send(JSON.parse(body).rows);
	        		} else {
	        			console.log("We have no error, but status code is not valid: "+response.statusCode);
	        		}
	        	}
	        }
	    );
});

app.get('/jobData', function(req, res) {
	var companies = {"jobs":[]};
	 request.get({
	        url: dbURL +"/job/_design/jobs/_view/jobs",
	        headers: {
	            'Content-Type': 'application/json'
	        }}, function (error, response, body) {
	        	if ((error) || (!response.statusCode)) {
	        		console.log("ERROR: Can't get target db's docs." +error);
	        	}
	        	else {
	        		if((response.statusCode < 300)) {
	        			console.log("=== body ===");
	        			res.send(JSON.parse(body).rows);
	        		} else {
	        			console.log("We have no error, but status code is not valid: "+response.statusCode);
	        		}
	        	}
	        }
	    );
});

//LOGIN
app.get('/login', function(req, res) {	
	var companies = {"companies":[]};
	 request.get({
	        url: dbURL +"/user/_all_docs",
	        headers: {
	            'Content-Type': 'application/json'
	        }}, function (error, response, body) {
	        	if ((error) || (!response.statusCode)) {
	        		console.log("ERROR: Can't get target db's docs." +error);
	        	}
	        	else {
	        		if((response.statusCode < 300)) {
	        			
	        			 var d = {};
	        			// else d = { "success":false; "nextUrl":""};
	        			
	        			users =JSON.parse(body).rows;
	        			for(i=0; i<users.length; i++){
	        				user_id = users[i].id;
	        				request.get({
	        			        url: dbURL +"/user/"+user_id,
	        			        headers: {
	        			            'Content-Type': 'application/json'
	        			        }}, function(error, response, reqBody){
	        			        	var user = JSON.parse(reqBody).userName;	        			        	
	        			        	var password = crypto.createHash('md5').update(req.param('password')).digest('hex');

	        			        	console.log(password);	        			        	
	        			        	if(user == req.param('userName') && password ==  JSON.parse(reqBody).password){
	        			        		d = { "success":true, "nextUrl":"/job.html"};
	        			        		res.send(d);
	        			        	}
	        				});
	        			}
	        			
	        		} else {
	        			console.log("We have no error, but status code is not valid: "+response.statusCode);
	        		}
	        	}
	        }
	    );
	
	
//	var str = {"selector" : {"username": req.param('userName')}};
//	console.log(str);
//	request.post({
//        url: dbURL +"/user/_find",
//        headers: {
//            'Content-Type': 'application/json'
//        },
//        body: str}, function(error, response, body){
//        	if(error){
//        		console.log("Error retrieving user credentials");
//        	}
//        	else{
//        		res.send(body);
//        	}		
//	})
});

app.get('/logout', function(req, res) {
	delete req.session.user_id;
	res.redirect('/login');
});

