var _ = require('lodash');
var FieldType = require('../Type');
var util = require('util');
var utils = require('keystone-utils');

// Validation and value parsing regular expression
var REGEXP_LNGLAT = /^\s*(\-?\d+(?:\.\d+)?)\s*\,\s*(\-?\d+(?:\.\d+)?)\s*$/;

/**
 * Geo FieldType Constructor
 * @extends Field
 * @api public
 */
function mixed(list, path, options) {
    if (!options.defaults) {
        options.defaults = {};
    }

    this._fixedSize = 'medium';
    mixed.super_.call(this, list, path, options);
}

mixed.properName = 'Mixed';
util.inherits(mixed, FieldType);

/**
 * Registers the field on the List's Mongoose Schema.
 * Adds a 2dsphere indexed lat/lng pair
 */
mixed.prototype.addToSchema = function(schema) {

    var field = this;
    var options = this.options;

    var paths = this.paths = {
        mixed1: this.path + '.mixed1',
        mixed2: this.path + '.mixed2',
    };

    var getFieldDef = function(type, key) {
        var def = { type: type };
        if (options.defaults[key]) {
            def.default = options.defaults[key];
        }
        return def;
    };

    schema.nested[this.path] = true;

    schema.add({
        mixed1: getFieldDef(String, 'mixed1'),
        mixed2: getFieldDef(String, 'mixed2'),
    }, this.path + '.');

    this.bindUnderscoreMethods();
};

/**
 * Gets the field's data from an Item, as used by the React components
 */
mixed.prototype.getData = function(item) {
    return item.get(this.path);
};

/**
 * Formats the field value
 */
mixed.prototype.format = function(item) {
    if (item.get(this.path)) {
        return item.get(this.path).reverse().join(', ');
    }
    return null;
};

/**
 * Asynchronously confirms that the provided value is valid
 */
mixed.prototype.validateInput = function(data, callback) {
    // var input = this.getInputFromData(data);
    // TODO: We should strictly check for types in input here
    utils.defer(callback, true);
};

/**
 * Asynchronously confirms that the a value is present
 */
mixed.prototype.validateRequiredInput = function(item, data, callback) {
    var value = this.getValueFromData(data);
    var result = (value || (value === undefined && item.get(this.path) && item.get(this.path).length === 2)) ? true : false;
    utils.defer(callback, result);
};

/**
 * Validates that a value for this field has been provided in a data object
 *
 * Deprecated
 */
mixed.prototype.inputIsValid = function(data, required, item) { // eslint-disable-line no-unused-vars
    var values = this.getValueFromData(data);
    // Input is valid if the field is not required, and not present
    if (values === undefined && !required) return true;
    if (Array.isArray(values)) {
        values = values.length === 2 ? values.join(',') : '';
    }
    if (typeof values !== 'string') return false;
    if ((values === '' || values.charAt(0) === ',' || values.charAt(values.length - 1) === ',') && !required) return true;
    return REGEXP_LNGLAT.test(values);
};

/**
 * Filters geopoints based on distance to a center point
 *
 * @param {Object} filter 				 The data from the frontend
 * @param {Number} filter.lat			 The latitude of the center point
 * @param {Number} filter.lon			 The longitude of the center point
 * @param {String} filter.distance.mode  The distance mode, either "max" or "min"
 * @param {Number} filter.distance.value The distance value
 */
mixed.prototype.addFilterToQuery = function(filter) {
    var query = {};
    // If latitude or longitude aren't specified, don't filter anything
    if (filter.lon && filter.lat) {
        query[this.path] = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [filter.lon, filter.lat],
                },
            },
        };
        // MongoDB wants meters, but we accept kilometers via input so we * 1000
        var distance = (filter.distance.value && filter.distance.value * 1000) || 500000;
        if (filter.distance.mode === 'min') {
            query[this.path].$near.$minDistance = distance;
        } else {
            query[this.path].$near.$maxDistance = distance;
        }
    }
    return query;
};

/**
 * Updates the value for this field in the item from a data object
 */
mixed.prototype.updateItem = function(item, data, callback) {
    var paths = this.paths;
    var fieldKeys = ['mixed1', 'mixed2'];
    var valueKeys = fieldKeys;
    var valuePaths = valueKeys;
    var values = this._path.get(data);

    if (!values) {
        // Handle flattened values
        valuePaths = valueKeys.map(function(i) {
            return paths[i];
        });
        values = _.pick(data, valuePaths);
    }

    // convert valuePaths to a map for easier usage
    valuePaths = _.zipObject(valueKeys, valuePaths);

    var setValue = function(key) {
        if (valuePaths[key] in values && values[valuePaths[key]] !== item.get(paths[key])) {
            item.set(paths[key], values[valuePaths[key]] || null);
        }
    };

    _.forEach(fieldKeys, setValue);

    process.nextTick(callback);
};

/* Export Field Type */
module.exports = mixed;