/**
 * Created by edt on 7/1/15.
 *
 * Get the location of all Tunnelbana stations from Wikipedia.
 */

var bot = require('nodemw');
var geolib = require('geolib');
var client = new bot({
    server: 'en.wikipedia.org',  // host name of MediaWiki-powered site
    path: '/w',                  // path to api.php script
    debug: false,                // is more verbose when set to true
    concurrency: 10
});


function parseCoordinates(station, content) {
    var coordinates = content.match(/\{\{coord.+\}\}/i)[0];

    if (coordinates.indexOf("format=dms") > -1) {
        var groups = /coord ?\|(\d+\.\d+)(\|\w)?\|(\d+\.\d+)(\|\w)?/i.exec(coordinates);
        station.latitude = groups[1];
        station.longitude = groups[3];
    } else {
        var groups = /coord ?\|(\d+)\|(\d+)\|(\d+(\.\d+)?)\|\w\|(\d+)\|(\d+)\|(\d+(\.\d+)?)\|\w/i.exec(coordinates);
        station.latitude = groups[1] + "° " + groups[2] + "' " + groups[3] + "\" N";
        station.longitude = groups[5] + "° " + groups[6] + "' " + groups[7] + "\" E";
    }

    station.latitude = geolib.useDecimal(station.latitude);
    station.longitude = geolib.useDecimal(station.longitude);
}

function parseLines(station, content) {
    var lineRE = /line=(T\d\d) line\|/g;
    var results;

    station.lines = [];
    while ((results = lineRE.exec(content)) !== null) {
        station.lines.push(results[1]);
    }
}

function downloadStation(title, saveStation) {
    client.getArticle(title, function (err, data) {
        if (err) {
            //console.error(err);
            downloadStation(title, saveStation);
            return;
        }

        // download the data from Wikipedia
        var station = {};

        parseCoordinates(station, data);
        parseLines(station, data);
        station.name = title;

        saveStation(station);
    });
}

function downloadStations (pages, alreadyInserted, saveStation) {
    //console.log(pages);

    pages.forEach(function (page) {
        var found = false;
        for ( var inserted in alreadyInserted ) {
            if ( alreadyInserted[inserted].name == page.title ) {
                found = true;
                break;
            }
        }

        if ( !found ) {
            downloadStation(page.title, saveStation);
        } else {
            //console.log(page.title + " is already in the DB.");
        }
    });
}


function downloadStationsFromCategory (category, alreadyInserted, saveStation) {
    client.getPagesInCategory(category, function (err, pages) {
        if (err) {
            //console.error(err);
            downloadStationsFromCategory(category, alreadyInserted, saveStation);
            return;
        }
        downloadStations(pages, alreadyInserted, saveStation);
    });
}


module.exports = {
    downloadStationsFromCategory: downloadStationsFromCategory,
    downloadStations: downloadStations,
    downloadStation: downloadStation,
    parseLines: parseLines,
    parseCoordinates: parseCoordinates,
    mediaWikiClient: client
};
