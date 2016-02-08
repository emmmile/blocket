#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var blocket = require('./blocket');
var debug = require('debug')('blocket:server');
var http = require('http');
var async = require('async');
var winston = require('winston');
var db = require('./db');
var tunnelbana = require('./tunnelbana');
var argv = require('minimist')(process.argv.slice(2));
var CronJob = require('cron').CronJob;


/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

/**
 * First time initialization.
 */
if ( argv["initialize"] == true ) {
  async.series([
      function(callback) {
        db.allStations( function(err, currentStations) {
          winston.info("downloading tunnelbana stations for the first time");
          tunnelbana.downloadStationsFromCategory("Stockholm_metro_stations", currentStations, db.insertStation, callback);
        });
      },
      function(callback) {
        winston.info("insterting office location");
        db.insertImportantLocation({name: 'Spotify', latitude: 59.342206, longitude: 18.063681}, callback);
      },
      function(callback) {
        winston.info("cleaning old ads");
        db.clean(callback);
      },
      function(callback) {
        winston.info("scraping whole blocket");
        blocket.scrapeAndDistance(50, callback);
      }
  ], function(err, results){
      winston.info("finished.");
  });
}

/**
 * Jobs that are run periodically.
 */
new CronJob('0 */10 * * * *', function() {
  var blocket = require('./blocket');
  blocket.scrapeAndDistance(3, function(err,res){});
  //var mailer = require('./mailer');
  //blocket.scrapeAndDistance(mailer.sendNotifications);
}, null, true, 'Europe/Rome');


new CronJob('0 0 */20 * * *', function() {
  var db = require('./db');
  db.clean(function(err, res){});
}, null, true, 'Europe/Rome');


