var socketRequestHandler = require('./../../connection/socketRequestHandler')();

module.exports = {
    channelAction: channelAction,
    init: init
};

function init(app, io) {
    socketRequestHandler.init(io);
}

function channelAction(req, res) {
    socketRequestHandler.handleRequest(req, res);
}