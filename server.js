/**
 *
 * Create the server and handle actions
 */

// Require modules
var express = require('express');
var bodyParser = require('body-parser');

// Create server
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Listen to requests
var server = app.listen(8888);