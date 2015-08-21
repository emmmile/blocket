var nodemailer = require('nodemailer');
var config = require('../config');

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
    sendMessage: function(subject, body, address, callback) {
        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: 'Blocket.se ' + '<' + config.email.address + '>', // sender address
            to: address, // list of receivers
            subject: subject, // Subject line
            html: module.exports.createBody(body), // plaintext body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
                callback(error);
            }else{
                console.log('Message sent: ' + info.response);
                callback(null,info);
            }
        });
    },
    createBody: function(body) {
        var html = '<div><a href="'+ body.uri +'"><h3>'+ body.title +'</h3></a>';

        if ( body.image ) {
            html += '<br><img src="'+ body.image + '">';
        }

        if ( body.price ) {
            html += '<br><p>'+ body.price + ' SEK/month</p>';
        }
        
        html += '</div>';

        return html;
    }
}