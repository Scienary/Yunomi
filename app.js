'use strict';

// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

// Require keystone
var keystone = require('keystone');
var handlebars = require('express-handlebars');

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({
    'name': 'Yunomi',
    'brand': 'Yunomi',
    'sass': 'public',
    'static': 'public',
    'favicon': 'public/favicon.ico',
    'views': 'templates/views',
    'view engine': '.hbs',
    'wysiwyg skin': 'lightgray',
    'custom engine': handlebars.create({
        layoutsDir: 'templates/views/layouts',
        partialsDir: 'templates/views/partials',
        defaultLayout: 'default',
        helpers: new require('./templates/views/helpers')(),
        extname: '.hbs',
    }).engine,

    'emails': 'templates/emails',

    'auto update': true,
    'session': true,
    'auth': true,
    'user model': 'Admin',
});

keystone.set('signin logo', 'http://geldeogrenme.com/wp-content/uploads/2017/08/logo_banner.png');

keystone.set('mongo options', { useMongoClient: true });

// Load your project's Models
keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js
keystone.set('locals', {
    _: require('lodash'),
    env: keystone.get('env'),
    utils: keystone.utils,
    editable: keystone.content.editable
});

// Load your project's Routes
keystone.set('routes', require('./routes'));

// Configure the navigation bar in Keystone's Admin UI
//keystone.set('nav', {
//	posts: ['posts', 'post-categories'],
//	galleries: 'galleries',
//	enquiries: 'enquiries',
//	'cio-admins': 'cio-admins',
//});

keystone.set('nav', {
    conversationData: ['actions', 'conversations', 'languages'],
    accountData: ['admins', 'clients'],
});

// Start Keystone to connect to your database and initialise the web server


// if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
//     console.log('----------------------------------------' +
//         '\nWARNING: MISSING MAILGUN CREDENTIALS' +
//         '\n----------------------------------------' +
//         '\nYou have opted into email sending but have not provided' +
//         '\nmailgun credentials. Attempts to send will fail.' +
//         '\n\nCreate a mailgun account and add the credentials to the .env file to' +
//         '\nset up your mailgun integration');
// }

// optional, will prefix all built-in tags with 'keystone_'
keystone.set('cloudinary prefix', 'yunomi');

// optional, will prefix each image public_id with [{prefix}]/{list.path}/{field.path}/
//keystone.set('cloudinary folders', true);

// optional, will force cloudinary to serve images over https
keystone.set('cloudinary secure', true);

keystone.start();

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
//var https = require('https');
var http = require('http');
var path = require('path');

//var hbs = require('hbs');
var fs = require('fs');
var morgan = require('morgan');
var serveStatic = require('serve-static');

var configFile = 'settings/config.json';
var config = JSON.parse(fs.readFileSync(configFile));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(morgan('combined', { immediate: true }));
//app.use(serveStatic('public'));

//app.set('view engine', 'html');
//app.engine('html', hbs.__express);

//app.set('views', path.join(__dirname + '/root/', 'views'));
app.use(express.static(path.join(__dirname, 'public')));

var options = {
    key: fs.readFileSync(__dirname + '/settings/localhost.key'),
    cert: fs.readFileSync(__dirname + '/settings/localhost.crt')
};

//var server = https.createServer(options, app).listen(config.db.port, () => {
//    console.log(config.firstStartLog + config.db.port);
//}).listen(config.db.port);

var server = http.createServer(app, (request, response) => {
    console.log(config.firstStartLog + process.env.SECOND_PORT);
}).listen(process.env.SECOND_PORT);

var io = require('socket.io').listen(server);

require('./root/root.router')(app);
require('./auth/auth.router')(app, io, config);
require('./channel/channel.router')(app, io, config);
require('./robotrain/robotrain.router')(app, io, config);