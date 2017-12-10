var secure = require('./../../lib/secure/collectsecure');
var basicAuth = require('express-basic-auth');
var jwt = require('jsonwebtoken');
var fs = require('fs');
const util = require('util');
const apiai = require('apiai')(secure.config.ai.apiai.clientId);

var ref = {};

var users = [];

module.exports = {
    channelAction: channelAction,
    init: init
};

function init(app, io) {
    ref.io = io;
}

function channelAction(req, res) {
    //var toFind = findSocket(req.body.token, req.connection.remoteAddress);
    //if (toFind !== null && toFind.length > 0) {
    //    res.status(400).json({ success: false, error: 'Connection already exists' });
    //} else {
    var collectChannel = ref.io
        .of('/' + req.body.channelId)
        .once('connection', function(socket) {
            console.log(req.body.token, 'connected');
            var userObj = jwt.decode(req.body.token);

            userObj.socketId = socket.id;
            userObj.key = userObj.profile.clientId + '/' + req.connection.remoteAddress;
            users.push(userObj);
            collectChannel.emit('all-users', users);

            ref.io.emit('authentication', { count: users.length });

            socket.on('send-message', function(data) {
                collectChannel.emit('message-received', data);

                if (data.type === 'human') return;
                // Get a reply from API.AI

                let apiaiReq = apiai.textRequest(data.message, {
                    sessionId: secure.config.ai.apiai.sessionId
                });

                apiaiReq.on('response', (response) => {
                    let aiText = response.result.fulfillment.speech;
                    var data = { from: 'Bilge Bot', message: aiText, type: 'ai' };
                    collectChannel.emit('message-received', data); // Send the result back to the browser!
                });

                apiaiReq.on('error', (error) => {
                    console.log(error);
                });

                apiaiReq.end();
            });

            socket.on('collection', function(name) {
                collectMongo.getCollection(socket, name,
                    data => {
                        socket.emit('collection', data);
                    },
                    err => {
                        socket.emit('hello', err);
                    }
                );
            });

            socket.on('add', function(req) {

            });

            socket.on('remove', function(req) {});

            socket.on('get-users', function() {
                socket.emit('all-users', users);
            });

            socket.on('send-like', function(data) {
                console.log(data);
                socket.broadcast.to(data.like).emit('user-liked', data);
            });

            socket.on('disconnect', function() {
                console.log('user disconnected');
                users = users.filter(function(item) {
                    return item.socketId !== socket.id;
                });
                collectChannel.emit('all-users', users);
            });
        });
    res.status(200).json({ success: true });
    //}
}

function findSocket(token, address) {
    var user = jwt.decode(token);
    var key = user.profile.clientId + '/' + address;
    var res = users.filter(function(item) {
        return item.key === key;
    });
    return res;
}