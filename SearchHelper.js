/**
 * Search Helper contains the main functions
 */

var async = require('async');
var util = require('util');
var request = require('request');
//var BPServiceURLBase;

/**
 * 
 * @param bPServiceURLBase
 * @param query
 * @param callback <function(res)>
 *   - res <object> {err, fields, records}
 * 		- err: <object> error 
 * 		- fields: <array of string> field names
 * 		- records: <array of array of string> field contents by records
 */
function getBpData(bPServiceURLBase, query, callback){
	var BPServiceURLBase = bPServiceURLBase;
	var data = query.data;
	var fieldToSearch = query.fieldToSearch;
	var searchMode = query.searchMode;
	
	var res = {};
	res.err = null; 
	res.fields = getFields(query.fieldsToRetrieve); // extend the field list with {SrcIndex, SrcData, SrcRes} as the first three item
	res.records = [];
		
	var dataItems = createDataItems(data);  // create item objects from each 

	if (fieldToSearch == '#BG'){
		fillDataItemsWithBGMemberData(dataItems, res.fields, BPServiceURLBase, function(err){
			if (err) res.err = err;
			else {
				for(var i = 0; i < dataItems.length; i++){   // put result into res
					var dataItem = dataItems[i];
					for(var t = 0; t < dataItem.resultRecords.length; t++){
						res.records.push(dataItem.resultRecords[t].record);
					}
				}			
			}
			callback(res);
		}); // retrieveBlueGroupMembers
	}
	else {
		fillDataItemsWithEmployeeData(dataItems, fieldToSearch, searchMode, res.fields, BPServiceURLBase, function(err){  // fills the dataItems objects
			if (err) res.err = err;
			else {
				for(var i = 0; i < dataItems.length; i++){   // put result into res
					var dataItem = dataItems[i];
					for(var t = 0; t < dataItem.resultRecords.length; t++){
						res.records.push(dataItem.resultRecords[t].record);
					}
				}			
			}
			callback(res);
		}); // fillData		
	}
}


/**
 * Creates object array from the data
 * @param data - <array of string> the data for search
 * @returns - <array of object>  object: { SrcIndex, SrcData, SrcRes, resultRecords}
 * 				- SrcIndex <integer> - index of the input data
 * 				- SrcData <string> - the input data
 * 				- resultRecords <array of object> {record, extraData} 
 * 					- record <array of string> - the found records at least one
 * 					- extraData <object> for manager ids, orgid
 */
function createDataItems(data){
	var res = [];
	for(var i = 0; i < data.length; i++){
		res.push({
			'SrcIndex': i,
			'SrcData': data[i],
			'resultRecords': []
		});
	}
	return res;
}

/**
 * Extends the field list with mandatory fields
 * @param f - <array of string> fields to retrieve with prefix
 * @returns - <array of string> fields to retrieve with prefix extended
 */
function getFields(f){
	var res = [];
	res.push('SrcIndex');
	res.push('SrcData');
	res.push('SrcRes');
	for(var i=0; i < f.length; i++){
		res.push(f[i]);
	}
	return res;
}

/**
 * 
 * @param dataItems - <array of object>  object: { SrcIndex, SrcData, SrcRes, resultRecords}
 * 				- SrcIndex <integer> - index of the input data
 * 				- SrcData <string> - the input data
 * 				- resultRecords <array of object> {record, extraData} 
 * 					- record <array of string> - the found records at least one
 * 					- extraData <object> for manager ids, orgid
 * @param fieldToSearch - <string> data should be searched in this field 
 * @param searchMode - <string> how to search
 * @param fields - <array of string> field names to retrieve with prefix
 * @param BPServiceURLBase - <object> url templates
 * @param callback - <function(err)>:    err <string> the error message. If no error, empty
 */
function fillDataItemsWithEmployeeData(dataItems, fieldToSearch, searchMode, fields, BPServiceURLBase, callback){
	async.forEachLimit(
			dataItems, 
			10,  // number of threads
			function(dataItem, readyCallback){  // request data
				fillOneDataItemWithEmployeeData(dataItem, fieldToSearch, searchMode, fields, BPServiceURLBase, function(){
					readyCallback();					
				});				
			},
			function(err){
				callback(err);
			}
	);	
}


