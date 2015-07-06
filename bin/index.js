/**
 * Created by edt on 7/3/15.
 */

var db = require('./db');
var tunnelbana = require('./tunnelbana')
var blocket = require('./blocket')

function dumpStation ( station ) {
    console.log(JSON.stringify(station));

    db.insertStation(station);
}

db.allStations(function(err, stations){
    if (err) throw err;
    tunnelbana.downloadStationsFromCategory('Stockholm_metro_stations', stations, dumpStation);

    blocket.scrape();
});