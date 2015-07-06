/**
 * Created by edt on 7/3/15.
 */


var winston = require('winston');
var ent = require('ent');
var db = require('./db');
var Xray = require('x-ray');
var x = Xray();
x.concurrency(1);

function cleanAd ( ad ) {
    // remove null entries
    for (var i in ad) {
        if (ad[i] === null || ad[i] === undefined) {
            // test[i] === undefined is probably not very useful here
            delete ad[i];
        } else {
            ad[i] = ent.decode(ad[i]);
            ad[i] = ad[i].replace(/[\t\n]/g, "").trim();
        }
    }

    if ( ad.image ) {
        ad.image = ad.image.replace(/background-image: url\(/i, "").replace(/\);/i, "");
    }

    if ( ad.coordinates ) {
        var groups = /(\d\d\.\d\d\d+):(\d\d\.\d\d\d+)/i.exec(ad.coordinates);
        ad.latitude = groups[1] - 0;
        ad.longitude = groups[2] - 0;

        delete ad.coordinates;
    }

    ad.time = new Date(ad.time).getTime();

    winston.log("info", "scraped and cleaned new ad", ad);
    return ad;
}

function singlePage (ad, attempt) {
    x(ad.uri, '#blocket_content',[{
        address: 'ul.body-links h3.h5',
        description: 'p.object-text',
        coordinates: 'a.map-wrapper img@src'
    }])(function(err,results){
        if (err) {
            if ( attempt == 3 )
                return;

            singlePage(ad, ++attempt);
            return;
        }

        ad.description = results[0].description;
        ad.address = results[0].address;
        ad.coordinates = results[0].coordinates;
        ad = cleanAd(ad);

        winston.log("debug", "inserted ad in DB");
        db.insertAd(ad);
    });
}


function scrapeIndex(start, end, attempts, callback) {
    scrapeIndexRecursive(start, end, attempts, [], callback);
}

function scrapeIndexRecursive(page, end, attempts, results, callback) {
    //console.log("Downloading page " + page + " (attempt: " + attempts + ")");

    x('http://www.blocket.se/bostad/uthyres/stockholm?o='+ page +'&f=p&f=c&f=b', '.media', [{
        uri: '.item_link@href',
        title: '.item_link@html',
        image: 'a.media-object@style',
        time: 'time@datetime',
        rooms: '.li_detail_params.first.rooms@html',
        price: '.li_detail_params.monthly_rent@html',
        size: '.li_detail_params.size@html',
        area: '.subject-param.address.separator',
        type: '.subject-param.category'
    }])(function(err, res) {
        if (err) {
            // TODO depending on the error, not always!!
            if (attempts == 5)
                throw err;

            if (page < end) {
                scrapeIndexRecursive(page, end, ++attempts, results, callback);
            }
            return;
        }

        for ( var i in res )
            results.push(res[i]);

        if ( ++page <= end )
            scrapeIndexRecursive(page, end, 0, results, callback);
        else
            callback(err, results);
    });
}


module.exports = {
    scrape: function(){
        scrapeIndex(1, 3, 0, function (err, ads) {
            if (err) throw err;

            winston.log("info", "downloaded " + ads.length + " ads");

            db.allAds(function (err, dbAds) {
                // create associative map, for efficient lookup
                var associative = {};
                for (var i in dbAds) {
                    associative[dbAds[i].uri] = dbAds[i];
                }

                var inserted = 0;
                for (var i in ads) {
                    if (ads[i].uri in associative) {
                        // skip
                    } else {
                        singlePage(ads[i], 0);
                        inserted++;
                    }
                }

                winston.log("info", "there are " + inserted + " ads that have to be scraped");
            });
        });
    }
};