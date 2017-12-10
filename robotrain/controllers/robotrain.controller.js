var quizApi = require('./quiz.controller')
var socketRequestHandler = require('./../../connection/socketRequestHandler')();

module.exports = {
    channelAction: channelAction,
    init: init,
};

function init(app, io) {
    socketRequestHandler.init(io);
    socketRequestHandler.registerApi(quizApi.name, quizApi.onRequest);
}

function channelAction(req, res) {
    socketRequestHandler.handleRequest(req, res);
}