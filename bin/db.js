/**
 * Created by edt on 7/2/15.
 */

var winston = require('winston');
var config = require('../config');
var exists = require('./exists');
var async = require('async');

db = require("seraph")({
    server: config.db.host + ":" + config.db.port,
    user: config.db.username,
    pass: config.db.password
});

lines = {
    red: ["T13","T14"],
    green: ["T17","T18","T19"],
    blue: ["T10", "T11"]
};

module.exports = {
    insertStation: function ( data ) {
        // data can be any object
        db.save(data, 'Station', function(err, node) {
            if (err) throw err;
        });
    },
    allStations: function ( callback ) {
        // callback takes err, results
        db.nodesWithLabel('Station', callback);
    },
    allStationsOnLine: function ( line, callback ) {
        db.nodesWithLabel('Station', function(err, results){
            var filtered = [];
            var associative = {}; // line -> obj

            if ( line in lines ) {
                for (var r in results) {
                    for ( var l in lines[line] ) {
                        if (results[r].lines.indexOf(lines[line][l]) > -1)
                            filtered.push(results[r]);
                    }
                }
            } else {
                for (var r in results) {
                    if (results[r].lines.indexOf(line) > -1)
                        filtered.push(results[r]);
                }
            }

            callback(err, filtered);
        });
    },
    insertAd: function( ad ) {
        db.save(ad, 'Ad', function(err, node) {
            if ( err ) {
                winston.log("error", "error inserting ad in DB", err);
            }
        });
    },
    insertDistance: function (edge, callback) {
        db.relate(edge.from, 'Distance', edge.to, edge.distance, function(err, rel) {
            if ( err ) {
                winston.log("error", "error creating relationship", err);
            }

            callback();
        });
    },
    allAds: function ( callback ) {
        db.nodesWithLabel('Ad', function(err, results){
            if (err) {
                throw err;
            }

            winston.info("dowloaded " + results.length + " ads from DB");
            callback(err,results);
        });
    },
    allAdsWithCoordinates: function ( callback ) {
        var cypher = "MATCH (n:Ad) WHERE has(n.latitude) RETURN n";

        db.query(cypher, function(err, results) {
            callback(err,results);
        });
    },
    allAdsToDisplay: function ( lineOrColor, distance, price, callback ) {
        var cypher = "MATCH (n:Ad)-[r:Distance]-(s:Station) " +
                     "WHERE n.price <= " + price + " AND r.straight < " + distance + " AND ";
        if ( lineOrColor in lines ) {
            cypher += "(";
            for ( i in lines[lineOrColor] ) {
                cypher += "'" + lines[lineOrColor][i] + "' IN s.lines";
                if ( i != lines[lineOrColor].length - 1 ) {
                    cypher += " OR ";
                }
            }
            cypher += ") ";
        } else {
            // TODO should check that the line exists...
            cypher += "'" + lineOrColor + "' IN s.lines ";
        }

        cypher += "RETURN n";
        winston.info(cypher);

        db.query(cypher, function(err, results) {
            callback(err,results);
        });
    },
    deleteDistances: function (callback) {
        var cypher = "MATCH ()-[r:Distance]-() DELETE r";

        db.query(cypher, function(err, results) {
            callback(err, results);
        });
    },
    deleteAd: function (id, callback) {
        winston.log("info", "deleting ad ", id );

        db.delete(id, true, function(err) {
            if (err) {
                winston.log('error', "unable to delete node with id ", id);
            }

            callback(null);
        });
    },
    deleteAdsById: function (adsToDelete, callback) {
        winston.log("info", "deleting " + adsToDelete.length + " ads");

        async.eachSeries(adsToDelete, module.exports.deleteAd,
        function(err){
            if (err) {
                throw err;
            }

            callback(null, adsToDelete);
        });

    },
    // not sure this is the rigth place for this procedure
    clean: function ( callback ) {
        db.nodesWithLabel('Ad', function(err, results) {
            if (err) {
                throw err;
            }

            results.sort(function(a,b){ return a.time < b.time; });

            var uriToIdMap = {};
            for ( var i in results ) {
                uriToIdMap[results[i].uri] = results[i].id;
            }

            var uris = Object.keys(uriToIdMap);
            winston.info("checking " + uris.length + " uris");
            exists.existsAll(uris, function(err, urisToDelete){
                var adsToDelete = [];
                for ( var i in urisToDelete ) {
                    adsToDelete.push(uriToIdMap[urisToDelete[i]]);
                }

                module.exports.deleteAdsById(adsToDelete, callback);
            });
        });
    }
};