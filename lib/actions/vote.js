var Log = require('../logger');
var inherits = require('inherits');
var difference = require('lodash/difference');
var EventEmitter = require('eventemitter3');

var log = new Log('Vote');

// var MESSAGE = {
//   start: {
//     channel: this.opts.channel_id,
//     text: 'Let\'s cast a vote!',
//     attachments: [{
//       fallback: this.opts.user_name + ' is asking : ' + this.opts.text,
//       color: '#3498db',
//       author_name: '@' + this.opts.user_name + ' is asking',
//       title: this.opts.text,
//       text: 'You have 1 minute to vote!'
//     }]
//   },
//   result: {}
// };

/**
 * The vote module
 */
function Vote(_app, opts) {
  // Initiate event emitter
  EventEmitter.call(this);

  this.app = _app;
  this.msg = _app.messages;

  // Collect the channel infos
  this.context = {
    bot: [this.app.BOT],
    channel: opts.channel_id,
    author: {
      name: opts.user_name,
      id: opts.user_id
    },
    question: opts.text,
    time: 60000
  };

  // Collect the votes
  this.yay = [];
  this.nay = [];

  this._startVote();

  return this;
}

/**
 * Start the vote
 */
Vote.prototype._startVote = function() {
  var _this = this;

  // Send the starting message
  this.msg.post({
    channel: this.context.channel,
    text: 'Let\'s cast a vote!',
    attachments: [{
      fallback: this.context.author.name + ' is asking : ' + this.context.question,
      color: '#3498db',
      author_name: '@' + this.context.author.name + ' is asking',
      title: this.context.question,
      text: 'You have 1 minute to vote!'
    }]
  }, function (res) {
    // Register the timestamp
    _this.context.ts = res.ts;

    // Start the clock !
    // 1 minute until the end
    setTimeout(function() {
      log.error('Timeout : The vote has ended');
      _this.emit('end', _this);
    }, _this.context.time);

    // Add the reactions and listen to them
    _this.msg.react('white_check_mark', _this.context);
    _this.msg.react('no_entry_sign', _this.context);
    _this.listen();

    // Log the vote
    _this.emit('start', _this.context);
    log.success('The vote started');
  });

  // End the vote when asked
  this.on('end', function () {
    _this._endVote();
  });
};

/**
 * Listens to the votes
 */
Vote.prototype.listen = function() {
  var _this = this;

  // Handle new votes
  this.app.rtm.on(this.app.EVENTS.REACTION_ADDED, function(res) {
    // Parse the vote
    var vote = {
      user: {
        id: res.user
      },
      ts: res.event_ts
    };

    if (res.reaction === 'white_check_mark') vote.agree = true;
    else if (res.reaction === 'no_entry_sign') vote.agree = false;

    _this.checkValidity(vote);
  });
};


/**
 * Check if the vote is legit
 */
Vote.prototype.checkValidity = function(vote) {
  var _this = this;

  // Verify if the voter is a bot & if he has already vote
  this.app.web.users.info(vote.user.id, function(err, res) {
    vote.user.name = res.user.real_name;

    // Is the user human ?
    if (!res.user.is_bot) {
      log.info('%s is a human!', res.user.real_name);

      // Verify is the voter has already vote
      _this.app.web.reactions.get({
        channel: _this.context.channel,
        timestamp: _this.context.ts
      }, function(err, res) {
        /**
         * This part needs work
         * disabling the double vote checker for now
         */
        // var counter = 0;

        // var reaction = res.message.reactions;
        // for (i in reaction) {
        //   if (reaction[i].name === 'white_check_mark' &&
        //     reaction[i].users.indexOf(vote.user.id) > -1) counter++;
        //   if (reaction[i].name === 'no_entry_sign' &&
        //     reaction[i].users.indexOf(vote.user.id) > -1) counter++;
        // }

        // // If counter > 1, the voter has already voted
        // if (counter > 1) log.error('%s has already voted : Aborting the vote', vote.user.name);
        // else {
        //   log.success('%s\'s vote seems legit : Processing', vote.user.name);
        // }

        // Log the vote
        log.success('%s voted : processing the vote', vote.user.name);
        _this.emit('vote', vote);

        if (vote.agree) _this.yay.push(vote.user.id);
        else if (!vote.agree) _this.nay.push(vote.user.id);

        _this._countVoters();
      });

    } else log.info('%s is a dirty bot!', res.user.real_name);
  });
};

/**
 * Count the voters to end the vote if everybody voted
 */
Vote.prototype._countVoters = function() {
  var _this = this;

  this.app.web.channels.info(this.context.channel, function(err, res) {
    var voters = _this.context.bot.concat(_this.yay, _this.nay);
    if (difference(res.channel.members, voters).length === 0) {
      _this.emit('end', _this);
    }
  });
};

/**
 * End the vote and display the results
 */
Vote.prototype._endVote = function() {
  log.error('Wait, the vote ended ?');
};

inherits(Vote, EventEmitter);

module.exports = Vote;
