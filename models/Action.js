var socketRequestHandler = require('./../connection/socketRequestHandler')();
var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Action Model
 * ==================
 * Do not use id as property
 */

var Action = new keystone.List('Action', { autokey: { from: 'name', path: 'key', unique: true } });

Action.add({
    name: { type: String, required: true, initial: true, index: true },
    displayTexts: { type: Types.TextArray, initial: true, default: [] },
    description: { type: String },
    lang: { type: Types.Relationship, ref: 'Language', index: true }
});

// Action.relationship({ ref: 'Conversation', path: 'conversations', refPath: 'action' });

Action.defaultColumns = 'name, displayTexts, description, lang';
Action.register();