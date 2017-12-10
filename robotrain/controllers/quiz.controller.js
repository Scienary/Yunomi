var socketRequestHandler = require('./../../connection/socketRequestHandler')();

module.exports = {
    name: 'Game',
    onRequest: onRequest,
};

function onRequest(data) {
    console.log(data);
}