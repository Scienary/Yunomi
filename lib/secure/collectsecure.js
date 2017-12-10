'use strict';

var fs = require('fs');
var configFile = 'settings/config.json';

class CollectSecure {

    constructor() {}

    get tag() {
        return 'collectsecure';
    }

    get config() {
        return JSON.parse(fs.readFileSync(configFile));
    }

}

module.exports = new CollectSecure();