/**
 * 
 * @param dataItem - <object>: { SrcIndex, SrcData, resultRecords}  result is stored into the resultRecords
 * 				- SrcIndex <integer> - index of the input data
 * 				- SrcData <string> - the input data
 * 				- resultRecords <array of object> {record, extraData} 
 * 					- record <array of string> - the found records at least one
 * 					- extraData <object> for manager ids, orgid
 * @param fieldToSearch - <string> data should be searched in this field 
 * @param searchMode - <string> how to search
 * @param fields - <array of string> field names to retrieve with prefix
 * @param BPServiceURLBase - <object> url templates
 * @param readyCallback - <function()> called when finished
 */
function fillOneDataItemWithEmployeeData(dataItem, fieldToSearch, searchMode, fields, BPServiceURLBase, readyCallback){
	var fieldsForURL = getFieldsOnPrefixFromList(fields, 'E_');	
	// extend E_ with BP manager id and GET manager id fields, and org code field
	fieldsForURL = appendFieldLists(fieldsForURL, 'managerCountryCode&managerSerialNumber&glTeamLead&hrOrganizationCode');
	var dataToSearch = getFormattedDataForSearch(dataItem.SrcData, searchMode);
	var urlStr = BPServiceURLBase.urlTmpForEmployeeSearch.replace('{cond}','('+fieldToSearch+'='+dataToSearch+')').replace('{fields}',fieldsForURL);
	console.log('fillOneDataItemWithEmployeeData.urlStr= '+urlStr);
	request(urlStr, function (error, response, body) {
		var errStr = getErrStrFromResponse(error, response, body); // empty if no error
		if (errStr.length > 0) { // error
			var resultRec = initResultRecord(fields.length, dataItem);
			resultRec[2] = errStr;
			dataItem.resultRecords.push({'record':resultRec, 'extraData':null});	
			readyCallback();
		}
		else {
			putEmployeeDataIntoRecords(dataItem, fields, body);	          // create resultRecords
			retrieveAdditionalData(dataItem, fields, BPServiceURLBase, function(){      // retrieve org, manager, manager org, funct man, funct man org data
				readyCallback();
			});
			
		}		
	});
}

/**
 * lists the fields belong to a given prefix as required in the request url
 * @param fields - <array of string> field name list
 * @param prefix - <string>
 * @returns - <string>: field names without prefix separated by '&'
 */
function getFieldsOnPrefixFromList(fields, prefix){
	var res = "";
	for(var i=0; i < fields.length; i++){
		if (fields[i].indexOf(prefix) == 0){
			if (res.length > 0) res += '&';
			res += fields[i].substr(prefix.length);
		}
	}
	return res;
}

/**
 * Appends the two string and ensures the separator & sign
 * @param f1 <string>
 * @param f2 <string>
 * @returns <string>
 */
function appendFieldLists(f1, f2){
	if (!f1) f1 = '';
	if (!f2) f2 = '';
	var res = f1;
	// separator is needed only when both of the strs are not empty and there is no & at the end of f1
	if ((f1.length > 0) && (f2.length > 0)) {
		if (f1.charAt(f1.length) != "&") res += "&"; 
	} 
	res += f2;
	return res;
}

/**
 * put wildchards into the data as the search mode requires
 * @param data <string>
 * @param searchMode <string>
 * @returns <string>
 */
function getFormattedDataForSearch(data, searchMode){
	var res = data;
	if (searchMode == 'startsWith') res = res+'*';
	if (searchMode == 'endsWith') res = '*'+res;
	if (searchMode == 'contains') res = '*'+res+'*';
	return res;
}

/**
 * Check if there is an error. Returns error text or empty string
 * @param error <object>
 * @param response <object>
 * @param body <string>
 * @returns <string> 
 */
function getErrStrFromResponse(error, response, body){
	var res = '';
	if (error) res = error.message;
	else {			
		if (response.statusCode != 200) res = "response.statusCode="+response.statusCode;
		else {
			var d = JSON.parse(body);
			if (d.search['return'].code != 0) {
				res = 'Error ['+d.search['return'].code+']: '+d.search['return'].message;
			}
		}
	}
	return res;
}

/**
 * Creates an empty array of string with item count defined
 * @param itemCount - <integer> size of the array
 * @param dataItem	- search data as object {index<integer>, data<string>}  function extends this object with the new record data
 * @returns <array of string>
 */
function initResultRecord(itemCount, dataItem){
	var res = [];
	for(var i=0; i < itemCount; i++) res.push('');
	res[0] = dataItem.SrcIndex;
	res[1] = dataItem.SrcData;
	return res;
}


