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
  this.results = {
    question: opts.text,
    author: this.opts.user_name,
    yay: 0,
    nay: 0,
    voters: [],
    succes: false
  };

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
      text: 'You have 1 minute to vote!'
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
    // Parse the vote
    var vote = {
      user: res.user,
      reaction: res.reaction,
      ts: res.event_ts
    };

    // Verify is the voter has already vote
    _this.app.web.reactions.get({
      channel: _this.opts.channel_id,
      timestamp: _this.messages.setup.ts
    }, function(err, res) {
      if (err) _this.emit('error', err);
    });
  });

  // Handle the vote
  _this.emit('reaction', res);
  _this._handleVotes(vote);

  // Listen to the end fo the vote
  this.on('end', function(opts) {
    log.info('The vote initialized by %s has ended', opts.user_name);
    _this._resultMessage();
  });
};

/**
 * Listen to the votes
 */
Vote.prototype._handleVotes = function(vote) {
  var _this = this;
  this.name(vote.user, function (info) {
    vote.name = info.user.name;

    if (!info.user.is_bot && vote.reaction === 'no_entry_sign') {
      // The user voted NAY
      log.info('%s just voted : Nay!', '@' + vote.name);
      _this.results.nay++;
      _this.results.voters.add(vote.user);
    } else if (!info.user.is_bot && vote.reaction === 'white_check_mark') {
      // The user voted YAY
      log.info('%s just voted : Yay!', '@' + vote.name);
      _this.results.yay++;
      _this.results.voters.add(vote.user);
    } else {
      log.error('A sneaky bot just tried to vote');
      _this.emit('error', 'Bots can\'t vote');
    }
  });
};

/**
 * Display the results
 */
Vote.prototype._resultMessage = function() {
  this.messages.result = {
    ts: this.messages.setup.ts,
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
    _this.emit('result', _this.results);
  });
};

/**
 * Emit whan the time is right
 */
Vote.prototype.timer = function(time) {
  var _this = this;
  setTimeout(function() {
    log.error('Timeout : The vote has ended');
    _this.emit('end', _this.opts);
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
