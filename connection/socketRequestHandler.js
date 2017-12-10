var secure = require('./../lib/secure/collectsecure');
var basicAuth = require('express-basic-auth');
var jwt = require('jsonwebtoken');
var fs = require('fs');
const util = require('util');
const apiai = require('apiai')(secure.config.ai.apiai.clientId);
var keystone = require('keystone');
const SOCKET = require('./socketKey');
const ERROR = require('./errorKey');

function SocketRequestHandler() {

    var channels = [];

    var ref = { self: this };
    var users = [];

    var apiCalls = {};

    this.init = function(io) {
        ref.io = io;
    }

    this.registerApi = function(apiName, callback) {
        apiCalls[apiName] = callback;
    }

    this.handleRequest = function(req, res) {
        var channel = ref.self.getChannel(req.body.channelId);
        if (channel) {
            // Consider to use channel.once to avoid multiple events
            channel.once(SOCKET.EVENT_CONNECTION, function(socket) { onConnection(channel, socket); });
            res.status(200).json({ success: true });
        } else res.status(400).json({ success: false });
    }

    this.getChannel = function(channelId) {
        var channel;
        var filtered = channels.filter(function(item) {
            return item.id === channelId;
        });
        if (!filtered || filtered.length <= 0) {
            channel = ref.io
                .of('/' + channelId);
            channel.id = channelId;
            channels.push(channel);
        } else {
            channel = filtered[0];
        }
        return channel;
    }

    this.isInitialized = function() {
        return channels !== undefined && channels != null && channels.length > 0;
    }

    this.notifyCollectionAddItem = function(channelId, data) {
        if (!this.isInitialized()) return;
        var channel = ref.self.getChannel(channelId);
        channel.emit(SOCKET.EVENT_UPDATE, data);
    }

    function onConnection(channel, socket) {
        console.log(socket.handshake.adress, 'connected');

        socket.on(SOCKET.COMMAND_SEND_BROADCAST, function(data) { onSendBroadCast(data, channel, socket); });
        socket.on(SOCKET.COMMAND_REQUEST_AI_DATA, function(data) { onRequestAiData(data, socket); });
        socket.on(SOCKET.COMMAND_REQUEST_COLLECTION, function(data) { onRequestCollection(data, socket); });
        socket.on(SOCKET.COMMAND_SEND_PRIVATE_MESSAGE, function(data) { onSendPrivateMessage(data, channel, socket); });
        socket.on(SOCKET.COMMAND_COLLECTION_ADD_ITEM, function(data) { onCollectionAddItem(data, channel, socket); });
        socket.on(SOCKET.COMMAND_COLLECTION_REMOVE_ITEM, function(data) { onCollectionRemoveItem(data, channel, socket); });
        socket.on(SOCKET.COMMAND_COLLECTION_UPDATE_ITEM, function(data) { onUpdate(data, channel, socket); });
        socket.on(SOCKET.COMMAND_UPDATE, function(data) { onUpdate(data, channel, socket); });
        socket.on(SOCKET.COMMAND_USE_API, function(data) { onUseApi(data, channel, socket); });

        socket.on(SOCKET.EVENT_DISCONNECT, function() {
            console.log('user disconnected');
            users = users.filter(function(item) {
                return item.socketId !== socket.id;
            });
            channel.emit(SOCKET.EVENT_USER, users);
        });

        var userObj = jwt.decode(socket.handshake.query.token);

        userObj.socketId = socket.id;
        userObj.key = userObj.profile.clientId + '/' + socket.handshake.address;
        users.push(userObj);

        var delay = 501;
        setTimeout(function() { channel.emit(SOCKET.EVENT_USER, users); }, delay);
    }

    function findSocket(token, address) {
        var user = jwt.decode(token);
        var key = user.profile.clientId + '/' + address;
        var res = users.filter(function(item) {
            return item.key === key;
        });
        return res;
    }

    function onSendBroadCast(data, channel, socket) {
        channel.emit(SOCKET.EVENT_RECEIVE_BROADCAST, data); // Send the result back to the browser!
    }

    function onSendPrivateMessage(data, channel, socket) {
        var filtered = users.filter(function(item) {
            return item.profile.email === data.to;
        });
        if (!filtered || filtered.length <= 0) {
            var res = { success: false, error: ERROR.NO_USERS_FOUND, key: SOCKET.COMMAND_SEND_PRIVATE_MESSAGE };
            socket.emit(SOCKET.EVENT_ERROR, res);
        } else {
            var user = filtered[0];
            var otherSocket = channel.sockets[user.socketId];
            if (!otherSocket) {
                var res = { success: false, error: ERROR.NO_SOCKETS_FOUND, key: SOCKET.COMMAND_SEND_PRIVATE_MESSAGE };
                socket.emit(SOCKET.EVENT_ERROR, res);
            }
            otherSocket.emit(SOCKET.EVENT_RECEIVE_PRIVATE_MESSAGE, data);
        }
    }

    function onUpdate(data, channel, socket) {
        if (data && data.schema) {
            try {
                Schema = keystone.list(data.schema);
                Schema.model.find()
                    .where('_id', data.id)
                    .limit(1)
                    .exec(function(err, items) {
                        if (items !== null && items !== undefined && items.length > 0) {
                            var item = items[0];
                            var keys = Object.keys(data.content);
                            for (var k in keys) item[k] = data.content[k];
                            item.save(function(err) {
                                if (err === null || err === undefined) {
                                    channel.emit(SOCKET.EVENT_UPDATE, { success: true, schema: data.schema });
                                } else {
                                    var res = { success: false, error: ERROR.SAVE_FAILED, key: SOCKET.COMMAND_UPDATE };
                                    socket.emit(SOCKET.EVENT_ERROR, res);
                                }
                            });
                        } else {
                            var res = { success: false, error: ERROR.ID_NOT_MATCHED };
                            socket.emit(SOCKET.EVENT_ERROR, res);
                        }
                    });
            } catch (e) {
                var res = { success: false, error: JSON.stringify(e), key: SOCKET.COMMAND_UPDATE };
                socket.emit(SOCKET.EVENT_ERROR, res);
            }
        } else {
            var res = { success: false, error: ERROR.PARAMETERS_INVALID, key: SOCKET.COMMAND_UPDATE };
            socket.emit(SOCKET.EVENT_ERROR, res);
        }
    }

    function onCollectionAddItem(data, channel, socket) {
        if (data && data.schema) {
            try {
                Schema = keystone.list(data.schema);
                var newItem = new Schema.model(data.content);
                newItem.save(function(err) {
                    if (err) {
                        var res = { success: false, error: JSON.stringify(err), key: SOCKET.COMMAND_COLLECTION_ADD_ITEM };
                        socket.emit(SOCKET.EVENT_ERROR, res);
                    } else {
                        var payload = data.content;
                        channel.emit(SOCKET.EVENT_COLLECTION_ADD_ITEM, payload);
                    }
                });
            } catch (e) {
                var res = { success: false, error: JSON.stringify(e) };
                socket.emit(SOCKET.EVENT_ERROR, res);
            }
        } else {
            var res = { success: false, error: ERROR.PARAMETERS_INVALID, key: SOCKET.COMMAND_COLLECTION_ADD_ITEM };
            socket.emit(SOCKET.EVENT_ERROR, res);
        }
    }

    function onCollectionRemoveItem(data, channel, socket) {
        if (data && data.schema) {
            try {
                Schema = keystone.list(data.schema);
                var newItem = new Schema.model(data.content);
                newItem.save(function(err) {
                    if (err) {
                        var res = { success: false, error: JSON.stringify(err), key: SOCKET.COMMAND_COLLECTION_REMOVE_ITEM };
                        socket.emit(SOCKET.EVENT_ERROR, res);
                    } else {
                        var payload = data.content;
                        channel.emit(SOCKET.EVENT_COLLECTION_REMOVE_ITEM, payload);
                    }
                });
            } catch (e) {
                var res = { success: false, error: JSON.stringify(e) };
                socket.emit(SOCKET.EVENT_ERROR, res);
            }
        } else {
            var res = { success: false, error: ERROR.PARAMETERS_INVALID, key: SOCKET.COMMAND_COLLECTION_REMOVE_ITEM };
            socket.emit(SOCKET.EVENT_ERROR, res);
        }
    }

    function onRequestCollection(data, socket) {
        if (data && data.schema) {
            try {
                Schema = keystone.list(data.schema);
                if (data.condition) {
                    Schema.model.find()
                        .where(data.whereKey, data.whereValue)
                        .exec(function(err, items) {
                            var res = { success: true, result: items, schema: data.schema };
                            socket.emit(SOCKET.EVENT_RECEIVE_COLLECTION, res, data.schema);
                        });
                } else {
                    Schema.model.find()
                        .exec(function(err, items) {
                            var res = { success: true, items: items, schema: data.schema };
                            socket.emit(SOCKET.EVENT_RECEIVE_COLLECTION, res, data.schema);
                        });
                }
            } catch (e) { 
                var res = { success: false, error: JSON.stringify(e), key: SOCKET.COMMAND_REQUEST_COLLCECTION, schema: data.schema };
                socket.emit(SOCKET.EVENT_ERROR, res);
            }
        } else {
            var res = { success: false, error: ERROR.PARAMETERS_INVALID, key: SOCKET.COMMAND_REQUEST_COLLECTION, schema: data.schema };
            socket.emit(SOCKET.EVENT_ERROR, res);
        }

    }

    function onRequestAiData(data, socket) {
        let apiaiReq = apiai.textRequest(data.message, {
            sessionId: secure.config.ai.apiai.sessionId
        });

        apiaiReq.on('response', (response) => {
            let aiText = response.result.fulfillment.speech;
            var data = { from: 'CollectIO', message: aiText, type: 'ai' };
            socket.emit(SOCKET.EVENT_RECEIVE_AI_DATA, data); // Send the result back to the browser!
        });

        apiaiReq.on('error', (error) => {
            var res = { success: false, error: JSON.stringify(error), key: SOCKET.COMMAND_REQUEST_AI_DATA };
            socket.emit(SOCKET.EVENT_ERROR, res);
        });

        apiaiReq.end();
    }

    function onUseApi(data, channel, socket) {
        apiCalls[data.apiName](data);
    }
}

var socketRequestHandler;

module.exports = () => {
    if (!socketRequestHandler) socketRequestHandler = new SocketRequestHandler();
    return socketRequestHandler;
};