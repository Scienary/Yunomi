var controller = require('./controllers/fikirdek.controller');

module.exports = (app, io, config) => {
    var connections = {};
    app.post('/fikirdek', controller.channelAction);

    controller.init(app, io, config);
};