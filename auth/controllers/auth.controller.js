var secure = require('./../../lib/secure/collectsecure');
var basicAuth = require('express-basic-auth');
var socketioJwt = require('socketio-jwt');
var jwt = require('jsonwebtoken');
var ref = {};

var keystone = require('keystone');
Client = keystone.list('Client');

module.exports = {
    authenticateAction: authenticateAction,
    createAction: createAction,
    init: init
};

function init(app, io) {
    ref.io = io;

    var authUser = secure.config.authUser;
    var authPassword = secure.config.authPassword;

    app.use(basicAuth({
        users: { "CollectIO-Grant-Access": authPassword },
        unauthorizedResponse: getUnauthorizedResponse
    }));

    io.set('authorization', socketioJwt.authorize({
        secret: secure.config.jwtSecret,
        handshake: true
    }));
}

function authenticateAction(req, res) {
    // match email address and password
    Client.model.findOne({ email: req.body.clientId }).exec(function(err, user) {
        if (user) {
            user._.password.compare(req.body.secretId, function(err, isMatch) {
                if (!err && isMatch) {
                    onAuthSuccess(user, req, res);
                } else {
                    onAuthFail(err, req, res);
                }
            });
        } else {
            onAuthFail(err, req, res);
        }
    });

    //collectMongo.auth(req.body.clientId, req.body.secretId, req.body.channelId,
    //    data => { onAuthSuccess(data, req, res); },
    //    err => { onAuthFail(err, req, res); });
}

function createAction(req, res) {
    // collectMongo.create(req.body.clientId, req.body.secretId, req.body.channel,
    //     data => { onCreateSuccess(data, req, res); },
    //     err => { onCreateFail(err, req, res); });

    var newClient = new Client.model({
        email: req.body.clientId,
        password: req.body.secretId
    });

    newClient.save(function(err) {
        if (err) onCreateFail(err, req, res);
        else onCreateSuccess(newClinet, req, res);
    });
}

function onAuthSuccess(profile, req, res) {
    // we are sending the profile in the token
    var token = jwt.sign({ profile: profile }, secure.config.jwtSecret, { expiresIn: 60 * 60 * 24 });
    res.status(200).json({ success: true, token: token });
}

function onAuthFail(err, req, res) {
    console.log(err);
    res.status(401).json({ success: false, error: err });
}

function onCreateSuccess(profile, req, res) {
    // we are sending the profile in the token
    var token = jwt.sign({ profile: profile }, secure.config.jwtSecret, { expiresIn: 60 * 60 * 24 });
    res.status(200).json({ success: true, token: token });
}

function onCreateFail(err, req, res) {
    console.log(err);
    res.status(401).json({ success: false, error: err });
}

function getUnauthorizedResponse(req) {
    return req.auth ?
        ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected') :
        'No credentials provided'
}