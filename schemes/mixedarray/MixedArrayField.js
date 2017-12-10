import ArrayFieldMixin from '../../mixins/ArrayField';
import Field from '../Field';

module.exports = Field.create({

    displayName: 'MixedArrayField',
    statics: {
        type: 'MixedArray',
    },

    mixins: [ArrayFieldMixin],

    cleanInput(input) {
        return input.replace(/[^\d]/g, '');
    },

});