/**
 * http://usejsdoc.org/
 */


var rewire = require('rewire');
var chai = require('chai');
var expect = chai.expect;
var SearchHelper = rewire('../SearchHelper.js');
var util = require('util');

chai.config.includeStack = false;

describe('SearchHelper.js', function(){
	
	describe('appendFieldLists', function(){
		appendFieldLists = SearchHelper.__get__('appendFieldLists'); 
		it('appends the two strings with separator', function(){
			var s = appendFieldLists('field1&field2','field3&field4&field5');
			var sl = s.split('&');
			expect(sl.length).to.equal(5);
		});
		it('appends a strings with empty string', function(){
			var s = appendFieldLists('field1&field2','');
			var sl = s.split('&');
			expect(sl.length).to.equal(2);
		});	
		it('appends a strings with undefined', function(){
			var s = appendFieldLists('field1&field2',undefined);
			var sl = s.split('&');
			expect(sl.length).to.equal(2);
		});	
	});
	

	describe('getErrStrFromResponse', function(){
		getErrStrFromResponse = SearchHelper.__get__('getErrStrFromResponse'); 
		var errObj = {'message':'Connection error ocurred'};
		var response200 = {'statusCode':200};
		var response404 = {'statusCode':404};
		var bodyOk = '{ "search": { "entry": [{ "dn": "uid=H88484740,c=hu,ou=bluepages,o=ibm.com","attribute": [{ "name": "cn", "value": [ "Peter Mosoni" ] }]},{ "dn": "uid=H54653740,c=hu,ou=bluepages,o=ibm.com","attribute": [{ "name": "cn", "value": [ "Peter Mosoni", "Peter Mosoni1" ] }]}],"return": {"code": 0,"message": "Success","count": 2}} }';
		var bodyErr = '{ "search": { "entry": [ ],"return": {"code": 999,"message": "Error retrieving search results: invalid attribute description","count": 0}} }';
		
		it('returns empty string when there is no error', function(){
			var s = getErrStrFromResponse(undefined, response200, bodyOk);
			expect(s).to.equal('');
		});
		it('returns the error message when there is an error', function(){
			var s = getErrStrFromResponse(errObj, response200, bodyOk);
			expect(s).to.equal('Connection error ocurred');
		});	
		it('returns http error message when there is a http error', function(){
			var s = getErrStrFromResponse(undefined, response404, bodyOk);
			expect(s).to.equal('response.statusCode=404');
		});	
		it('returns data error message when there is a data error', function(){
			var s = getErrStrFromResponse(undefined, response200, bodyErr);
			expect(s).to.equal('Error [999]: Error retrieving search results: invalid attribute description');
		});	
	});
	
	describe('putEmployeeDataIntoRecords', function(){
		putEmployeeDataIntoRecords = SearchHelper.__get__('putEmployeeDataIntoRecords');
		var dataItem = { 'index':1, 'data':'mosoni', 'resultRecords':[]};
		var fields = ['SrcIndex','SrcData','SrcRes','E_uid','E_CN'];
		var body = '{ "search": { "entry": [{ "dn": "uid=H88484740,c=hu,ou=bluepages,o=ibm.com","attribute": [{ "name": "managerCountryCode", "value": [ "740" ] },{ "name": "managerSerialNumber", "value": [ "H88314" ] },{ "name": "uid", "value": [ "H88484740" ] },{ "name": "hrOrganizationCode", "value": [ "3E" ] },{ "name": "co", "value": [ "Hungary" ] },{ "name": "glTeamLead", "value": [ "uid=015547848,c=ch,ou=bluepages,o=ibm.com" ] },{ "name": "cn", "value": [ "Peter Mosoni" ] }]},{ "dn": "uid=H54653740,c=hu,ou=bluepages,o=ibm.com","attribute": [{ "name": "managerCountryCode", "value": [ "740" ] },{ "name": "managerSerialNumber", "value": [ "H02336" ] },{ "name": "uid", "value": [ "H54653740" ] },{ "name": "hrOrganizationCode", "value": [ "0E" ] },{ "name": "co", "value": [ "Hungary" ] },{ "name": "cn", "value": [ "Peter Mosoni", "Peter Mosoni1" ] }]}],"return": {"code": 0,"message": "Success","count": 2}} }';
		putEmployeeDataIntoRecords(dataItem, fields, body);
		it('creates result string array for each retrieved record', function(){
			expect(dataItem.resultRecords.length).to.equal(2);
		});	
		it('fills result record with the received data', function(){
			expect(dataItem.resultRecords[0].record[3]).to.equal('H88484740');
		});	
		it('fills result record with the BP manager data', function(){
			expect(dataItem.resultRecords[1].extraData.BPManId).to.equal('H02336740');
		});
		it('fills result record with the GET manager data', function(){
			expect(dataItem.resultRecords[0].extraData.GETManId).to.equal('015547848'); 
		});
		it('fills result record with the manager data', function(){
			expect(dataItem.resultRecords[1].extraData.orgId).to.equal('0E');
		});
	});
	
	describe('getFieldValueFromBodyDataRecord', function(){
		getFieldValueFromBodyDataRecord = SearchHelper.__get__('getFieldValueFromBodyDataRecord');
		var body = '{ "search": { "entry": [{ "dn": "uid=H88484740,c=hu,ou=bluepages,o=ibm.com","attribute": [{ "name": "managerCountryCode", "value": [ "740" ] },{ "name": "managerSerialNumber", "value": [ "H88314" ] },{ "name": "uid", "value": [ "H88484740" ] },{ "name": "hrOrganizationCode", "value": [ "3E" ] },{ "name": "co", "value": [ "Hungary" ] },{ "name": "glTeamLead", "value": [ "uid=015547848,c=ch,ou=bluepages,o=ibm.com" ] },{ "name": "cn", "value": [ "Peter Mosoni" ] }]},{ "dn": "uid=H54653740,c=hu,ou=bluepages,o=ibm.com","attribute": [{ "name": "managerCountryCode", "value": [ "740" ] },{ "name": "managerSerialNumber", "value": [ "H02336" ] },{ "name": "uid", "value": [ "H54653740" ] },{ "name": "hrOrganizationCode", "value": [ "0E" ] },{ "name": "co", "value": [ "Hungary" ] },{ "name": "cn", "value": [ "Peter Mosoni", "Peter Mosoni1" ] }]}],"return": {"code": 0,"message": "Success","count": 2}} }';
		var bodyData = JSON.parse(body);
		var bodyDataRecord = bodyData.search.entry[0];
		it('retrieves the correct field content', function(){
			var s = getFieldValueFromBodyDataRecord(bodyDataRecord, 'managerSerialNumber');
			expect(s).to.equal("H88314");	
		});
		it('retrieves the correct field content even if the character case is different', function(){
			var s = getFieldValueFromBodyDataRecord(bodyDataRecord, 'ManagerSerialNumber');
			expect(s).to.equal("H88314");	
		});
	});
	
	describe('fillResultRecord', function(){
		initResultRecord = SearchHelper.__get__('initResultRecord');
		fillResultRecord = SearchHelper.__get__('fillResultRecord');
		var fields = ['SrcIndex','SrcData','SrcRes','E_uid','E_CN'];
		var body = '{ "search": { "entry": [{ "dn": "uid=H88484740,c=hu,ou=bluepages,o=ibm.com","attribute": [{ "name": "managerCountryCode", "value": [ "740" ] },{ "name": "managerSerialNumber", "value": [ "H88314" ] },{ "name": "uid", "value": [ "H88484740" ] },{ "name": "hrOrganizationCode", "value": [ "3E" ] },{ "name": "co", "value": [ "Hungary" ] },{ "name": "glTeamLead", "value": [ "uid=015547848,c=ch,ou=bluepages,o=ibm.com" ] },{ "name": "cn", "value": [ "Peter Mosoni" ] }]},{ "dn": "uid=H54653740,c=hu,ou=bluepages,o=ibm.com","attribute": [{ "name": "managerCountryCode", "value": [ "740" ] },{ "name": "managerSerialNumber", "value": [ "H02336" ] },{ "name": "uid", "value": [ "H54653740" ] },{ "name": "hrOrganizationCode", "value": [ "0E" ] },{ "name": "co", "value": [ "Hungary" ] },{ "name": "cn", "value": [ "Peter Mosoni", "Peter Mosoni1" ] }]}],"return": {"code": 0,"message": "Success","count": 2}} }';
		var dataItem = { 'SrcIndex':1, 'SrcData':'mosoni', 'resultRecords':[]};
		var resultRec = initResultRecord(fields.length, dataItem);
		var bodyData = JSON.parse(body);
		var bodyDataRecord = bodyData.search.entry[0];
		fillResultRecord(resultRec, fields, 'E_', bodyDataRecord);
		it('creates correct record size', function(){
			expect(resultRec.length).to.equal(fields.length);
		});
		it('fills record with the data item correctly', function(){
			expect(resultRec[0]).to.equal(1);
			expect(resultRec[1]).to.equal('mosoni');
			expect(resultRec[2].length).to.equal(0);
		});
		it('fills record with received data correctly', function(){
			expect(resultRec[3]).to.equal('H88484740');
			expect(resultRec[4]).to.equal('Peter Mosoni');
		});		
	});
	
	describe('retrieveAdditionalData', function(){
		retrieveAdditionalData = SearchHelper.__get__('retrieveAdditionalData');
		getServiceURLTemplates = SearchHelper.__get__('getServiceURLTemplates');
		var cfenv = require('cfenv');
		var appEnv = cfenv.getAppEnv();
		var BPServiceURLBase = getServiceURLTemplates(appEnv);
		var dataItem = { 'SrcIndex':1, 'SrcData':'mosoni', 'resultRecords':[
		    {  
				'extraData':{'BPManId':'H02336740', 'GETManId':'015547848', 'orgId':'0E'},
				'record':['','','','','','','','','','','','','','','','','','','']
			}
		]};
		var fields = ['SrcIndex','SrcData','SrcRes','E_uid','E_CN','EO_hrGroupId','EO_hrOrganizationCode','EO_hrOrganizationDisplay','B_uid','B_CN','BO_hrGroupId','BO_hrOrganizationCode','BO_hrOrganizationDisplay','G_uid','G_CN','GO_hrGroupId','GO_hrOrganizationCode','GO_hrOrganizationDisplay'];
		it('retrieves Employee org data, BP manager, GET manager data and their org data too',function(done){
			retrieveAdditionalData(dataItem, fields, BPServiceURLBase, function(){
				console.log('retrieveAdditionalData checking performed.');
				expect(dataItem.resultRecords[0].record[6]).to.not.be.empty;
				expect(dataItem.resultRecords[0].record[11]).to.not.be.empty;
				expect(dataItem.resultRecords[0].record[16]).to.not.be.empty;
				done();
			});
		});
	});
	
	describe('retrieveOneAdditionalData', function(){
		retrieveOneAdditionalData = SearchHelper.__get__('retrieveOneAdditionalData');
		getServiceURLTemplates = SearchHelper.__get__('getServiceURLTemplates');
		var cfenv = require('cfenv');
		var appEnv = cfenv.getAppEnv();
		var BPServiceURLBase = getServiceURLTemplates(appEnv);
		var dataItem = { 'SrcIndex':1, 'SrcData':'mosoni', 'resultRecords':[
		    {  
				'extraData':{'BPManId':'H02336740', 'GETManId':'015547848', 'orgId':'0E'},
				'record':['','','','','','','','','','','','','','','','','','','']
			}
		]};
		var fields = ['SrcIndex','SrcData','SrcRes','E_uid','E_CN','EO_hrGroupId','EO_hrOrganizationCode','EO_hrOrganizationDisplay','B_uid','B_CN','BO_hrGroupId','BO_hrOrganizationCode','BO_hrOrganizationDisplay','G_uid','G_CN','GO_hrGroupId','GO_hrOrganizationCode','GO_hrOrganizationDisplay'];
		it('retrieves one Employee org data, BP manager, GET manager data and their org data too',function(done){
			retrieveOneAdditionalData(dataItem.resultRecords[0], fields, BPServiceURLBase, function(){
				console.log('retrieveOneAdditionalData checking performed.');
				expect(dataItem.resultRecords[0].record[6]).to.not.be.empty;
				expect(dataItem.resultRecords[0].record[11]).to.not.be.empty;
				expect(dataItem.resultRecords[0].record[16]).to.not.be.empty;
				done();
			});
		});
		
	});
	
	describe('retrieveEmployeeOrgData', function(){
		retrieveEmployeeOrgData = SearchHelper.__get__('retrieveEmployeeOrgData');
		getServiceURLTemplates = SearchHelper.__get__('getServiceURLTemplates');
		var cfenv = require('cfenv');
		var appEnv = cfenv.getAppEnv();
		var BPServiceURLBase = getServiceURLTemplates(appEnv);
		var dataItem = { 'SrcIndex':1, 'SrcData':'mosoni', 'resultRecords':[
		    {  
				'extraData':{'BPManId':'H02336740', 'GETManId':'015547848', 'orgId':'0E'},
				'record':['','','','','','','','','','','','','','','','','','','']
			}
		]};
		var fields = ['SrcIndex','SrcData','SrcRes','E_uid','E_CN','EO_hrGroupId','EO_hrOrganizationCode','EO_hrOrganizationDisplay','B_uid','B_CN','BO_hrGroupId','BO_hrOrganizationCode','BO_hrOrganizationDisplay','G_uid','G_CN','GO_hrGroupId','GO_hrOrganizationCode','GO_hrOrganizationDisplay'];
		it('retrieves Employee org data',function(done){
			retrieveEmployeeOrgData(dataItem.resultRecords[0], fields, BPServiceURLBase, function(){
				console.log('retrieveEmployeeOrgData checking performed.');
				expect(dataItem.resultRecords[0].record[6]).to.not.be.empty;
				done();
			});
		});
	});

	describe('retrieveOrgData', function(){
		retrieveOrgData = SearchHelper.__get__('retrieveOrgData');
		getServiceURLTemplates = SearchHelper.__get__('getServiceURLTemplates');
		var cfenv = require('cfenv');
		var appEnv = cfenv.getAppEnv();
		var BPServiceURLBase = getServiceURLTemplates(appEnv);
		var dataItem = { 'SrcIndex':1, 'SrcData':'mosoni', 'resultRecords':[
		    {  
				'extraData':{'BPManId':'H02336740', 'GETManId':'015547848', 'orgId':'0E'},
				'record':['','','','','','','','','','','','','','','','','','','']
			}
		]};
		var orgId = '0E';
		var prefix = 'EO_';
		var fields = ['SrcIndex','SrcData','SrcRes','E_uid','E_CN','EO_hrGroupId','EO_hrOrganizationCode','EO_hrOrganizationDisplay','B_uid','B_CN','BO_hrGroupId','BO_hrOrganizationCode','BO_hrOrganizationDisplay','G_uid','G_CN','GO_hrGroupId','GO_hrOrganizationCode','GO_hrOrganizationDisplay'];
		it('retrieves org data',function(done){
			retrieveOrgData(dataItem.resultRecords[0], fields, orgId, prefix, BPServiceURLBase, function(){
				console.log('retrieveOrgData checking performed.');
				expect(dataItem.resultRecords[0].record[6]).to.not.be.empty;
				done();
			});
		});
	});	
	
	describe('retrieveManagerData B_', function(){
		retrieveManagerData = SearchHelper.__get__('retrieveManagerData');
		getServiceURLTemplates = SearchHelper.__get__('getServiceURLTemplates');
		var cfenv = require('cfenv');
		var appEnv = cfenv.getAppEnv();
		var BPServiceURLBase = getServiceURLTemplates(appEnv);
		var dataItem = { 'SrcIndex':1, 'SrcData':'mosoni', 'resultRecords':[
		    {  
				'extraData':{'BPManId':'H02336740', 'GETManId':'015547848', 'orgId':'0E'},
				'record':['','','','','','','','','','','','','','','','','','','']
			}
		]};
		var prefix = 'B_';
		var fields = ['SrcIndex','SrcData','SrcRes','E_uid','E_CN','EO_hrGroupId','EO_hrOrganizationCode','EO_hrOrganizationDisplay','B_uid','B_CN','BO_hrGroupId','BO_hrOrganizationCode','BO_hrOrganizationDisplay','G_uid','G_CN','GO_hrGroupId','GO_hrOrganizationCode','GO_hrOrganizationDisplay'];
		it('retrieves BP manager data',function(done){
			retrieveManagerData(dataItem.resultRecords[0], fields, prefix, BPServiceURLBase, function(){
				console.log('retrieveManagerData B_ checking performed.');
				expect(dataItem.resultRecords[0].record[9]).to.not.be.empty;
				done();
			});
		});
	});
	
	describe('retrieveManagerData G_', function(){
		retrieveManagerData = SearchHelper.__get__('retrieveManagerData');
		getServiceURLTemplates = SearchHelper.__get__('getServiceURLTemplates');
		var cfenv = require('cfenv');
		var appEnv = cfenv.getAppEnv();
		var BPServiceURLBase = getServiceURLTemplates(appEnv);
		var dataItem = { 'SrcIndex':1, 'SrcData':'mosoni', 'resultRecords':[
		    {  
				'extraData':{'BPManId':'H02336740', 'GETManId':'015547848', 'orgId':'0E'},
				'record':['','','','','','','','','','','','','','','','','','','']
			}
		]};
		var prefix = 'G_';
		var fields = ['SrcIndex','SrcData','SrcRes','E_uid','E_CN','EO_hrGroupId','EO_hrOrganizationCode','EO_hrOrganizationDisplay','B_uid','B_CN','BO_hrGroupId','BO_hrOrganizationCode','BO_hrOrganizationDisplay','G_uid','G_CN','GO_hrGroupId','GO_hrOrganizationCode','GO_hrOrganizationDisplay'];
		it('retrieves GET manager data',function(done){
			retrieveManagerData(dataItem.resultRecords[0], fields, prefix, BPServiceURLBase, function(){
				console.log('retrieveManagerData G_ checking performed.');
				expect(dataItem.resultRecords[0].record[14]).to.not.be.empty;
				done();
			});
		});
	});
	
	describe('isNullOrEmpty', function(){
		isNullOrEmpty = SearchHelper.__get__('isNullOrEmpty');
		it('recognizes undefined as true', function(){
			expect(isNullOrEmpty(undefined)).to.be.true;
		});
		it('recognizes null as true', function(){
			expect(isNullOrEmpty(null)).to.be.true;
		});
		it('recognizes empty string as true', function(){
			expect(isNullOrEmpty('')).to.be.true;
		});
		it('recognizes text as false', function(){
			expect(isNullOrEmpty('text')).to.be.false;
		});
	});
	
	describe('extractUidFromFQDN', function(){
		extractUidFromFQDN = SearchHelper.__get__('extractUidFromFQDN');
		var fqdn = "uid=015547848,c=ch,ou=bluepages,o=ibm.com";
		it('extracts the Uid from the FQDN', function(){
			var s = extractUidFromFQDN(fqdn);
			expect(s).to.equal('015547848');
		});	
	});

	describe('getBpData 1 ====== server side end to end  none BlueGroup', function(){
		getBpData = SearchHelper.__get__('getBpData');
		var query = {
				'fieldsToRetrieve':['E_uid','E_CN','EO_hrGroupId','EO_hrOrganizationCode','EO_hrOrganizationDisplay','B_uid','B_CN','BO_hrGroupId','BO_hrOrganizationCode','BO_hrOrganizationDisplay','G_uid','G_CN','GO_hrGroupId','GO_hrOrganizationCode','GO_hrOrganizationDisplay'],
				'fieldToSearch':'uid',
				'searchMode':'exact',
				'data':['H54653740','H02336740']
		};
		getServiceURLTemplates = SearchHelper.__get__('getServiceURLTemplates');
		var cfenv = require('cfenv');
		var appEnv = cfenv.getAppEnv();
		var BPServiceURLBase = getServiceURLTemplates(appEnv);
		it('retrieves the requested data',function(done){
			getBpData(BPServiceURLBase, query, function(result){
				console.log('getBpData 1 checking performed.');
				
				expect(result.fields.length).to.equal(18);
				expect(result.records.length).to.equal(2);
				expect(result.records[0].length).to.equal(18);
				
				expect(result.records[0][3]).to.not.be.empty;
				expect(result.records[0][4]).to.not.be.empty;
				expect(result.records[0][6]).to.not.be.empty;
				
				expect(result.records[0][8]).to.not.be.empty;
				expect(result.records[0][9]).to.not.be.empty;
				expect(result.records[0][11]).to.not.be.empty;
				
				expect(result.records[1][13]).to.not.be.empty;
				expect(result.records[1][14]).to.not.be.empty;
				expect(result.records[1][16]).to.not.be.empty;
				
				done();
			});
		});
	});
	
	
	describe('getBpData Error 2 ====== server side end to end none BlueGroup', function(){
		getBpData = SearchHelper.__get__('getBpData');
		var query = {
				'fieldsToRetrieve':['E_uid','E_CN','EO_hrGroupId','EO_hrOrganizationCode','EO_hrOrganizationDisplay','B_uid','B_CN','BO_hrGroupId','BO_hrOrganizationCode','BO_hrOrganizationDisplay','G_uid','G_CN','GO_hrGroupId','GO_hrOrganizationCode','GO_hrOrganizationDisplay'],
				'fieldToSearch':'uid',
				'searchMode':'exact',
				'data':['H54653740','H02336740']
		};
		getServiceURLTemplates = SearchHelper.__get__('getServiceURLTemplates');
		var cfenv = require('cfenv');
		var appEnv = cfenv.getAppEnv();
		var BPServiceURLBase = getServiceURLTemplates(appEnv);
		BPServiceURLBase.urlTmpForEmployeeSearch = BPServiceURLBase.urlTmpForEmployeeSearch.replace('://','://none');
		BPServiceURLBase.urlTmpForOrgSearch = BPServiceURLBase.urlTmpForEmployeeSearch.replace('://','://none');
		it('handles error correctly',function(done){
			getBpData(BPServiceURLBase, query, function(result){
				console.log('getBpData 2 checking performed.');
				
				//expect(result.err).to.exist;
				//console.log('found error: ' + util.inspect(err, null, false));
				expect(result.records[0][2]).to.not.be.empty;
				console.log('found error: ' + util.inspect(result.records[0][2], null, false));
				
				done();
			});
		});
	});
	
	
	
	
	
	describe('', function(){
		
		
	});
	
//	{ "group":[ { "member":"jgrusnak@us.ibm.com" }, { "member":"ragopat@us.ibm.com" }, { "member":"jgrusnak@us.ibm.com" }, { "member":"bellwood@us.ibm.com" }, { "member":"cybrynsk@us.ibm.com" }, { "member":"Guylaine.LeBlanc@ca.ibm.com" } ], "rc":"0", "msg":"Success" }
	
	
	
	
	
	
	
	
	
	
	
	
	describe('getBpData 3 ====== server side end to end  BlueGroup', function(){
		getBpData = SearchHelper.__get__('getBpData');
		var query = {
				'fieldsToRetrieve':['E_uid','E_CN','EO_hrGroupId','EO_hrOrganizationCode','EO_hrOrganizationDisplay','B_uid','B_CN','BO_hrGroupId','BO_hrOrganizationCode','BO_hrOrganizationDisplay','G_uid','G_CN','GO_hrGroupId','GO_hrOrganizationCode','GO_hrOrganizationDisplay'],
				'fieldToSearch':'#BG',
				'searchMode':'exact',
				'data':['DEMO']
		};
		getServiceURLTemplates = SearchHelper.__get__('getServiceURLTemplates');
		var cfenv = require('cfenv');
		var appEnv = cfenv.getAppEnv();
		var BPServiceURLBase = getServiceURLTemplates(appEnv);
		it('retrieves the requested data',function(done){
			getBpData(BPServiceURLBase, query, function(result){
				console.log('getBpData 3 checking performed.');
				
				expect(result.fields.length).to.equal(18);
				expect(result.records.length).to.equal(6);
				expect(result.records[0].length).to.equal(18);
				
				expect(result.records[0][3]).to.not.be.empty;
				expect(result.records[0][4]).to.not.be.empty;
				expect(result.records[0][6]).to.not.be.empty;
				
				expect(result.records[0][8]).to.not.be.empty;
				expect(result.records[0][9]).to.not.be.empty;
				expect(result.records[0][11]).to.not.be.empty;
				
				expect(result.records[5][13]).to.not.be.empty;
				expect(result.records[5][14]).to.not.be.empty;
				expect(result.records[5][16]).to.not.be.empty;
				
				done();
			});
		});
	});
	
	
	describe('getBpData Error 4 ====== server side end to end BlueGroup', function(){
		getBpData = SearchHelper.__get__('getBpData');
		var query = {
				'fieldsToRetrieve':['E_uid','E_CN','EO_hrGroupId','EO_hrOrganizationCode','EO_hrOrganizationDisplay','B_uid','B_CN','BO_hrGroupId','BO_hrOrganizationCode','BO_hrOrganizationDisplay','G_uid','G_CN','GO_hrGroupId','GO_hrOrganizationCode','GO_hrOrganizationDisplay'],
				'fieldToSearch':'#BG',
				'searchMode':'exact',
				'data':['DEMO']
		};
		getServiceURLTemplates = SearchHelper.__get__('getServiceURLTemplates');
		var cfenv = require('cfenv');
		var appEnv = cfenv.getAppEnv();
		var BPServiceURLBase = getServiceURLTemplates(appEnv);
		BPServiceURLBase.urlTmpForGrpSearch = BPServiceURLBase.urlTmpForGrpSearch.replace('://','://none');
		it('handles error correctly',function(done){
			getBpData(BPServiceURLBase, query, function(result){
				console.log('getBpData 4 checking performed.');
				
				//expect(result.err).to.exist;
				//console.log('found error: ' + util.inspect(err, null, false));
				expect(result.records[0][2]).to.not.be.empty;
				console.log('found error: ' + util.inspect(result.records[0][2], null, false));
				
				done();
			});
		});
	});
	

	
});


