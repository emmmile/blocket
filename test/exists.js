/**
 * Created by edt on 17/8/15.
 */

var should  = require('should');
var exists  = require('../bin/exists');
var sinon   = require('sinon');
var db      = require('../bin/db');
var fs      = require('fs');
var winston = require('winston');


describe('check if ad still exists', function () {
    originalClient = exists.client;
    originalWaitingTime = exists.waitingTime;

    it('should return true', function(done){
        (function(){
            var stub = sinon.stub().yields(null, "response", "body");
            exists.client = stub;
            exists.waitingTime = 0;

            exists.exists("uri",function(err, outcome){
                outcome.should.equal(true);
                done();
            });
        }).should.not.throw();
    });

    it('should return false', function(done){
        (function(){
            var stub = sinon.stub().yields(null, "response", exists.pattern);
            exists.client = stub;
            exists.waitingTime = 0;

            exists.exists("uri",function(err, outcome){
                outcome.should.equal(false);
                done();
            });
        }).should.not.throw();
    });

    it('should return true after some attempts', function(done){
        (function(){
            var stub = sinon.stub();
            stub.onCall(0).yields({code:"error 0"});
            stub.onCall(1).yields({code:"error 1"});
            stub.onCall(2).yields(null, "response", "body");
            exists.client = stub;
            exists.waitingTime = 0;

            exists.exists("uri",function(err, outcome){
                outcome.should.equal(true);
                done();
            });
        }).should.not.throw();
    });

    afterEach(function(done){
        exists.client = originalClient;
        exists.waitingTime = originalWaitingTime;

        done();
    });
});



describe('check if many ads still exist', function () {
    originalClient = exists.client;
    originalWaitingTime = exists.waitingTime;

    it('should return empty', function(done){
        (function(){
            exists.existsAll([],function(err, outcome){
                outcome.length.should.equal(0);
                should.not.exist(err);
                done();
            });
        }).should.not.throw();
    });

    it('should return only one element', function(done){
        (function(){
            var stub = sinon.stub();
            stub.onCall(0).yields(null, "response", "body");
            stub.onCall(1).yields(null, "response", "body");
            stub.onCall(2).yields(null, "response", exists.pattern);
            exists.client = stub;
            exists.waitingTime = 0;

            exists.existsAll(["one", "two", "three"],function(err, outcome){
                outcome.length.should.equal(1);
                outcome[0].should.equal("three");
                should.not.exist(err);
                done();
            });
        }).should.not.throw();
    });

    afterEach(function(done){
        exists.client = originalClient;
        exists.waitingTime = originalWaitingTime;

        done();
    });
});