var Log = require('../logger');
var inherits = require('inherits');
var EventEmitter = require('eventemitter3');

var log = new Log('Vote');

/**
 * The vote module
 */
function Vote(_app, opts) {
  this.app = _app;
  this.actions = _app.messages;
  this.opts = opts;

  this.messages = {};

  // Start speaking
  EventEmitter.call(this);
  this._setupMessage();

  return this;
}

inherits(Vote, EventEmitter);

/**
 * Create the vote messages
 */
Vote.prototype._setupMessage = function() {
  this.messages.setup = {
    channel: this.opts.channel_id,
    text: 'Let\'s cast a vote!',
    attachments: [{
      fallback: this.opts.user_name + ' is asking : ' + this.opts.text,
      color: '#3498db',
      author_name: '@' + this.opts.user_name + ' is asking',
      title: this.opts.text,
      text: 'Vote before it\'s too late!'
    }]
  };
  var _this = this;

  this.actions.post(this.messages.setup, function (res) {
    // Add timestamp to the message
    _this.messages.setup.ts = res.ts;

    // Duplicate the message for dangerless updates
    _this.messages.sent = _this.messages.setup;

    // Add emoji buttons
    _this.actions.react('white_check_mark', _this.messages.setup);
    _this.actions.react('no_entry_sign', _this.messages.setup);

    // Log it
    log.success('The vote has been initialized by %s', _this.opts.user_name);
    _this.emit('start', _this.opts);

    // Start the vote
    _this.start();
  });
};

/**
 * Start the vote
 */
Vote.prototype.start = function() {
  var _this = this;
  this.timer(60000);

  this.app.rtm.on(this.app.EVENTS.REACTION_ADDED, function(res) {
    log.success('%s added a reaction', res.user);
    _this.emit('reaction', res);

    _this._handleVotes(res);
  });

  // Listen to the timeout
  this.on('timeout', function(opts) {
    log.info('The vote initialized by %s has ended', opts.user_name);
    _this._resultMessage();
  });
};

/**
 * Listen to the votes
 */
Vote.prototype._handleVotes = function(vote) {
  this.name(vote.user, function (info) {
    log.info('%s just voted', info.name);
    vote.user = info;
    log.success('That\'s a new vote : %s', JSON.stringify(vote));
  });
};

/**
 * Display the results
 */
Vote.prototype._resultMessage = function() {
  this.messages.result = {
    channel: this.opts.channel_id,
    text: 'The vote has ended!',
    attachments: [{
      fallback: 'The vote has ended!',
      color: '#3498db',
      author_name: '@' + this.opts.user_name + ' asked',
      title: this.opts.text,
      text: 'The vote is canceled!'
    }]
  };
  var _this = this;

  this.actions.post(this.messages.result, function (res) {
    // Add timestamp to the message
    _this.messages.result.ts = res.ts;

    // Log it
    log.success('The vote has ended!');
    _this.emit('end', _this.opts);
  });
};

/**
 * Emit whan the time is right
 */
Vote.prototype.timer = function(time) {
  var _this = this;
  setTimeout(function() {
    log.error('Timeout : The vote has ended');
    _this.emit('timeout', _this.opts);
  }, time);
  return time;
};

/**
 * Let's find who that is
 */
Vote.prototype.name = function(user, callback) {
  this.app.web.users.info(user, function(err, res) {
    if (err) _this.emit('error', err);
    else if (res && callback(res)) callback(res);
  });
};

module.exports = Vote;