/**
 *  
 * @param dataItem	- <object>: { SrcIndex, SrcData, resultRecords}  result is stored into the resultRecords
 * 				- SrcIndex <integer> - index of the input data
 * 				- SrcData <string> - the input data
 * 				- resultRecords <array of object> {record, extraData} 
 * 					- record <array of string> - the found records at least one
 * 					- extraData <object> for manager ids, orgid
 * @param fields
 * @param body
 */
function putEmployeeDataIntoRecords(dataItem, fields, body){
	var bodyData = JSON.parse(body);
	var db = bodyData.search['return'].count;
	if (db == 0) {		// -- no record found
		var resultRec = initResultRecord(fields.length, dataItem);
		dataItem.resultRecords.push({'record':resultRec, 'extraData':null});
	}
	else { // found
		for(var i=0; i < db; i++){
			var resultRec = initResultRecord(fields.length, dataItem);
			var bodyDataRecord = bodyData.search.entry[i];
			fillResultRecord(resultRec, fields, 'E_', bodyDataRecord);
			
			var bpManId = getFieldValueFromBodyDataRecord(bodyDataRecord,'managerSerialNumber') + getFieldValueFromBodyDataRecord(bodyDataRecord,'managerCountryCode');
			var getManId = getFieldValueFromBodyDataRecord(bodyDataRecord,'glTeamLead');
			var orgId = getFieldValueFromBodyDataRecord(bodyDataRecord,'hrOrganizationCode');
			getManId = extractUidFromFQDN(getManId);
			dataItem.resultRecords.push({'record':resultRec, 'extraData':{'BPManId':bpManId, 'GETManId':getManId, 'orgId':orgId}});
		}		
	}
}

/**
 * Reads the field content from the received object
 * @param bodyDataRecord - <object> the received objects sub object:  search.entry[i]
 * @param fieldName - <string>
 * @returns <string>
 */
function getFieldValueFromBodyDataRecord(bodyDataRecord, fieldName){
	var res = "";
	fieldName = fieldName.toLowerCase();
	var attributes = bodyDataRecord.attribute; // array
	for(var i=0; i < attributes.length; i++){
		if (attributes[i].name.toLowerCase() == fieldName) {
			var v = attributes[i].value;
			if (v){
				//for(var t=0; t < v.length; t++){
				for(var t=0; t < 1; t++){
					if (t > 0) res += ', ';
					res += v[t].toString();
				}
			}
		}
	}
	return res;
}


/**
 * Fills result record with data
 * @param resultRec - <array of string>   this will be filled according to fields
 * @param fields - <array of string> with field names with prefix
 * @param prefix - <string> which prefix is used for the operation
 * @param bodyDataRecord - <object> data from response body only one record
 */
function fillResultRecord(resultRec, fields, prefix, bodyDataRecord){
	for(var i=0; i < fields.length; i++){
		if (fields[i].indexOf(prefix) == 0){ // prefix ok, use this field
			resultRec[i] = getFieldValueFromBodyDataRecord(bodyDataRecord, fields[i].substr(prefix.length));			
		}
	}
}


/**
 * Retrieves employe org, bp man., bp man. org, func. man, func. man. org
 * @param dataItem - <object>: { SrcIndex, SrcData, resultRecords}  result is stored into the resultRecords
 * 				- SrcIndex <integer> - index of the input data
 * 				- SrcData <string> - the input data
 * 				- resultRecords <array of object> {record, extraData} 
 * 					- record <array of string> - the found records at least one
 * 					- extraData <object> for manager ids, orgid
 * @param fields
 * @param BPServiceURLBase - <object> url templates
 * @param readyCallback - <function()>  calls it when ready
 */
function retrieveAdditionalData(dataItem, fields, BPServiceURLBase, readyCallback){
	async.forEachLimit(
			dataItem.resultRecords, 
			1,  // number of threads
			function(resultRecord, readyCallback1){  // request data
				retrieveOneAdditionalData(resultRecord, fields, BPServiceURLBase, function(){
					readyCallback1();			
				});				
			},
			function(err){
				console.log(err);
				readyCallback();
			}
	);
}

/**
 * 
 * Retrieves employe org, bp man., bp man. org, func. man, func. man. org
 * @param resultRecords <array of object> {record, extraData} - this will be modified (filled out) by the function
 * 					- record <array of string> - the found records at least one
 * 					- extraData <object> for manager ids, orgid
 * @param fields
 * @param BPServiceURLBase - <object> url templates
 * @param readyCallback - <function()>  calls it when ready
 */
