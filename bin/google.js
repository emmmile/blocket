/**
 * Created by edt on 7/29/15.
 */


var winston = require('winston');
var async   = require('async');
var config  = require('../config');
var geocoderProvider = 'google';
var httpAdapter = 'http';
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);


module.exports = {
    singleGeocode: function (ad, callback) {
        geocoder.geocode({address: ad.address, city: 'Stockholm', country: 'Sweden'}, function(err, res) {
            if (err) {
                throw err;
            }

            if (res.length > 0) {
                winston.info("Geocoded '" + ad.address + "'");
                ad.latitude = res[0].latitude;
                ad.longitude = res[0].longitude;
            }
            callback(null);
        });
    },
    geocode: function (ads, callback) {
        // https://github.com/nchaulet/node-geocoder
        adsToGeocode = ads.filter(function(ad){
            return !('latitude' in ad) && ('address' in ad);
        });

        async.eachSeries(adsToGeocode, module.exports.singleGeocode, function(err){
            if (err) {
                throw err;
            }

            winston.info("geocoded " + adsToGeocode.length + " ads.");
            callback(null, ads);
        });
    }
};