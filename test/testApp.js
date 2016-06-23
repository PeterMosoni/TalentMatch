/**
 * http://usejsdoc.org/
 */


var rewire = require('rewire');
var chai = require('chai');
var expect = chai.expect;
var app = rewire('../app.js');

chai.config.includeStack = false;

describe('app.js', function(){
	
	describe('getServiceURLTemplates', function(){
		
		var envObj = {"app":{"limits":{"mem":256,"disk":1024,"fds":16384},"application_id":"99ff06fd-25f4-4a43-9ce1-aee3b111d370","application_version":"3bc4c64c-28c1-4e60-8b60-10cfc6476273","application_name":"TestBPAccess","application_uris":["testbpaccess.w3ibm.mybluemix.net"],"version":"3bc4c64c-28c1-4e60-8b60-10cfc6476273","name":"TestBPAccess","space_name":"dev","space_id":"eb445d41-01f8-4595-9f38-e3556f18b7ba","uris":["testbpaccess.w3ibm.mybluemix.net"],"users":null,"instance_id":"741ef43135f8444c9a874af3bb4f24eb","instance_index":1,"host":"0.0.0.0","port":62602,"started_at":"2016-02-16 09:34:05 +0000","started_at_timestamp":1455615245,"start":"2016-02-16 09:34:05 +0000","state_timestamp":1455615245},"services":{"user-provided":[{"name":"BPProxy","label":"user-provided","tags":[],"credentials":{"path":"https://eapim.w3ibm.mybluemix.net/common/run/bluepages/","client_id":"f3c859f9-4d80-4d6a-b7aa-d47f352f9a34","client_secret":"eR7wD0gM4lX0tH4xL3sQ7hB2kR1hW7xW3dJ8eW6mL7eY1aT5jX"},"syslog_drain_url":""},{"name":"BGProxy","label":"user-provided","tags":[],"credentials":{"path":"https://eapim.w3ibm.mybluemix.net/common/run/bluegroup","client_id":"d99253c5-b369-4510-bb73-c476f0ec2030","client_secret":"tO2bG7fY3xP7kC0kC6vL7tO8vO5uS5rX5aF6bQ6cH8cW2iS0dM"},"syslog_drain_url":""}],"Auto-Scaling-dedicated":[{"name":"Auto-Scaling-ex","label":"Auto-Scaling-dedicated","tags":["bluemix_extensions","ibm_created","dev_ops","dedicated"],"plan":"Dedicated","credentials":{"service_id":"ad17f710-cccf-4ada-93e9-7e3aff26ce2e","agentPassword":"dbf72d85-6a3d-4561-a7fd-8fb6f30d6eab","agentUsername":"agent","app_id":"99ff06fd-25f4-4a43-9ce1-aee3b111d370","url":"https://Scaling1.w3ibm.bluemix.net"}}]},"isLocal":false,"name":"TestBPAccess","port":62602,"bind":"0.0.0.0","urls":["https://testbpaccess.w3ibm.mybluemix.net"],"url":"https://testbpaccess.w3ibm.mybluemix.net"};
		var envObjLocal = JSON.parse(JSON.stringify(envObj)); envObjLocal.isLocal = true;
		
		getServiceURLTemplates = app.__get__('getServiceURLTemplates'); 

		var returnedObj = getServiceURLTemplates(envObj);
		var returnedObjLocal = getServiceURLTemplates(envObjLocal);

		// --- local		
		it('returns the correct urlTmpForEmployeeSearch for the local environment', function(){
			var expectedStr = "http://bluepages.ibm.com/BpHttpApisv3/"+"slaphapi?ibmperson/{cond}.search/byjson?"+"{fields}";
			expect(expectedStr).to.equal(returnedObjLocal.urlTmpForEmployeeSearch);
		});
		it('returns the correct urlTmpForOrgSearch for the local environment', function(){
			var expectedStr = "http://bluepages.ibm.com/BpHttpApisv3/"+"slaphapi?ibmorganization/{cond}.search/byjson?"+"{fields}";
			expect(expectedStr).to.equal(returnedObjLocal.urlTmpForOrgSearch);
		});
		it('returns the correct urlTmpForGrpSearch for the local environment', function(){
			var expectedStr = "https://eapim.w3ibm.mybluemix.net/common/run/bluegroup/members/{grpName}?client_id=d99253c5-b369-4510-bb73-c476f0ec2030";
			expect(expectedStr).to.equal(returnedObjLocal.urlTmpForGrpSearch);
		});
		
		// --- none local
		it('returns the correct urlTmpForEmployeeSearch for the none local environment', function(){
			var expectedStr = "https://eapim.w3ibm.mybluemix.net/common/run/bluepages/"+"slaphapi/ibmperson/{cond}.search/byjson/"+"{fields}"+"?client_id=f3c859f9-4d80-4d6a-b7aa-d47f352f9a34";
			expect(expectedStr).to.equal(returnedObj.urlTmpForEmployeeSearch);
		});
		it('returns the correct urlTmpForOrgSearch for the none local environment', function(){
			var expectedStr = "https://eapim.w3ibm.mybluemix.net/common/run/bluepages/"+"slaphapi/ibmorganization/{cond}.search/byjson/"+"{fields}"+"?client_id=f3c859f9-4d80-4d6a-b7aa-d47f352f9a34";
			expect(expectedStr).to.equal(returnedObj.urlTmpForOrgSearch);
		});
		it('returns the correct urlTmpForGrpSearch for the none local environment', function(){
			var expectedStr = "https://eapim.w3ibm.mybluemix.net/common/run/bluegroup/members/{grpName}?client_id=d99253c5-b369-4510-bb73-c476f0ec2030";
			expect(expectedStr).to.equal(returnedObj.urlTmpForGrpSearch);
		});

	});
	
	
});


