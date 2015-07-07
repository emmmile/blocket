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


module.exports = {
    index: function ( ) {
        var blocket = require('./blocket');
        blocket.scrape();
    },
    clean: function ( ) {
        var db = require('./db');
        db.clean();
    }
};


module.exports.clean();