function retrieveOneAdditionalData(resultRecord, fields, BPServiceURLBase, readyCallback){
	retrieveEmployeeOrgData(resultRecord, fields, BPServiceURLBase, function(){				// employee org data on extraData.orgId
		retrieveManagerData(resultRecord, fields, 'B_', BPServiceURLBase, function(){				// BP man. org data on extraData.BPManId   and its org data internally
			retrieveManagerData(resultRecord, fields, 'G_', BPServiceURLBase, function(){		// Get man. org data on extraData.GETManId   and its org data internally   
				readyCallback();
			});
		});
	});
}

/**
 * 
 * @param resultRecord
 * @param fields
 * @param BPServiceURLBase
 * @param readyCallback
 * @returns
 */
function retrieveEmployeeOrgData(resultRecord, fields, BPServiceURLBase, readyCallback){
	if (resultRecord.extraData) {
		retrieveOrgData(resultRecord, fields, resultRecord.extraData.orgId, 'EO_', BPServiceURLBase, function(){
			readyCallback();
		});
	}
	else{
		readyCallback(); // no code do nothing
	}
}


/**
 * Retrieves org data and fill into resultRecord
 * @param resultRecord
 * @param fields
 * @param orgId
 * @param prefix
 * @param BPServiceURLBase
 * @param readyCallback
 * @returns
 */
function retrieveOrgData(resultRecord, fields, orgId, prefix, BPServiceURLBase, readyCallback){
	var fieldsForURL = getFieldsOnPrefixFromList(fields, prefix);
	if ((fieldsForURL.length > 0) && (! isNullOrEmpty(orgId))) {
		var urlStr = BPServiceURLBase.urlTmpForOrgSearch.replace('{cond}','(hrOrganizationCode='+orgId+')').replace('{fields}',fieldsForURL);
		console.log('retrieveOrgData.urlStr= '+urlStr);
		request(urlStr, function (error, response, body) {
			var errStr = getErrStrFromResponse(error, response, body); // empty if no error
			if (errStr.length > 0) { // error
				resultRecord.record[2] += ' / ' + errStr;
			}
			else {
				var bodyData = JSON.parse(body);
				var db = bodyData.search['return'].count;
				if (db == 0) {		// -- no record found
					resultRecord.record[2] += ' / Found 0 Organizations for hrOrganizationCode=' + orgId;
				}
				else { // found
					var bodyDataRecord = bodyData.search.entry[0];
					fillResultRecord(resultRecord.record, fields, prefix, bodyDataRecord);					
				}			
			} // else
			readyCallback();
		}); // request
	} // if 
	else {
		readyCallback(); // do nothing, because no field requested
	}
}


/**
 * 
 * @param resultRecord
 * @param fields
 * @param prefix <string> - {'B_', 'G_'}
 * @param BPServiceURLBase - <object> url templates
 * @param readyCallback
 */      
function retrieveManagerData(resultRecord, fields, prefix, BPServiceURLBase, readyCallback){
	var fieldsForURL = getFieldsOnPrefixFromList(fields, prefix);	
	var dataToSearch = null;
	if (resultRecord.extraData) {
		dataToSearch = (prefix == 'B_') ? resultRecord.extraData.BPManId : resultRecord.extraData.GETManId;
	}

	if ((! isNullOrEmpty(fieldsForURL)) && (! isNullOrEmpty(dataToSearch))) {  // there are fields and code
		// extend with org code field
		fieldsForURL = appendFieldLists(fieldsForURL, 'hrOrganizationCode');
		var urlStr = BPServiceURLBase.urlTmpForEmployeeSearch.replace('{cond}','(uid='+dataToSearch+')').replace('{fields}',fieldsForURL);
		console.log('retrieveManagerData.urlStr= '+urlStr);
		request(urlStr, function (error, response, body) {
			var errStr = getErrStrFromResponse(error, response, body); // empty if no error
			if (errStr.length > 0) { // error
				resultRecord.record[2] += ' / ' + errStr;
				readyCallback();
			}
			else {
				var bodyData = JSON.parse(body);
				var db = bodyData.search['return'].count;
				if (db == 0) {		// -- no record found
					resultRecord.record[2] += ' / Found 0 '+prefix+'manager for hrOrganizationCode=' + orgId;
					readyCallback();
				}
				else { // found
					var bodyDataRecord = bodyData.search.entry[0];
					fillResultRecord(resultRecord.record, fields, prefix, bodyDataRecord);
					var orgId = getFieldValueFromBodyDataRecord(bodyDataRecord, 'hrOrganizationCode');				
					retrieveOrgData(resultRecord, fields, orgId, prefix.charAt(0)+'O_', BPServiceURLBase, function(){
						readyCallback();
					});	
				}			
			}		
		});
	}
	else {
		readyCallback();  // do nothing
	}
}


