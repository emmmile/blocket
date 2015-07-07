/**
 * Created by edt on 7/7/15.
 */

var winston = require('winston');
var http = require('http');
var request = require("request");

var connectionPool = new http.Agent();
connectionPool.maxSockets = 5;

var waitingTime = 500; // waiting time between one connection and the other

function makeOptions ( uri ) {
    return {
        uri: uri,
        method: "GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10,
        pool: connectionPool
    };
}

function exists ( uri, callback ) {
    request(makeOptions(uri), function(error, response, body) {
        if (error) {
            if ( error.code != 'ENOTFOUND' )
                exists(uri, callback);
            else {
                winston.log('info', {status: false, uri: uri});
                callback(uri, false);
            }
            return;
        }

        winston.log('info', {status: body.indexOf("Hittade inte annonsen&hellip;") == -1, uri: uri});
        callback(uri, true);
    });
}

function existsWrapper ( uris, index, resultMap, done ) {
    if ( index >= uris.length ) {
        done(resultMap);
        return;
    }

    exists(uris[index], function(uri, outcome){
        resultMap[uri] = outcome;
        setTimeout(function() {
            existsWrapper(uris, index+1, resultMap, done);
        }, waitingTime);
    });
}

function existsAll ( uris, callback ) {
    return existsWrapper(uris, 0, {}, callback);
}

module.exports = {
    check: exists,
    checkAll: existsAll
};