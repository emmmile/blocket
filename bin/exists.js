/**
 * Created by edt on 7/7/15.
 */

var winston = require('winston');
var http = require('http');
var request = require("request");
var async = require("async");

var connectionPool = new http.Agent();
connectionPool.maxSockets = 2;

function makeOptions ( uri ) {
    return {
        uri: uri,
        method: "GET",
        timeout: 5000,
        followRedirect: true,
        maxRedirects: 10,
        pool: connectionPool
    };
}

module.exports = {
    exists: function (uri, callback) {
        module.exports.client(makeOptions(uri), function (error, response, body) {
            if (error) {
                if (error.code != 'ENOTFOUND') {
                    // try again
                    // winston.log('info', "trying again", error);
                    module.exports.exists(uri, callback);
                    return;
                } else {
                    // url does no exist
                    if (uri == null) {
                        winston.error("WTF, uri is null???");
                        callback(null, false);
                        return;
                    }

                    callback(null, false);
                    return;
                }
            }

            setTimeout(function () {
                var doExists = body.indexOf(module.exports.pattern) == -1;
                winston.log('info', {status: doExists, uri: uri});

                callback(null, doExists);
            }, module.exports.waitingTime);
        });
    },
    existsAll: function (uris, callback) {
        async.mapSeries(uris, module.exports.exists, function(err, results) {
            if (err) {
                throw err;
            }

            urisToDelete = [];
            for ( var i = 0; i < results.length; ++i ) {
                if ( results[i] == false ) {
                    urisToDelete.push(uris[i]);
                }
            }

            callback(null, urisToDelete);
        });
    },
    client: request,
    waitingTime: 50,
    pattern: 'Hittade inte annonsen&hellip;'
};