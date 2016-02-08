/**
 * Created by edt on 7/15/15.
 */

var winston = require('winston');
var async   = require('async');
var config  = require('../config');
var db      = require('./db');
var GoogleMapsAPI = require('googlemaps');

var publicConfig = {
  key: config.google.key,
  stagger_time:       1000, // for elevationPath
  encode_polylines:   false,
  secure:             true, // use https
};
var gmAPI = new GoogleMapsAPI(publicConfig);


module.exports = {
    toRadians: function(angle) {
        return angle / 360.0 * Math.PI;
    },
    distance: function(a, b) { // two coordinates
        // http://www.movable-type.co.uk/scripts/latlong.html
        for ( var i in a ) a[i] = module.exports.toRadians(a[i]);
        for ( var i in b ) b[i] = module.exports.toRadians(b[i]);
        var x = (b.longitude - a.longitude) * Math.cos((a.latitude + b.latitude)/2);
        var y = (b.latitude - a.latitude);
        return Math.sqrt(x*x + y*y) * 6371.0;
    },
    computeDistances: function(ads, callback) {
        db.allStations(function(err, stations){
            var toBeInserted = [];

            for ( i in ads ) {
                // continue only on the georeferenced ads
                if ( !('latitude' in ads[i]) ) {
                    continue;
                }

                var shorterDistance = Infinity;

                for ( j in stations ) {
                    //console.log(stations[j]);
                    //console.log(ads[i]);
                    var ad = {latitude: stations[j].latitude, longitude: stations[j].longitude};
                    var station = {latitude: ads[i].latitude, longitude: ads[i].longitude};
                    var d = module.exports.distance(ad, station);
                    if ( d < 3 ) {
                        toBeInserted.push({
                            label: 'Distance',
                            from: ads[i],
                            relation: {straight: d},
                            to: stations[j]
                        });
                        if ( d < shorterDistance ) {
                            shorterDistance = d;
                        }
                    }
                }
            }

            async.eachSeries(toBeInserted, db.insertRelation, function(err){
                if (err) {
                    throw err;
                }

                // finished
                winston.info("inserted " + toBeInserted.length + " relations in the DB");
                callback(null,ads);
            })
        });
    },
    distanceFromImportant: function (ads, importants, mainCallback) {
        var toBeInserted = [];

        // process only the ones that are geocoded
        adsToProcess = ads.filter(function(ad){
            return ('latitude' in ad) && ('longitude' in ad);
        });

        async.eachSeries(importants, function(important, importantCallback) {
            // for each one of them..
            async.eachSeries(adsToProcess, function(ad, adCallback) {
                // compute the distance from the important
                gmAPI.directions({
                    origin: ad.latitude + ',' + ad.longitude,
                    destination: important.latitude + ',' + important.longitude,
                    mode: 'transit',
                    departure_time: new Date(2016, 02, 8, 8, 30, 0, 0)
                }, 
                // asynchronously
                function(err, res) {
                    if (err) {
                        winston.info(err);
                        throw err;
                    }

                    //winston.info('comuputed distance from important location ' + important.name);

                    if ( res.routes.length != 0 ) {
                        d = res.routes[0].legs[0].duration.value / 60; // in minutes

                        toBeInserted.push({
                            label: 'Duration',
                            from: ad,
                            relation: {transit: d, raw: JSON.stringify(res.routes)},
                            to: important
                        });
                    }

                    setTimeout(function(){
                        adCallback(null);
                    }, 250);
                });
            }, function(err){
                if (err) {
                    throw err;
                }

                winston.info("computed " + adsToProcess.length + " directions to the important location " + important.name);
                importantCallback(null);
            });
        }, function(err){
            if (err) {
                throw err;
            }

            async.eachSeries(toBeInserted, db.insertRelation, function(err){
                if (err) {
                    winston.info(err);
                    throw err;
                }

                // finished
                winston.info("inserted " + toBeInserted.length + " relations in the DB");
                mainCallback(null, ads);
            })
        });
    }
};