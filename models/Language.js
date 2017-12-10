var socketRequestHandler = require('./../connection/socketRequestHandler')();
var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Language Model
 * ==========
 */
var Language = new keystone.List('Language', { autokey: { from: 'code name', path: 'key', unique: true } });

Language.add({
    code: { type: Types.Key, index: true, required: true, unique: true, initial: true },
    name: { type: String, index: true, required: true, unique: true, intial: true }
});

/**
 * Relationships
 */

/**
 * Registration
 */
Language.defaultColumns = 'code, name';
Language.register();