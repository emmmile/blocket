var nodemailer = require('nodemailer');
var config     = require('../config');
var winston    = require('winston');
var async      = require('async');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: config.email.provider,
    auth: {
        user: config.email.address,
        pass: config.email.password
    }
});

// NB! No need to recreate the transporter object. You can use
// the same transporter object for all e-mails


module.exports = {
    sendNotifications: function (err, res) {
        if (err) {
            throw err;
        }

        var mailer = require('./mailer');

        async.eachSeries(res, function(ad, callback){
            // if ( ad.price < config.notification.filter.price && ad.shorterDistance < 3 ) {
                mailer.sendNotification(ad, config.notification.address, function(err,res){
                    if (err) {
                        throw err;
                    }

                    callback();
                });
            // }
        }, function(err) {
            if (err) {
                throw err;
            }

            winston.info("sent " + res.length + " e-mail notifications" );
        });
    },
    sendNotification: function(ad, address, callback) {
        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: 'Blocket.se ' + '<' + config.email.address + '>', // sender address
            to: address, // list of receivers
            subject: ad.title, // Subject line
            html: module.exports.createBody(ad), // plaintext body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
                callback(error);
            }else{
                winston.info('sent e-mail notification', info.response);
                callback(null,info);
            }
        });
    },
    createBody: function(ad) {
        var html = '<div><a href="'+ ad.uri +'"><h3>'+ ad.title +'</h3></a>';

        if ( ad.image ) {
            html += '<br><img src="'+ ad.image + '">';
        }

        if ( ad.area ) {
            html += '<br><p>'+ ad.area + '</p>';
        }

        if ( ad.price ) {
            html += '<br><p>'+ ad.price + ' SEK/month</p>';
        }

        html += '</div>';

        return html;
    }
}