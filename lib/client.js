// Require modules
var Log = require('./logger');
var express = require('express');
var inherits = require('inherits');
var actions = require('./commands');
var Slack = require('@slack/client');
var bodyParser = require('body-parser');
var EventEmitter = require('eventemitter3');

var log = new Log('Client');

function Client(token) {
  this.TOKEN = token;
  this.ACTIONS = actions;

  EventEmitter.call(this);
  this._createServer();
  this._setRTM();
  this._setWeb();
  this._handleMessages();

  // A little error logger
  this.on('error', function (err) {
    log.error('Something went wrong : %s', err)
  });

  return this;
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
  log.success('Server listening : port %s', port);
  this.emit('start');

  return this.server;
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
  log.success('RTM Server starting');

  this.rtm = rtm;
  return this.rtm;
};

/**
 * Create the Web client connection
 */
Client.prototype._setWeb = function() {
  var WebClient = Slack.WebClient;

  // Create and start the Web server
  var web = new WebClient(this.TOKEN);
  log.success('Web Server starting');

  this.web = web;
  return this.web;
};

/**
 * Handle the POST commands
 * @return {object} this
 */
Client.prototype._handleCommands = function() {
  var _this = this;

  // POST cmd
  this.app.post('/cmd', function (req, res) {
    log.info('Command received : %s', req.body.command);
    _this.emit('command', req.body, res);

    // Use the right action
    _this.ACTIONS[req.body.command](_this, req.body);

    // Send an empty response
    res.send('');
  });

  return this;
};

/**
 * Handle messages
 */
Client.prototype._handleMessages = function() {
  var _this = this;

  this.messages = {
    post: function (opts, callback) {
      _this.web.chat.postMessage(
        opts.channel,
        opts.text,
        { attachments: opts.attachments },
        function (err, res) {
          if (err) _this.emit('error', err);
          else if (res) {
            _this.emit('message', res);
            if (callback) callback(res);
          }
      });
    },
    react: function (emoji, opts, callback) {
      _this.web.reactions.add(
        emoji,
        {
          channel: opts.channel,
          timestamp: opts.ts
        },
        function (err, res) {
          if (err) _this.emit('error', err);
          else if (res) {
            _this.emit('reaction', res);
            if (callback) callback(res);
          }
      });
    }
  };
};

module.exports = Client;
