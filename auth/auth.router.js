var controller = require('./controllers/auth.controller');

module.exports = (app, io, config) => {
	var connections = {};
	app.post('/auth', controller.authenticateAction);

	app.post('/create', controller.createAction);

    controller.init(app, io, config);
};