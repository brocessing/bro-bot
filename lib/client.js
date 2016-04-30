// Require modules
var Log = require('./helpers');
var express = require('express');
var inherits = require('inherits');
var Slack = require('@slack/client');
var bodyParser = require('body-parser');
var EventEmitter = require('eventemitter3');

var log = new Log('Client');

function Client(token) {
  this.TOKEN = token;

  EventEmitter.call(this);
  this._createServer();
  this._setRTM();
  this._setWeb();
}

inherits(Client, EventEmitter);

/**
 * Create the Express based server
 * @param  {integer} port
 * @return {object} this.server
 */
Client.prototype._createServer = function(p) {
  var port = p || 8888;

  // Create server
  this.app = express();
  this.app.use(bodyParser.urlencoded({ extended: false }));
  this.app.use(bodyParser.json());

  // Handle incoming commands
  this._handleCommands();

  // Listen to requests
  this.server = this.app.listen(port);
  log.info('Server listening : port %s', port);
  this.emit('start');

  return this.server;
};

/**
 * Handle the POST commands
 * @return {object} this
 */
Client.prototype._handleCommands = function() {
  var _this = this;

  // POST cmd
  this.app.post('/cmd', function(req, res) {
    log.info('Command received : %s', req.body.command);
    _this.emit('command', req.body, res);
  });
};

/**
 * Create the RTM connection
 */
Client.prototype._setRTM = function() {
  var RtmClient = Slack.RtmClient;
  var RTM_EVENTS = Slack.RTM_EVENTS;

  // Create and start the RTM server
  var rtm = new RtmClient(this.TOKEN, { logLevel: "info" });
  rtm.start();
  log.info('RTM Server starting');

  this.rtm = rtm;
  return rtm;
};

/**
 * Create the Web client connection
 */
Client.prototype._setWeb = function() {
  var WebClient = Slack.WebClient;

  // Create and start the Web server
  var web = new WebClient(this.TOKEN);
  log.info('Web Server starting');

  this.web = web;
  return web;
};

/**
 * Sends a message to a certain channel
 * @param  {string} message
 * @param  {string} channel id
 * @return {object}         response
 */
Client.prototype.post = function(message, channel) {
  var _this = this;

  this.web.chat.postMessage(channel, message, function(err, res) {
    _this.emit('post', err, res);

    if (err) log.error('Message sending failed : %s', err);
    else {
      log.success('Message sent : %s', res);
    }
  });
};

module.exports = Client;
