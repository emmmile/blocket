/**
 * Created by edt on 7/3/15.
 */


//var tunnelbana = require('./tunnelbana');
//function dumpStation ( station ) {
//    console.log(JSON.stringify(station));
//
//    db.insertStation(station);
//}
//
//db.allStations(function(err, stations){
//    if (err) throw err;
//    tunnelbana.downloadStationsFromCategory('Stockholm_metro_stations', stations, dumpStation);
//});


var blocket  = require('./blocket');
var db       = require('./db');
var distance = require('./distance');
var async    = require('async');
var winston  = require('winston');
var tunnelbana = require('./tunnelbana');

// tunnelbana.downloadStationsFromCategory("Stockholm_metro_stations", [], db.insertStation);

async.series([
    function(callback){ blocket.scrapeAndDistance(callback); },
    function(callback){ db.clean(callback); }
], function(err, results){
    winston.log("info", "finished.");
});

