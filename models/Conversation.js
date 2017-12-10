var socketRequestHandler = require('./../connection/socketRequestHandler')();
var keystone = require('keystone');
var mongoose = require('mongoose');
var Types = keystone.Field.Types;

var current;

/**
 * Conversation Model
 * ==========
 */

var Conversation = new keystone.List('Conversation', { autokey: { from: 'no name', path: 'key', unique: true } });

Conversation.schema.pre('save', function(next) {
    current = this;
    if (!this.createdAt) this.createdAt = new Date();
    if (this.no > 0) {
        next();
    } else {
        Conversation.model.find()
            .exec()
            .then(function(items) { //first promise fulfilled
                current.no = items.length + 1;
            }, function(err) { //first promise rejected
                throw err;
            }).then(function(result) { //second promise fulfilled
                //do something with final results
                next();
            }, function(err) { //something happened
                //catch the error, it can be thrown by any promise in the chain
                console.log(err);
                next();
            });
    }

});

var localStorage = new keystone.Storage({
    adapter: keystone.Storage.Adapters.FS,
    fs: {
      path: 'data/files',
      publicPath: '/files',
    },
});

Conversation.add({
    name: { type: String, unique: true, required: true, intial: true },
    no: { type: Number, readonly: true, noedit: true, default: -1, unique: true },
    mode: { type: Types.Select, options: 'conversation, welcome-new, welcome-back', default: 'conversation', index: true },
    inputs: { type: Types.TextArray, index: true },
    outputs: {
        type: Types.List,
        fields: {
            text: { type: String, default: '' },
            link: { type: Types.Url },
            file: { type: Types.File, storage: localStorage },
            items: { type: Types.TextArray, default: [] },
            showImage: { type: Types.Boolean, default: false }
        }
    },
    outputImages: { type: Types.CloudinaryImages, folder: 'yunomi/outputimages' }, 
    interactions: {
        type: Types.List,
        fields: {
            action: { type: Types.Select, options: 'menu, conversation, openlink, showimage, end', default: 'start' },
            key: { type: Types.Relationship, ref: 'Conversation' },
            uiType: { type: Types.Select, options: 'button, image, text', default: 'button' },
            uiText: { 
                type: Types.TextArray, 
                default: []
            }
        }
    },
    from: { type: Types.Relationship, ref: 'Client' },
    createdAt: { type: Types.Date, index: true, readonly: true, noedit: true },
    lang: { type: Types.Relationship, ref: 'Language', index: true }
});

Conversation.defaultColumns = 'name, no, inputs, outputs, createdAt';
Conversation.register();