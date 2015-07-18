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
        var cypher = "MATCH (n:Ad)-[r:Distance]-(s:Station) WHERE r.straight < 1 AND has(n.latitude) AND s.name = 'Hötorget metro station' RETURN n";

        db.query(cypher, function(err, results) {
            for ( var i in results ) {
                for ( var j in results[i] ) {
                    if ( !('price' in results[i]) )
                    if ( results[i][j] == null ) {
                        delete results[i][j];
                    }
                }
            }

            callback(err,results);
        });
    },
    deleteAdByUri: function (uri, callback) {
        winston.log("info", "deleting uri ", uri );

        db.find({uri: uri}, false, 'Ad', function (err, objs) {
            if (err) {
                winston.log('error', "unable to find node with uri ", uri);
                throw err;
            }

            if (objs.length != 1) {
                winston.log('error', "more than one node with uri ", uri);
                throw { reason: "wtf" };
            }

            db.delete(objs[0].id, function(err) {
                if (err) {
                    winston.log('error', "unable to delete node with uri ", uri);
                }

                callback(null);
            })
        });
    },
    deleteAdsByUri: function (uris, callback) {
        winston.log("info", "deleting " + uris.length + " uris");

        async.eachSeries(uris, module.exports.deleteAdByUri,
        function(err){
            if (err) {
                throw err;
            }

            callback(null, uris);
        });

    },
    // not sure this is the rigth place for this procedure
    clean: function ( callback ) {
        db.nodesWithLabel('Ad', function(err, results) {
            if (err) {
                throw err;
            }

            var uris = [];
            for ( var i in results ) {
                uris.push(results[i].uri);
            }

            winston.info("checking " + uris.length + " uris");
            exists.existsAll(uris, function(err,urisToDelete){
                module.exports.deleteAdsByUri(urisToDelete, callback);
            });
        });
    }
};