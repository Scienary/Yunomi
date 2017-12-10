var controller = require('./controllers/robotrain.controller');

module.exports = (app, io, config) => {
    var connections = {};
    app.post('/robotrain', controller.channelAction);

    controller.init(app, io, config);
};