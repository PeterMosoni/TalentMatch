/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------
// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var async = require('async');
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
	        url: dbURL +"/job/_design/jobs/_view/jobsOnCateg?key=\""+req.param("categoryName")+"\"",
	        headers: {
	            'Content-Type': 'application/json'
	        }}, function (error, response, body) {
	        	if ((error) || (!response.statusCode)) {
	        		console.log("ERROR: Can't get target db's docs." +error);
	        	}
	        	else {
	        		if((response.statusCode < 300)) {	        			
	        			var results = JSON.parse(body).rows; 
	        			res.send(results);
	        		} else {
	        			console.log("We have no error, but status code is not valid: "+response.statusCode);
	        		}
	        	}
	        }
	    );
});


//Search job by category
app.get('/allJobCategories', function(req, res) {
	 request.get({
	        url: dbURL +"/job/_design/jobs/_view/jobsOnCateg",
	        headers: {
	            'Content-Type': 'application/json'
	        }}, function (error, response, body) {
	        	if ((error) || (!response.statusCode)) {
	        		console.log("ERROR: Can't get target db's docs." +error);
	        	}
	        	else {
	        		if((response.statusCode < 300)) {	
	        			var jsonResults = [];
	        			var results = JSON.parse(body).rows; 
	        			for(i=0; i<results.length; i++){
	        				jsonResults.push({jobCategory:results[i].value.jobCategory});
	        			}
	        			res.send(jsonResults);
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


// -----------------

// retrieve candidate data ordered by rating of the given job's rating
app.post('/candidatesOnJobRating', function(req, res) {
	var jobId = req.body.jobId;
	getAllRatings(jobId, function(ratingArray){
		getCandidateDataForRating(ratingArray, function(dataArray){
			//orderData(dataArray); ???????
			dataArray = { result: dataArray }
			dataArray = orderRatingArray(dataArray);
			res.send(dataArray);
		});		
	});
});

// gets all the rating data into array of { candidateId:"", rating:0 }
// callback(resultArray)
function getAllRatings(jobId, callback){
	request.get({
        url: dbURL +"/rating/_design/allRarings/_view/allRatings",
        headers: {
            'Content-Type': 'application/json'
        }}, function (error, response, body) {
        	if ((error) || (!response.statusCode)) {
        		console.log("ERROR: Can't get target db's docs." +error);
        	}
        	else {
        		if((response.statusCode < 300)) {
        			var results = JSON.parse(body).rows; 
        			var res = [];
        			for (var i = 0; i < results.length; i++){
        				res.push(getCandidateIdAndRatingPair(jobId, results[i]));
        			}
        			callback(res);
        		} else {
        			console.log("We have no error, but status code is not valid: "+response.statusCode);
        		}
        	}
        }
    );
}

function getCandidateIdAndRatingPair(jobId, ratingDbItem){
	var res = { candidateId:"", rating:0 };
	res.candidateId = ratingDbItem.value.candidateId;
	var r = 0;
	for (var i = 0; i < ratingDbItem.value.ratings.length; i++ ){
		if (ratingDbItem.value.ratings[i].jobId == jobId) r = ratingDbItem.value.ratings[i].rating;
	}
	res.rating = r;	
	return res;
}



// gets the candidate data for all the ratings. 
// callback(result)   result is an array of { candidateId:"", rating:0, candidate: {...} }
function getCandidateDataForRating(ratingArray, callback){
	async.forEachLimit(
			ratingArray, 
			10,  // number of threads
			function(dataItem, readyCallback){  // request data
				fillOneDataItemWithCandidateData(dataItem, function(){
					readyCallback();					
				});				
			},
			function(err){
				callback(ratingArray);
			}
	);	
}

// fills the applicant data into the dataItem
function fillOneDataItemWithCandidateData(dataItem, callback){
	var url = dbURL +"/candidate/"+dataItem.candidateId;
	request.get({
        url: url,
        headers: {
            'Content-Type': 'application/json'
        }}, function (error, response, body) {
        	if ((error) || (!response.statusCode)) {
        		console.log("ERROR: Can't get target db's docs." +error);
        	}
        	else {
        		if((response.statusCode < 300)) {
        			dataItem.applicant = JSON.parse(body);
        		} else {
        			console.log("We have no error, but status code is not valid: "+response.statusCode);
        		}
        	}
        	callback();
        }
    );
}

function orderRatingArray(dataArray){
	var ratingResults = dataArray.result;
	var sort_by = function(field, reverse, primer){

		   var key = primer ? 
		       function(x) {return primer(x[field])} : 
		       function(x) {return x[field]};

		   reverse = !reverse ? 1 : -1;

		   return function (a, b) {
		       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
		     } 
		}
	return ratingResults.sort(sort_by('rating', false, parseFloat));
}


//-----------------



app.get('/candidate', function(req, res) {
	var candidId = req.param("candidateId");
	getCandidateData(candidId, function(candidData){
		getDocsForCandidate(candidId, function(docData){
			var resData = { candidData:candidData, docData:docData };
			res.send(resData);
		})
	});
});

function getCandidateData(candidId, callback){
	request.get({
	       url: dbURL +"/candidate/"+candidId,
	       headers: {
	           'Content-Type': 'application/json'
	       }}, 
	       function (error, response, body) {
	       	if ((error) || (!response.statusCode)) {
	       		console.log("ERROR: Can't get target db's docs." +error);
	       	}
	       	else {
	       		if((response.statusCode < 300)) {
	       			callback(JSON.parse(body));	       			
	       		} else {
	       			console.log("We have no error, but status code is not valid: "+response.statusCode);
	       		}
	       	}
	       }
	 );
}

function getDocsForCandidate(candidId, callback){
	request.get({
	       url: dbURL +"/documents/_design/document/_view/document?key=\""+candidId+"\"",
	       headers: {
	           'Content-Type': 'application/json'
	       }}, 
	       function (error, response, body) {
	       	if ((error) || (!response.statusCode)) {
	       		console.log("ERROR: Can't get target db's docs." +error);
	       	}
	       	else {
	       		if((response.statusCode < 300)) {
	       			var docData = JSON.parse(body).rows;
	       			for(i=0; i<docData.length; i++){
	       				var doc = docData[i].value;
	       				var attachments = doc._attachments;
	       				var attJSON = [];
	       				for(key in attachments){
	       				    attJSON.push({url:dbURL+"/documents/"+docData[i].id+"/"+key});
	       				}
	       				doc.attachmentLinks=attJSON;
	       			}
	       			callback(docData);	       			
	       		} else {
	       			console.log("We have no error, but status code is not valid: "+response.statusCode);
	       		}
	       	}
	       }
	 );
} 






//LOGOUT
app.get('/logout', function(req, res) {
	res.redirect('/login');
});

