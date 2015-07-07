/**
 * Created by edt on 7/7/15.
 */

var winston = require('winston');
var http = require('http');
var request = require("request");

var myPool = new http.Agent();
myPool.maxSockets = 5;

function exists ( uri ) {
    //
    //var groups = /https?:\/\/([^\/]+)(\/.*)/i.exec(uri);
    //var left = groups[1];
    //var right = groups[2];
    //
    //winston.log('info', right);
    //winston.log('info', left);
    //
    //var options = {
    //    method: 'HEAD',
    //    host: left,
    //    port: 80,
    //    path: right
    //};
    //
    //var req = http.request(options, function (response) {
    //    winston.log('info', "response ", response.headers);
    //});
    //
    //req.on('socket', function (socket) {
    //    socket.setTimeout(1000);
    //    socket.on('timeout', function() {
    //        winston.log('info', "INCREDIBLE");
    //        req.abort();
    //    });
    //});
    //
    //req.on('error', function(err){
    //    if ( attempt < maximumAttempts ) {
    //        winston.log('info', "fucking js ", uri);
    //        exists(uri, ++attempt);
    //    } else {
    //        winston.log('info', "uri probably does not exists: ", uri);
    //    }
    //});


    request({
      uri: uri,
      method: "HEAD",
      timeout: 1000,
      followRedirect: true,
      maxRedirects: 10,
        pool: myPool,
    }, function(error, response, body) {
        if (error) {
            winston.log("info", error);
            exists(uri);
            return;
        }

        //if ( response.statusCode != 200 )
            winston.log('info', {uri: uri, status: response.statusCode});
    });
}

module.exports = {
    check: exists
};