function isNullOrEmpty(str){
	var res = false;
	if (! str) res = true;
	else {
		if (str.length == 0) res = true;
	}
	return res;
}


/**
 * 
 * @param s
 */
function extractUidFromFQDN(s){
	var res = '';
	var ss = s.split(',');
	for(var i=0; i < ss.length; i++){
		if (ss[i].indexOf('uid=') == 0) res = ss[i].substr(4);
	}
	return res;
}


/**
 * Creates data stru, extends data array with index number
 * @param d
 * 
 * Returns: array of object { index<integer>, data<string> }
 */
function getData(d){
	var res = [];
	for(var i=0; i < d.length; i++){
		res.push({"index":i, "data":d[i]});
	}	
	return res;
}



// ----------------------------------------------------------------------------

/**
 * Fills the items with group member e-mails and retrieves employee data
 * @param dataItems
 * 		as Input: <array of string>
 * 		as Output: <array of object> {SrcIndex, SrcData, resultRecords}
 * 			- SrcIndex <integer>
 * 			- SrcData <string>
 * 			- resultRecords <array of object> - {record, extraData} 
 * 					- record <array of string> - the found records at least one
 * 					- extraData <object> for manager ids, orgid, memberEMail             - this function fills memberEMail first
 * @param fields
 * @param BPServiceURLBase
 * @param callback - <function(newData)> 
 */
function fillDataItemsWithBGMemberData(dataItems, fields, BPServiceURLBase, callback){
	async.forEachLimit(
			dataItems, 
			10,  // number of threads
			function(dataItem, readyCallback){  // request data
				retrieveMembersOfOneBlueGroup(dataItem, fields, BPServiceURLBase, function(){
					readyCallback();					
				});				
			},
			function(err){
				callback(err);
			}
	);	
}

/**
 * Fills one item with group member e-mails and retrieves employee data, creates resultRecords at least one for each data item
 * @param dataItems
 * 		as Input: <array of string>
 * 		as Output: <array of object> {SrcIndex, SrcData, resultRecords}
 * 			- SrcIndex <integer>
 * 			- SrcData <string>
 * 			- resultRecords <array of object> - {record, extraData} 
 * 					- record <array of string> - the found records at least one
 * 					- extraData <object> for manager ids, orgid, memberEMail             - this function fills memberEMail first
 * @param fields
 * @param BPServiceURLBase
 * @param readyCallback - <function()> 
 */
function retrieveMembersOfOneBlueGroup(dataItem, fields, BPServiceURLBase, readyCallback){
	var urlStr = BPServiceURLBase.urlTmpForGrpSearch.replace('{grpName}',dataItem.SrcData);
	console.log('retrieveMembersOfOneBlueGroup.urlStr= '+urlStr);
	request(urlStr, function (error, response, body) {
		var errStr = getErrStrFromBGResponse(error, response, body); // empty if no error
		if (errStr.length > 0) { // error
			var resultRec = initResultRecord(fields.length, dataItem);
			resultRec[2] = errStr;
			dataItem.resultRecords.push({'record':resultRec, 'extraData':null});	
			readyCallback();
		}
		else {
			putBGDataIntoRecords(dataItem, fields, body);	          // create resultRecords
			fillEmployeeDataOnEMails(dataItem, fields, BPServiceURLBase, function(){   // create result like 	putEmployeeDataIntoRecords(dataItem, fields, body);	 
				retrieveAdditionalData(dataItem.resultRecords, fields, BPServiceURLBase, function(){      // retrieve org, manager, manager org, funct man, funct man org data
					readyCallback();
				});				
			});
		} // else		
	});
}


/**
 * Fills the data item's resultRecords with the employee data as the putEmployeeDataIntoRecords
 * @param dataItem
 * @param fields
 * @param BPServiceURLBase
 * @param callback
 */
function fillEmployeeDataOnEMails(dataItem, fields, BPServiceURLBase, readyCallback){
	async.forEachLimit(
			dataItem.resultRecords, 
			10,  // number of threads
			function(resultRecord, readyCallback1){  // request data
				fillOneEmployeeDataOnEMail(resultRecord, dataItem, fields, BPServiceURLBase, function(){
					readyCallback1();					
				});				
			},
			function(err){
				readyCallback(err);
			}
	);	
}


