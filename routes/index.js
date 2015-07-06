var express = require('express');
var router = express.Router();

var db = require('../bin/db');

/* GET home.js page. */
//router.get('/', function(req, res, next) {
//    res.render('index', { title: 'Express' });
//});

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/tunnelbana/', function(req, res, next) {
    db.allStations(function(err, results){
        res.json(results);
    });
});

router.get('/tunnelbana/:line', function(req, res, next) {
    db.allStationsOnLine(req.params.line,function(err, results){
        res.json(results);
    });
});

router.get('/blocket/', function(req, res, next) {
    db.allAds(function(err, results){
        results.sort(function(a,b){
            return a.time < b.time;
        });
        // remove description
        for ( var r in results ) {
            delete results[r].description;
        }
        res.json(results.slice(0,500));
    });
});

router.get('/blocket/statistics/', function(req, res, next) {
    db.allAds(function(err, results){
        var withAddress = 0;
        var stats = {};

        for ( var i in results ) {
            if ( 'address' in results[i] ) {
                withAddress++;
            }
        }

        stats.total = results.length;
        stats.withAddress = withAddress;

        res.json(stats);
    });
});

module.exports = router;
