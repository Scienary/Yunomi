function CollectMongo(config) {

    // #region Attributes

    var self = this;
    var fs = require('fs');
    var f = require('util').format;
    var jwt = require('jsonwebtoken');
    var process = require('child_process');
    var mongoose = require('mongoose');

    // #endregion

    // #region Properties

    self.tag = "collectmongo";
    self.config = config;

    self.rootConnection = {};
    self.connections = {};
    self.models = {};

    // #endregion

    // #region Public Methods

    this.init = function() {
        self.rootUrl = f('mongodb://%s:%s@%s:%d/%s?authSource=admin',
            self.config.db.user, self.config.db.pass, self.config.db.url, self.config.db.port, self.config.db.channel);
        mongoose.connect(self.rootUrl, { useMongoClient: true });
        initListener();
    }

    this.auth = function(clientId, secretId, channel, success, fail) {
        var url = f('mongodb://%s:%s@%s:%d/%s/ps?authSource=admin',
            clientId, secretId, self.config.db.url, self.config.db.port, channel);
        var conn = mongoose.createConnection(url);
        conn.on("error", err => {
            if (fail) fail(err);
        });
        conn.once("open", data => {
            var key = { clientId: clientId, channel: channel };
            if (success) success(key);
            self.connections[JSON.stringify(key)] = conn;
        });
    }

    this.create = function(clientId, secretId, channel, success, fail) {
        var url = f('mongodb://%s:%s@%s:%d/%s',
            clientId, secretId, self.config.db.url, self.config.db.port, channel);
        var conn = mongoose.createConnection(url);
        conn.on("error", err => {
            var options = {
                roles: [{
                    role: "readWrite",
                    db: channel
                }]
            };
            self.rootConnection.db.addUser(clientId, secretId, options, (err, res) => {
                console.log(res);
                if (err) {
                    if (fail) fail(err);
                } else {
                    if (success) success(res);
                }
            });
        });
        conn.once("open", data => {
            conn.close();
            if (fail) fail({
                "success": false,
                "error": {
                    "name": "Duplicate",
                    "message": "The account already exists",
                    "ok": 0,
                    "code": 18,
                    "errmsg": "The account already exists"
                }
            });
        });
    }

    this.getCollection = function(socket, name, success, error) {
        var Model;
        try {
            var Schema = mongoose.Schema({ id: Number, name: String, email: String });
            var key = JSON.stringify(jwt.decode(socket.handshake.query.token).profile);
            var conn = self.connections[key];
            if (!conn.models[name]) {
                Model = conn.model(name, Schema);
            } else {
                Model = conn.models[name];
            }
            Model.find((err, data) => {
                if (err) error(err);
                else success(data);
            });
        } catch (err) {
            error(err);
            console.log(err);
        }
        //var account = new AccountModel({ id: 1, name: 'Ahc', email: 'ahmet.cavus@cinary.com' });
        //account.save();
    }

    // #endregion

    // #region Private Methods

    function initListener() {
        self.rootConnection = mongoose.connection;
        self.rootConnection.on('error', onRootDbError);
        self.rootConnection.once('open', onRootDbConnected);
    }

    var tries = 0;
    const MAX_CONN_TRY = 2;

    function handleReconnectRequest() {
        if (tries < MAX_CONN_TRY) {
            tries += 1;
            reconnect();
        } else {
            tries = 0;
            executeMongo();
        }
    }

    function reconnect() {
        var res = self.db.open(self.rootUrl);
        console.log(self.db._readyState);
    }

    function executeMongo() {
        const pipe = process.spawn('mongod', ['-config', 'G:\\webdevelopment\\Collect.IO\\settings\\mongod.conf']);
        pipe.stdout.on('data', data => {
            console.log(data.toString('utf8'));
            var timeout = 9001;
            setTimeout(reconnect, timeout);
            pipe.stdout.removeAllListeners();
        });

        pipe.stderr.on('data', (data) => {
            console.log(data.toString('utf8'));
        });

        pipe.on('close', (code) => {
            console.log('Process exited with code: ' + code);
        });
    }

    // #endregion

    // #region Event Handler

    function onRootDbConnected(db) {
        console.log("Db is running: " + db);
        console.log(self.rootConnection._readyState);
    }

    function onRootDbDisconnected(obj) {
        console.log("Db is closing: " + obj);
    }

    var timeout = 301;

    function onRootDbError(err) {
        console.log("Db error: " + err);
        console.log(self.tag, "Retry connection attempt");
        setTimeout(handleReconnectRequest, timeout);
    }

    function onClientDbConnected(db) {
        console.log("Db is running: " + db);
    }

    function onClientDbError(err, db) {
        console.log("Db error: " + err);
    }

    // #endregion

}

var collectMongo;

module.exports = (config) => {
    if (config === null || config === undefined) return;
    if (!collectMongo) collectMongo = new CollectMongo(config);
    return collectMongo;
};