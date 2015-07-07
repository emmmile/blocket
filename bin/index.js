/**
 * Created by edt on 7/3/15.
 */


var blocket = require('./blocket');
var db = require('./db');


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

        db.clean();

module.exports = {
    index: function ( ) {
        blocket.scrape();

        db.clean();
    }
};