/**
 * Vote module
 */
function vote(_app, opts) {
  var msg = _app.messages;

  // Custom message data
  var data = {
    channel: opts.channel_id,
    text: 'Let\'s cast a vote!',
    attachments: [{
      fallback: opts.user_name + ' is asking : ' + opts.text,
      color: '#3498db',
      author_name: '@' + opts.user_name + ' is asking',
      title: opts.text,
      text: 'Vote before it\'s too late!'
    }]
  };

  msg.post(data, function (res) {
    // Add timestamp to the message
    data.ts = res.ts;

    // Add emoji buttons
    msg.react('white_check_mark', data);
    msg.react('no_entry_sign', data);
  });
}

module.exports = vote;
