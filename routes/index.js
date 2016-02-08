var express = require('express');
var router = express.Router();
var winston = require('winston');

var db = require('../bin/db');

/* GET home.js page. */
//router.get('/', function(req, res, next) {
//    res.render('index', { title: 'Express' });
//});

// route middleware to validate :line
router.param('line', function(req, res, next, line) {
    winston.info('doing line validation on ' + line);

    var validator = /^(any|red|green|blue|T10|T11|T13|T14|T17|T18|T19)$/;
    if ( validator.test(line) ) {
        req.line = line;
        next();
    } else {
        next("invalid line"); 
    }
});

// route middleware to validate :distance
router.param('distance', function(req, res, next, distance) {
    winston.info('doing distance validation on ' + distance);

    var validator = /^\d+(.\d+)?$/;
    if ( validator.test(distance) ) {
        req.distance = distance;
        next();
    } else {
        next("invalid distance"); 
    }
});

// route middleware to validate :price
router.param('price', function(req, res, next, price) {
    winston.info('doing price validation on ' + price);

    var validator = /^\d+$/;
    if ( validator.test(price) ) {
        req.price = price;
        next();
    } else {
        next("invalid price"); 
    }
});

// route middleware to validate :days
router.param('days', function(req, res, next, days) {
    winston.info('doing days validation on ' + days);

    var validator = /^\d+$/;
    if ( validator.test(days) ) {
        req.days = days;
        next();
    } else {
        next("invalid days"); 
    }
});

// route middleware to validate :duration
router.param('duration', function(req, res, next, duration) {
    winston.info('doing days validation on ' + duration);

    var validator = /^\d+$/;
    if ( validator.test(duration) ) {
        req.duration = duration;
        next();
    } else {
        next("invalid duration"); 
    }
});


router.get('/blocket/map/:duration/:price', function(req, res, next) {
    res.render('index', {
        title: 'Blocket Stockholm',
        duration: req.params.duration,
        price: req.params.price
    });
});

router.get('/blocket/tunnelbana/', function(req, res, next) {
    db.allStations(function(err, results){
        res.json(results);
    });
});

router.get('/blocket/tunnelbana/:line', function(req, res, next) {
    db.allStationsOnLine(req.params.line,function(err, results){
        res.json(results);
    });
});

router.get('/blocket/:duration/:price', function(req, res, next) {
    // db.allAdsToDisplay(req.params.line, req.params.distance, req.params.price, req.params.days, function(err, results){
    //     res.json(results);
    // });

    db.display(req.params.duration, req.params.price,function(err, results){
        res.json(results);
    });
});

router.get('/blocket/debug/', function(req, res, next) {
    // just returns everything
    db.allAds(function(err, results){
        res.json(results);
    });
});

router.get('/blocket/statistics/', function(req, res, next) {
    db.allAds(function(err, results){
        var withAddress = 0;
        var withCoordinates = 0;
        var withPrice = 0;
        var stats = {};

        for ( var i in results ) {
            if ( 'address' in results[i] ) {
                withAddress++;
            }

            if ( 'latitude' in results[i] ) {
                withCoordinates++;
            }

            if ( 'price' in results[i] ) {
                withPrice++;
            }
        }

        stats.total = results.length;
        stats.withAddress = withAddress;
        stats.withCoordinates = withCoordinates;
        stats.withPrice = withPrice;

        res.json(stats);
    });
});

module.exports = router;
