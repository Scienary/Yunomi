var socketRequestHandler = require('./../connection/socketRequestHandler')();
var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Skill Model
 * ==========
 */
var Skill = new keystone.List('Skill', { autokey: { from: 'name', path: 'key', unique: true } });

var localStorage = new keystone.Storage({
    adapter: keystone.Storage.Adapters.FS,
    fs: {
      path: 'data/files',
      publicPath: '/files',
    },
});

Skill.add({
    name: { type: String, index: true },
    description: { type: Types.Markdown },
    link: { type: Types.Url }
});

Skill.schema.post('save', function(next) {
    socketRequestHandler.notifyCollectionAddItem('collect', { schema: 'Skill' });
});

/**
 * Relationships
 */

/**
 * Registration
 */
Skill.defaultColumns = 'name, description';
Skill.register();