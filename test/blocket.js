/**
 * Created by edt on 7/8/15.
 */

var should  = require('should');
var blocket = require('../bin/blocket');
var sinon   = require('sinon');
var db      = require('../bin/db');
var fs      = require('fs');
var winston = require('winston');

// TODO: where to put this???
winston.remove(winston.transports.Console);


function getSampleAd() {
    return {
        xxx: null,
        asd: undefined,
        image: "background-image: url(http://cdn.blocket.com/static/0/images_235x162_portrait/24/2469780851.jpg);",
        coordinates: "http://external.api.hitta.se/image/v2/0/15/59.351898:18.150828?width=727&height=317&markers=" +
        "%7B%22pn%22%3A%5B59.351898%5D%2C%22pe%22%3A%5B18.150828%5D%2C%22marker%22%3A%22http%3A%2F%2Fwww.blocket." +
        "se%2Fimg%2Fbostad%2Fmap_pin.png%22%2C%22mox%22%3A6%2C%22moy%22%3A-21%7D&logo={}",
        time: "2015-07-08 09:52:43",
        description: "\n\ta very\nlong one\n\t",
        another: "this field will remain the same"
    }
}

function getSampleDetails() {
    return {
        0: {
            description: getSampleAd().description,
            address: "Sveavagen 46",
            coordinates: getSampleAd().coordinates
        }
    }
}

describe('ad cleaning', function () {
    it('should remove null and undefined variables', function(){
        (function(){
            var sample = getSampleAd();
            blocket.cleanAd(sample);
            sample.should.not.have.property('xxx');
            sample.should.not.have.property('asd');
        }).should.not.throw();
    });

    it('should clean image uris', function(){
        (function(){
            var sample = getSampleAd();
            blocket.cleanAd(sample);
            sample.should.have.property('image','http://cdn.blocket.com/static/0/images_235x162_portrait/24/2469780851.jpg');
        }).should.not.throw();
    });

    it('should extract coordinates', function(){
        (function(){
            var sample = getSampleAd();
            blocket.cleanAd(sample);
            sample.should.have.property('latitude',59.351898);
            sample.should.have.property('longitude',18.150828);
            sample.should.not.have.property('coordinates');
        }).should.not.throw();
    });

    it('should keep additional fields', function(){
        (function(){
            var sample = getSampleAd();
            blocket.cleanAd(sample);
            sample.should.have.property('another',"this field will remain the same");
        }).should.not.throw();
    });

    it('should replace \\n, \\t and trim strings', function(){
        (function(){
            var sample = getSampleAd();
            blocket.cleanAd(sample);
            sample.should.have.property('description',"a very long one");
        }).should.not.throw();
    });

    it('should work with missing fields', function(){
        (function(){
            var sample = getSampleAd();
            sample.coordinates = undefined;
            blocket.cleanAd(sample);
            sample.should.not.have.property('longitude');
            sample.should.not.have.property('coordinates');

            sample = getSampleAd();
            sample.image = null;
            blocket.cleanAd(sample);
            sample.should.not.have.property('image');
        }).should.not.throw();
    });
});






describe('ad scraping', function () {
    var ad = getSampleAd();
    var details = getSampleDetails();
    var error = null;
    var originalScraper = blocket.scraper;

    before(function(done){
        var stub = sinon.stub();
        stub.returns(function(callback){callback(error,details);});
        blocket.scraper = stub;
        done();
    });

    it('should extract fields correctly', function(){
        (function(){
            blocket.scrapePageDetails(ad,function(err,callback){
                ad.should.have.property('longitude');
                ad.should.not.have.property('coordinates');
            });
        }).should.not.throw();
    });

    it('should throw', function(){
        (function(){
            error = "some horror";
            blocket.scrapePageDetails(ad,function(err,callback){
            });
            error = null;
        }).should.throw();
    });

    after(function(done){
        blocket.scraper = originalScraper;
        done();
    });
});








function getSampleAds() {
    return [{
        uri: "one"
    }, {
        uri: "two"
    }, {
        uri: "three"
    }];
}

function getSampleAdsDB() {
    return [{
        uri: "three"
    }];
}

function getIndexCallback (results) {
    return function(callback){
        callback(null, results);
    };
}

function getDetailsCallback (resultString) {
    return function(callback){
        callback(null, [{
            description: resultString + " description",
            address: resultString + " address"
        }])
    };
}


describe('blocket whole index scraping', function () {
    var ads = getSampleAds();
    var adsDB = getSampleAdsDB();
    var originalScraper = blocket.scraper;

    beforeEach(function(done){
        // mocking successive calls to the scraper
        var stub = sinon.stub();

        // calling the scraper the first time will get you some ads
        stub.onCall(0).returns(getIndexCallback(ads));
        // mock the other calls for the index
        for ( var i = 1; i < blocket.pages; ++i ) {
           stub.onCall(i).returns(getIndexCallback([]));
        }

        // mock the calls for the details
        stub.onCall(5).returns(getDetailsCallback("one"));
        stub.onCall(6).returns(getDetailsCallback("two"));
        blocket.scraper = stub;


        // don't want to stub the whole DB because I need this:
        var dbStub = sinon.stub(db, 'allAds');
        dbStub.yields(null, adsDB);

        // while I don't want to insert test shit in the DB
        var dbInsertStub = sinon.stub(db,'insertAd');
        done();
    });

    it('should not throw and insert partially', function(){
        (function(){
            blocket.scrape(function(err, scraped){
                scraped.length.should.equal(2);
                scraped[0].should.have.property(uri, "one");
                scraped[0].should.have.property(description, "one description");
                scraped[1].should.have.property(uri, "two");
            });
        }).should.not.throw();
    });

    afterEach(function(done){
        blocket.scraper = originalScraper;
        done();
    });
});