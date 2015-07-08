/**
 * Created by edt on 7/8/15.
 */


var should  = require('should');
var blocket = require('../bin/blocket');
var sinon   = require('sinon');
var fs      = require('fs');



// npm install mocha --save-dev
describe('ad cleaning', function () {
    function getSample() {
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

    it('should remove null and undefined variables', function(){
        (function(){
            var sample = getSample();
            blocket.cleanAd(sample);
            sample.should.not.have.property('xxx');
            sample.should.not.have.property('asd');
        }).should.not.throw();
    });

    it('should clean image uris', function(){
        (function(){
            var sample = getSample();
            blocket.cleanAd(sample);
            sample.should.have.property('image','http://cdn.blocket.com/static/0/images_235x162_portrait/24/2469780851.jpg');
        }).should.not.throw();
    });

    it('should extract coordinates', function(){
        (function(){
            var sample = getSample();
            blocket.cleanAd(sample);
            sample.should.have.property('latitude',59.351898);
            sample.should.have.property('longitude',18.150828);
            sample.should.not.have.property('coordinates');
        }).should.not.throw();
    });

    it('should keep additional fields', function(){
        (function(){
            var sample = getSample();
            blocket.cleanAd(sample);
            sample.should.have.property('another',"this field will remain the same");
        }).should.not.throw();
    });

    it('should replace \\n, \\t and trim strings', function(){
        (function(){
            var sample = getSample();
            blocket.cleanAd(sample);
            sample.should.have.property('description',"a very long one");
        }).should.not.throw();
    });

    it('should work with missing fields', function(){
        (function(){
            var sample = getSample();
            sample.coordinates = undefined;
            blocket.cleanAd(sample);
            sample.should.not.have.property('longitude');
            sample.should.not.have.property('coordinates');

            sample = getSample();
            sample.image = null;
            blocket.cleanAd(sample);
            sample.should.not.have.property('image');
        }).should.not.throw();
    });
});
