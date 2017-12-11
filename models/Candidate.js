var socketRequestHandler = require('./../connection/socketRequestHandler')();
var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Candidate Model
 * ==========
 */
var Candidate = new keystone.List('Candidate', { autokey: { from: 'name email', path: 'key', unique: true } });

var localStorage = new keystone.Storage({
    adapter: keystone.Storage.Adapters.FS,
    fs: {
      path: 'data/files',
      publicPath: '/files',
    },
});

Candidate.add({
    name: { type: Types.Name, index: true },
    email: { type: Types.Email, initial: true, required: true, unique: true, index: true },
    gender: { type: Types.Select, options: 'm, w', default: 'm' },
    phone: { type: String },
    birthday: { type: Types.Date },
    residence: { type: Types.Location },
    profession: {
        skills: {
            type: Types.List,
            fields: {
                title: { type: String, required: true, index: true, default: '' },
                references: {
                    type: Types.List,
                    fields: {
                        reference: { type: Types.Relationship, ref: 'Skill' }
                    }
                },
                since: { type: Types.Date },
                grade: { type: Types.Select, options: 'beginner, basic, intermediate, advanced, master', default: 'beginner' },
                description: { type: Types.Markdown },
                link: { type: Types.Url },
                file: { type: Types.File, storage: localStorage }
            }
        },
        cv: {
            type: Types.List,
            fields: {
                task: { type: String, default: '' },
                begin: { type: Types.Date },
                end: { type: Types.Date },
                description: { type: Types.Markdown },
                link: { type: Types.Url },
                file: { type: Types.File, storage: localStorage }
            }
        }
    },
    private: {
        maritalStatus: { type: Types.Select, options: 'single, wedded', default: 'single' },
        children: { type: Number, default: 0 }
    },
    interest: {
        type: Types.List,
        fields: {
            title: { type: String, default: '' },
            description: { type: Types.Markdown },
            link: { type: Types.Url }
        }
    }
});

Candidate.schema.post('save', function(next) {
    socketRequestHandler.notifyCollectionAddItem('collect', { schema: 'Candidate' });
});

/**
 * Relationships
 */

/**
 * Registration
 */
Candidate.defaultColumns = 'name, email, mode';
Candidate.register();