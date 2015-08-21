/**
 * Created by edt on 7/5/15.
 */

var config = {};

config.db = {};
config.db.username = 'neo4j';
config.db.password = 'neo4j';
config.db.host = 'http://127.0.0.1';
config.db.port = 7474;

config.google = {};
config.google.key = '';

config.email = {};
config.email.provider = 'yahoo';
config.email.address = 'emilio.deltessa@yahoo.com';
config.email.password = 'password';
module.exports = config;