/**
 * Fills emmloyee data into the resultRecord
 * @param resultRecord
 * @param dataItem
 * @param fields
 * @param BPServiceURLBase
 * @param readyCallback
 */
function fillOneEmployeeDataOnEMail(resultRecord, dataItem, fields, BPServiceURLBase, readyCallback){
	var fieldsForURL = getFieldsOnPrefixFromList(fields, 'E_');	
	// extend E_ with BP manager id and GET manager id fields, and org code field
	fieldsForURL = appendFieldLists(fieldsForURL, 'managerCountryCode&managerSerialNumber&glTeamLead&hrOrganizationCode');
	
	var hasMember = true;
	if (!resultRecord.extraData) hasMember = false;
	else{
		if(isNullOrEmpty(resultRecord.extraData.memberEMail)) hasMember = false;
	}
	
	if (!hasMember) {readyCallback();}
	else{
		var dataToSearch = resultRecord.extraData.memberEMail;
		var urlStr = BPServiceURLBase.urlTmpForEmployeeSearch.replace('{cond}','(mail='+dataToSearch+')').replace('{fields}',fieldsForURL);
		console.log('fillOneEmployeeDataOnEMail.urlStr= '+urlStr);
		request(urlStr, function (error, response, body) {
			resultRecord.record = initResultRecord(fields.length, dataItem);
			var errStr = getErrStrFromResponse(error, response, body); // empty if no error
			if (errStr.length > 0) { // error
				resultRecord.record[2] += errStr;
				readyCallback();
			}
			else {
				putEmployeeDataIntoRecordOnEMail(resultRecord, fields, body);	          // create resultRecords
				retrieveOneAdditionalData(resultRecord, fields, BPServiceURLBase, function(){      // retrieve org, manager, manager org, funct man, funct man org data
					readyCallback();
				});
			}
		});
	}
}


/**
 * similar to putEmployeeDataIntoRecords, but reads only one record and does not create new
 * @param resultRecord
 * @param fields
 * @param body
 */
function putEmployeeDataIntoRecordOnEMail(resultRecord, fields, body){
	var bodyData = JSON.parse(body);
	var db = bodyData.search['return'].count;
	if (db == 0) {		// -- no record found
		;
	}
	else { // found
		var bodyDataRecord = bodyData.search.entry[0];
		
		fillResultRecord(resultRecord.record, fields, 'E_', bodyDataRecord);
			
		var bpManId = getFieldValueFromBodyDataRecord(bodyDataRecord,'managerSerialNumber') + getFieldValueFromBodyDataRecord(bodyDataRecord,'managerCountryCode');
		var getManId = getFieldValueFromBodyDataRecord(bodyDataRecord,'glTeamLead');
		var orgId = getFieldValueFromBodyDataRecord(bodyDataRecord,'hrOrganizationCode');
		getManId = extractUidFromFQDN(getManId);
		resultRecord.extraData.BPManId = bpManId;
		resultRecord.extraData.GETManId = getManId;
		resultRecord.extraData.orgId = orgId;
	}
};


/**
 * Creates resultRecords with extraData with memberEMail
 * @param dataItem
 * @param fields
 * @param body
 */
function putBGDataIntoRecords(dataItem, fields, body){
	var bodyData = JSON.parse(body);
	var db = bodyData.group.length;
	if (db == 0) {		// -- no record found
		var resultRec = initResultRecord(fields.length, dataItem);
		dataItem.resultRecords.push({'record':resultRec, 'extraData': null});
	}
	else { // found
		for(var i=0; i < db; i++){
			var resultRec = initResultRecord(fields.length, dataItem);
			var bodyDataRecord = bodyData.group[i].member;
			dataItem.resultRecords.push({'record':resultRec, 'extraData':{'BPManId':null, 'GETManId':null, 'orgId':null, 'memberEMail': bodyDataRecord}});
		}		
	}
	
}



/**
 * Check if there is an error. Returns error text or empty string
 * @param error <object>
 * @param response <object>
 * @param body <string>
 * @returns <string> 
 */
function getErrStrFromBGResponse(error, response, body){
	var res = '';
	if (error) res = error.message;
	else {			
		if (response.statusCode != 200) res = "response.statusCode="+response.statusCode;
		else {
			var d = JSON.parse(body);
			if (d.rc != 0) {
				res = 'Error ['+d.rc+']: '+d.msg;
			}
		}
	}
	return res;
}



//----------------------------- Exports ---------------------

module.exports.getBpData = getBpData;


