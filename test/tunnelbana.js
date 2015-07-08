/**
 * Created by edt on 7/2/15.
 */

'use strict';

var should     = require('should');
var tunnelbana = require('../bin/tunnelbana');
var sinon      = require('sinon');
var fs         = require('fs');


// npm install mocha --save-dev
describe('wikimedia coordinates parsing', function () {
    var coordinatesSample = "{{coord|59|22|31|N|17|58|09|E|display=inline,title}}";

    it('should normalize coordinates', function(){
        (function(){
            var station = {};
            tunnelbana.parseCoordinates(station, coordinatesSample);
            station.should.have.property('latitude', 59.37527778);
            station.should.have.property('longitude', 17.96916667);
        }).should.not.throw();
    });

    it('should throw error', function(){
        (function(){
            var station = {};
            tunnelbana.parseCoordinates(station, "");
        }).should.throw();
    });
});



describe('wikimedia lines parsing', function () {
    var linesSample = "| services      = {{s-rail|title=STM}} {{s-line|system=STM|line=T10 line|" +
        "previous=Kungsträdgården|next=Rådhuset|rows1=2}} {{s-line|system=STM|line=T11 line|" +
        "previous=Kungsträdgården|next=Rådhuset|hide1=yes}} {{s-line|system=STM|line=T13 line|" +
        "previous=Gamla stan|next=Östermalmstorg}} {{s-line|system=STM|line=T14 line|" +
        "previous=Gamla stan|next=Östermalmstorg}} {{s-line|system=STM|line=T17 line|" +
        "previous=Hötorget|next=Gamla stan}} {{s-line|system=STM|line=T18 line|" +
        "previous=Hötorget|next=Gamla stan}} {{s-line|system=STM|line=T19 line|" +
        "previous=Hötorget|next=Gamla stan}} | map_locator   = [[File:T-Centralen Tunnelbana G.png|270px]]";

    it('should extract several lines', function(){
        (function(){
            var station = {};
            tunnelbana.parseLines(station, linesSample);
            station.should.have.property('lines', ["T10","T11","T13","T14","T17","T18","T19"]);
        }).should.not.throw();
    });

    it('should not throw error', function(){
        (function(){
            var station = {};
            tunnelbana.parseLines(station, "");
            station.should.have.property('lines', []);
        }).should.not.throw();
    });
});



describe('wikipedia station download', function () {
    var sampleName = "Östermalmstorg metro station";
    var content = fs.readFileSync('./test/files/exampleStation', 'utf8');

    before(function(done){
        var stub = sinon.stub(tunnelbana.mediaWikiClient, 'getArticle');
        stub.withArgs(sampleName).yields(null, content);
        done();
    });

    it('should extract fields correctly', function(){
        (function(){
            tunnelbana.downloadStation(sampleName,function(station) {
                station.should.have.property('latitude', 59.33472222);
                station.should.have.property('longitude', 18.07388889);
                station.should.have.property('lines', ["T13", "T14"]);
                station.should.have.property('name', "Östermalmstorg metro station");
            });
        }).should.not.throw();
    });
});
