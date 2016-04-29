/**
 *
 * Listen to command requests and handle the responses
 */

function Cmder(opts) {
  var cmdOpts = opts || {};
}

Cmder.prototype.get = function(server, uri) {
  console.log("Listening to " + uri);
  server.get(uri, function(req, res) {
    console.log(req);
    res.send("That's working");
  });
};

module.exports = Cmder;