'use strict';

var app = require('express')();
var bodyParser = require('body-parser');
var https = require('https');
//var http = require('http');
var path = require('path');

var hbs = require('hbs');
var fs = require('fs');
var morgan = require('morgan');
var serveStatic = require('serve-static');

var configFile = 'settings/config.json';
var config = JSON.parse(fs.readFileSync(configFile));

var collectMongo = require('./lib/db/collectmongo')(config);
collectMongo.init();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(morgan('combined', { immediate: true }));
app.use(serveStatic('public'));

app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.set('views', path.join(__dirname + '/root/', 'views'));

var options = {
    key: fs.readFileSync(__dirname + '/settings/localhost.key'),
    cert: fs.readFileSync(__dirname + '/settings/localhost.crt')
};

var server = https.createServer(options, app).listen(config.db.port, () => {
    console.log(config.firstStartLog + config.db.port);
}).listen(config.db.port);

//var server = http.createServer(app, (request, response) => {
//    console.log(config.firstStartLog + config.db.port);
//}).listen(config.db.port);

var io = require('socket.io').listen(server);

require('./root/root.router')(app);
require('./auth/auth.router')(app, io, config);