var chalk = require('chalk');
var LOG = {
  ERROR: chalk.red,
  SUCCESS: chalk.green,
  INFO: chalk.blue
};

function Log(name) {
  this.name = name;
}

Log.prototype.error = function(s, v) {
  var value = v || '';
  var text = s || 'ERROR';
  console.log(LOG.ERROR(this.name) + ' ' + text, value);
};

Log.prototype.success = function(s, v) {
  var value = v || '';
  var text = s || 'SUCCESS';
  console.log(LOG.SUCCESS(this.name) + ' ' + text, value);
};

Log.prototype.info = function(s, v) {
  var value = v || '';
  var text = s || 'INFO';
  console.log(LOG.INFO(this.name) + ' ' + text, value);
};

module.exports = Log;
