var socketRequestHandler = require('./../connection/socketRequestHandler')();
var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * CioClient Model
 * ==========
 */
var Client = new keystone.List('Client', { autokey: { from: 'name email', path: 'key', unique: true } });

Client.add({
    name: { type: Types.Name, index: true },
    email: { type: Types.Email, initial: true, required: true, unique: true, index: true },
    password: { type: Types.Password, initial: true, required: true },
    mode: { type: Types.Select, options: 'tutorial, game', default: 'tutorial' }
});

Client.schema.post('save', function(next) {
    socketRequestHandler.notifyCollectionAddItem('collect', { schema: 'Client' });
});

/**
 * Relationships
 */

/**
 * Registration
 */
Client.defaultColumns = 'name, email, mode';
Client.register();