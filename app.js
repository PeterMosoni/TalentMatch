/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var util = require('util');

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

//------------------------------------------------------------------------------

app.get('/', function (req, res){
	var r = require('./views/mainView');
	res.send(r.getContent());	
});

app.get('/retrieve', function (req, res){
	//console.log(util.inspect(req.query,null, true));
	var SearchHelper = require('./SearchHelper.js'); 	
	SearchHelper.getBpData(getServiceURLTemplates(appEnv), req.query, function(result){
		result.env = appEnv;
		console.log('>>>> Send back:');
		console.log(util.inspect(result,false, null));
		res.send(JSON.stringify(result));
	});
});

app.get('/env', function (req, res){
	var d = {};
	d.version = "3.1";
	d.appEnv = appEnv;
	d.BPServiceURLBase = getServiceURLTemplates(appEnv);
	res.send(JSON.stringify(d));
});



//---------------------------------------------------------

//e.g.:  http://bluepages.ibm.com/BpHttpApisv3/slaphapi?ibmperson/(mail=balibora@us.ibm.com).search/byjson?callupname&sn&cn&givenname

/**
 * @param appEnvObj <object> - is the environment variable object
 * @returns <object> {urlTmpForEmployeeSearch, urlTmpForOrgSearch}
 * 		- urlTmpForEmployeeSearch <string>
 * 		- urlTmpForOrgSearch <string>
 *		replace the 
 *			- '{cond}' text with the condition e.g.: '(mail=balibora@us.ibm.com)'
 *			- '{fields}' text with the field list to retrieve separated by '&'  e.g.: 'hrOrganizationCode&hrOrganizationDisplay&hrOrganizationId'
 *			- '{grpName}' text with the group name
 */
function getServiceURLTemplates(appEnvObj){
	// Blue Pages -----------------------------------------
	var bpUrlBase = "http://bluepages.ibm.com/BpHttpApisv3/";
	var bpClientId = "";	
	var bpEmployeeSearchTemplate = "slaphapi?ibmperson/{cond}.search/byjson?";   // replace the '{cond}' with the condition e.g.: '(mail=balibora@us.ibm.com)'
	var bpOrgSearchTemplate = "slaphapi?ibmorganization/{cond}.search/byjson?";   // replace the {cond} with the condition
	// BG ------------------------------------------------
	var bgUrlBase = "https://eapim.w3ibm.mybluemix.net/common/run/bluegroup/members/{grpName}?client_id=d99253c5-b369-4510-bb73-c476f0ec2030"; 
	var bgClientId = "";	
	
	if (!appEnvObj.isLocal){
		var bpProxy = getServiceOnName(appEnvObj, "BPProxy");
		bpUrlBase = bpProxy.credentials.path;
		if (bpUrlBase.charAt(bpUrlBase.length-1) != "/") bpUrlBase += "/"; 
		bpClientId = "?client_id=" + bpProxy.credentials.client_id;
		bpEmployeeSearchTemplate = "slaphapi/ibmperson/{cond}.search/byjson/";
		bpOrgSearchTemplate = "slaphapi/ibmorganization/{cond}.search/byjson/";
				
		var bgProxy = getServiceOnName(appEnvObj, "BGProxy");
		bgUrlBase = bgProxy.credentials.path;
		if (bgUrlBase.charAt(bgUrlBase.length-1) != "/") bgUrlBase += "/"; 
		bgUrlBase += 'members/{grpName}';
		bgClientId = "?client_id=" + bgProxy.credentials.client_id;
	}	

	if (bpUrlBase.charAt(bpUrlBase.length-1) != "/") bpUrlBase += "/";	
	var urlTmpForEmployeeSearch = bpUrlBase + bpEmployeeSearchTemplate + '{fields}' + bpClientId;
	var urlTmpForOrgSearch = bpUrlBase + bpOrgSearchTemplate + '{fields}' + bpClientId;
		
	var urlTmpForGrpSearch = bgUrlBase + bgClientId;
	
	return {'urlTmpForEmployeeSearch':urlTmpForEmployeeSearch, 'urlTmpForOrgSearch':urlTmpForOrgSearch, 'urlTmpForGrpSearch':urlTmpForGrpSearch};
}

/**
 * Searches for the service description object on its name
 * @param appEnvObj
 * @param serviceName
 */
function getServiceOnName(appEnvObj, serviceName){
	var res = undefined;
	var userProvided = appEnvObj.services["user-provided"];
	for(var i=0; i < userProvided.length; i++) {
		var service = userProvided[i];			
		if (service.name == serviceName){
			res = service;
		}  
	}
	return res;
}










