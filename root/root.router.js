var controller = require('./controllers/root.controller');

module.exports = (app) => {
    app.get('/', controller.indexAction);
};