/**
 * Created by edt on 7/3/15.
 */


var winston = require('winston');
var ent      = require('ent');
var db       = require('./db');
var Xray     = require('x-ray');
var async    = require('async');
var google   = require('./google');
var distance = require('./distance');

var x = Xray();
x.concurrency(1);
x.timeout(10000);


module.exports = {
    cleanAd: function ( ad ) {
        // remove null entries
        for (var i in ad) {
            if (ad[i] === null || ad[i] === undefined) {
                // test[i] === undefined is probably not very useful here
                delete ad[i];
            } else {
                ad[i] = ent.decode(ad[i]);
                ad[i] = ad[i].replace(/[\t\n]/g, " ").trim();
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

        if ( ad.price ) {
            ad.price = ad.price.replace(/\s/gi, '');
            if ( ad.price.indexOf("kr/mån") != -1 ) {
                ad.price = ad.price.replace(/kr\/mån/i, "") - 0;
            } else {
                delete ad.price;
            }
        }

        ad.time = new Date(ad.time).getTime();

        winston.log("debug", "scraped and cleaned new ad", ad.uri);
        return ad;
    },
    scrapePageDetails: function (ad, callback) {
        module.exports.scraper(ad.uri, '#blocket_content',[{
            address: 'ul.body-links h3.h5',
            description: 'p.object-text',
            coordinates: 'a.map-wrapper img@src'
        }])(function(err, results){
            if (err) {
                winston.error(ad, err);

                module.exports.scrapePageDetails(ad, callback);
                return;
            }

            //ad.description = results[0].description;
            ad.address = results[0].address;
            ad.coordinates = results[0].coordinates;
            ad = module.exports.cleanAd(ad);

            winston.log("info", "scraped ad", ad.uri);
            //db.insertAd(ad);
            callback(null);
        });
    },
    // scrape all the information available for the selected ads
    scrapeDetails: function(ads, callback) {
        async.eachSeries(ads, module.exports.scrapePageDetails, function(err){
            if (err) {
                winston.error(err);
                throw err;
            }

            winston.log("info", ads.length + " ads have been scraped");
            callback(null, ads);
        });
    },
    scrapeIndexPage: function(page, callback) {
        module.exports.scraper(
            'http://www.blocket.se/bostad/uthyres/stockholm?o='+ page +'&f=p&f=c&f=b',
            '.media',
            [{
                uri: '.item_link@href',
                title: '.item_link@html',
                image: 'a.media-object@style',
                time: 'time@datetime',
                rooms: '.li_detail_params.first.rooms@html',
                price: '.li_detail_params.monthly_rent@html',
                size: '.li_detail_params.size@html',
                area: '.subject-param.address.separator',
                type: '.subject-param.category'
            }]
        )(function(err, results) {
            if (err) {
                winston.error(err);

                module.exports.scrapeIndexPage(page, callback);
                return;
            }

            callback(null, results);
        });
    },
    // scrape the index page of Blocket /bostad/uthyres/
    // extracting partial information about each ad
    scrapeIndex: function(callback) {
        pages = [];
        for ( var i = 1; i <= module.exports.pages; ++i ) {
            pages.push(i);
        }

        winston.log("info", "scraping " + pages.length + " index pages");
        async.mapSeries(pages, module.exports.scrapeIndexPage, function(err, results){
            if (err) {
                winston.error(err);
                throw err;
            }

            var ads = [];
            while (results.length) {
                ads = ads.concat(results.shift());
            }

            winston.log("info", "scraped " + ads.length + " ads");
            callback(null, ads);
        });
    },
    scrape: function(callback) {
        module.exports.scrapeIndex(function (err, ads) {
            if (err) {
                winston.error(err);
                throw err;
            }

            db.allAds(function (err, existingAds) {

                // create a "map" for fast lookup by the ad uri
                var existingAdUris = {};
                for (var i in existingAds) {
                    existingAdUris[existingAds[i].uri] = existingAds[i];
                }

                // go on only on the ads that are not in the DB
                ads = ads.filter(function (ad) {
                    if (!(ad.uri in existingAdUris)) {
                        return true;
                    }
                });

                winston.info("scraping details for " + ads.length + " ads.");
                module.exports.scrapeDetails(ads, callback);
            });
        })
    },
    scrapeAndDistance: function(callback) {
        module.exports.scrape(function(err, ads){
            google.geocode(ads, function(err, updatedAds){
                db.insertAds(updatedAds, function(err, insertedAds){
                    distance.computeDistances(insertedAds, callback);
                });
            });
        });
    },
    scraper: x,
    pages: 1
};