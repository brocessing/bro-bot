/**
 * Require and handle the Bro instance
 */

var Log = require('./lib/logger');
var Bro = require('./lib/client');

// Get the token
var TOKEN = process.env.SLACK_API_TOKEN || '';

// Initialize all the things
var log = new Log('Server');
var bro = new Bro(TOKEN);
