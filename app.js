/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------
// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var session = require('express-session');
var util = require('util');
var request = require('request');
var Cloudant = require('cloudant');
var crypto = require('crypto');



// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());

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
	        			res.send(JSON.parse(body).rows);
	        		} else {
	        			console.log("We have no error, but status code is not valid: "+response.statusCode);
	        		}
	        	}
	        }
	    );
});

app.get('/jobData', function(req, res) {
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
	        			res.send(JSON.parse(body).rows);
	        		} else {
	        			console.log("We have no error, but status code is not valid: "+response.statusCode);
	        		}
	        	}
	        }
	    );
});


//Search job by category
app.get('/jobDataCategory', function(req, res) {
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
	        			var resultJSON = [{}];
	        			var results = JSON.parse(body).rows;
	        			for(i =0; i<results.length; i++){
	        				if(results[i].value.jobCategory == req.param('categoryName')) resultJSON.push(results[i]);
	        			}	   
	        			res.send(resultJSON);
	        		} else {
	        			console.log("We have no error, but status code is not valid: "+response.statusCode);
	        		}
	        	}
	        }
	    );
});

//LOGIN
app.post('/login', function(req, res) {	
	var userName = req.body.userName;
	var tempPass = req.body.password;
	var password = crypto.createHash('md5').update(tempPass).digest('hex');
	var d = {"success":false, "nextUrl":""};
	
	request.get({
		url: dbURL +"/user/_design/user/_view/user?userName="+userName+"&"+"password="+password,
	}, function(error, response, body){
		if(error){
			console.log("Error occurred during login");			
			res.send(d)
		}
		else{
			var result = JSON.parse(body).rows.length;
			if(result>0){
				d = { "success":true, "nextUrl":"/job.html"};
				res.send(d);
			}
			else{
				res.send(d);
			}
		}
	});
	
});

//LOGOUT
app.get('/logout', function(req, res) {
	res.redirect('/login');
});

