var controller = require('./controllers/channel.controller');

module.exports = (app, io, config) => {
    var connections = {};
    app.post('/channel', controller.channelAction);

    controller.init(app, io, config);
};