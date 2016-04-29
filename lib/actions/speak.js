// Require the Slack Client
var Slack = require('@slack/client');

var RtmClient = Slack.RtmClient;
var RTM_EVENTS = Slack.RTM_EVENTS;

// Get the test token
var token = process.env.SLACK_API_TOKEN || '';

// Create and start the RTM server
var server = new RtmClient(token, { logLevel: "info" });
server.start();

// Log the authentification
server.on(RTM_EVENTS.HELLO, function () {
  console.log('Hello ;^)');
});

// Wait for a message
server.on(RTM_EVENTS.MESSAGE, function(message){
  console.log(message);
  // Respond like a b0ss
  server.sendMessage("Shut up, bro !", message.channel)
});