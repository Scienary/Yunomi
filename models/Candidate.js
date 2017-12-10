var socketRequestHandler = require('./../connection/socketRequestHandler')();
var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Candidate Model
 * ==========
 */
var Candidate = new keystone.List('Client', { autokey: { from: 'name email', path: 'key', unique: true } });

Candidate.add({
    name: { type: Types.Name, index: true },
    email: { type: Types.Email, initial: true, required: true, unique: true, index: true },
    birthday: { type: Types.Date },
    job: {
        type: Types.List
    }
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