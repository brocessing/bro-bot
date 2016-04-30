/**
 * Require and handle the Bro instance
 */

var Log = require('./lib/helpers');
var log = new Log('Server');

// Get the token
var TOKEN = process.env.SLACK_API_TOKEN || '';


var Bro = require('./lib/client');
var bro = new Bro(TOKEN);

// ON command
bro.on('command', function(req, res) {
  var cmd = req.command;

  log.success('Command received : %s', cmd);

  if(cmd === '/vote') {
    // Handle the vote command
    bro.post('Wow this ' + req.user_name + ' fucker casted a vote!', req.channel_id);
    res.send({});
  } else {
    // Handle the other commands
    response.send('I don\'t know this bullshit command, bro!');
  }
});
