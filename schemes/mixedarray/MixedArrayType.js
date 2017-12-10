var FieldType = require('../Type');
var numeral = require('numeral');
var util = require('util');
var utils = require('keystone-utils');
var addPresenceToQuery = require('../../utils/addPresenceToQuery');

/**
 * Number FieldType Constructor
 * @extends Field
 * @api public
 */
function mixedarray(list, path, options) {
    var field = this;
    var options = this.options;

    var paths = this.paths = {
        content: this.path + '.content'
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
        mixed1: getFieldDef(Array, 'content')
    }, this.path + '.');

    this.bindUnderscoreMethods();
};

/**
 * Checks if a value is a valid number
 */
function isValidNumber(value) {
    return !Number.isNaN(utils.number(value));
}

/**
 * Asynchronously confirms that the provided value is valid
 */
mixedarray.prototype.validateInput = function(data, callback) {
    var value = this.getValueFromData(data);
    var result = true;
    // Let undefined, empty string and null pass
    if (value !== undefined && value !== '' && value !== null) {
        // Coerce a single value to an array
        if (!Array.isArray(value)) {
            value = [value];
        }
        for (var i = 0; i < value.length; i++) {
            var thisValue = value[i];
            // If it's a string, check if there's a number in the string
            if (typeof thisValue === 'string') {
                thisValue = utils.number(thisValue);
            }
            // If it's not a number or NaN invalidate
            if (typeof thisValue !== 'number' || Number.isNaN(thisValue)) {
                result = false;
                break;
            }
        }
    }
    utils.defer(callback, result);
};

/**
 * Asynchronously confirms that the a value is present
 */
mixedarray.prototype.validateRequiredInput = function(item, data, callback) {
    var value = this.getValueFromData(data);
    var result = false;
    // If the field is undefined but has a value saved already, validate
    if (value === undefined) {
        if (item.get(this.path) && item.get(this.path).length) {
            result = true;
        }
    }
    // If it's a string that's not empty, validate
    if (typeof value === 'string' && value !== '') {
        result = true;
        // If it's an array of only numbers and/or numberify-able data, validate
    } else if (Array.isArray(value)) {
        var invalidContent = false;
        for (var i = 0; i < value.length; i++) {
            var thisValue = value[i];
            // If it's a string, check if there's a number in the string
            if (typeof thisValue === 'string') {
                thisValue = utils.number(thisValue);
            }
            // If even a single item is not a number or NaN, invalidate
            if (typeof thisValue !== 'number' || Number.isNaN(thisValue)) {
                invalidContent = true;
                break;
            }
        }
        if (invalidContent === false) {
            result = true;
        }
    }
    utils.defer(callback, result);
};

/**
 * Add filters to a query
 *
 * @param {Object} filter 			   		The data from the frontend
 * @param {String} filter.mode			  	The filter mode, either one of
 *                                     		"between", "gt" or "lt"
 * @param {String} [filter.presence='some'] The presence mode, either on of
 *                                          "none" and "some". Default: 'some'
 * @param {String|Object} filter.value 		The value that is filtered for
 */
mixedarray.prototype.addFilterToQuery = function(filter) {
    var query = {};
    var presence = filter.presence || 'some';
    // Filter empty/non-empty arrays (copied from textarray)
    if (filter.value === undefined ||
        filter.value === null ||
        filter.value === '') {
        // "At least one element contains nothing"
        // This isn't 100% accurate because this will only return arrays that
        // don't have elements, not ones that have empty elements, but it works
        // fine for 99% of the usecase
        query[this.path] = presence === 'some' ? {
            $size: 0,
            // "No elements contain nothing"
        } : {
            $not: {
                $size: 0,
            },
        };
        return query;
    }
    // Filter between two numbers
    if (filter.mode === 'between') {
        var min = utils.number(filter.value.min);
        var max = utils.number(filter.value.max);
        if (!isNaN(min) && !isNaN(max)) {
            query[this.path] = {
                $gte: min,
                $lte: max,
            };
            query[this.path] = addPresenceToQuery(presence, query[this.path]);
        }
        return query;
    }
    var value = utils.number(filter.value);
    // Filter greater than, less than and equals
    if (!isNaN(value)) {
        if (filter.mode === 'gt') {
            query[this.path] = {
                $gt: value,
            };
        } else if (filter.mode === 'lt') {
            query[this.path] = {
                $lt: value,
            };
        } else {
            query[this.path] = {
                $eq: value,
            };
        }
        query[this.path] = addPresenceToQuery(presence, query[this.path]);
    }
    return query;
};

/**
 * Checks that a valid array of number has been provided in a data object
 * An empty value clears the stored value and is considered valid
 *
 * Deprecated
 */
mixedarray.prototype.inputIsValid = function(data, required, item) {
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
 * Updates the value for this field in the item from a data object
 */
mixedarray.prototype.updateItem = function(item, data, callback) {
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
module.exports = mixedarray;