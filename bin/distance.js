/**
 * Created by edt on 7/15/15.
 */

var winston = require('winston');
var async   = require('async');

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
        var db = require('./db');

        db.allStations(function(err, stations){
            var toBeInserted = [];

            for ( i in ads ) {
                // continue only on the georeferenced ads
                if ( !('latitude' in ads[i]) ) {
                    continue;
                }

                for ( j in stations ) {
                    //console.log(stations[j]);
                    //console.log(ads[i]);
                    var ad = {latitude: stations[j].latitude, longitude: stations[j].longitude};
                    var station = {latitude: ads[i].latitude, longitude: ads[i].longitude};
                    var d = module.exports.distance(ad, station);
                    if ( d < 3 ) {
                        toBeInserted.push({
                            from: ads[i],
                            distance: {straight: d},
                            to: stations[j]
                        });
                    }
                }
            }

            async.eachSeries(toBeInserted, db.insertDistance, function(err){
                if (err) {
                    throw err;
                }

                // finished
                winston.info("inserted " + toBeInserted.length + " distances in the DB");
                callback(null,{});
            })
        });
    }
};