'use strict';
const assert = require('assert');

const debug = console.log.bind(console);

function isNull(obj) {
  return obj === null;
}

function isBoolean(obj) {
  return typeof obj === 'boolean';
}

function isString(obj) {
  return typeof obj === 'string';
}

function isNumber(obj) {
  return typeof obj === 'number';
}

function isFunction(obj) {
  return typeof obj === 'function';
}

function isArray(obj) {
  return Array.isArray(obj);
}

function isPromise(obj) {
  return obj && typeof obj.then === 'function';
}

function normalizeField(field) {
  if (isString(field)) {
    return {
      name: field,
    };
  }
  return field;
}

function isScalar(value) {
  return isNull(value) ||
    isBoolean(value) ||
    isNumber(value) ||
    isString(value);
}

function resolveField(field, value, ctx) {
  if (isScalar(value)) {
    return Promise.resolve(value);
  }

  if (isFunction(value)) {
    return resolveField(field, value.call(ctx, field.args));
  }

  if (isPromise(value)) {
    return value.then(v => resolveField(field, v, ctx));
  }

  if (isArray(value)) {
    return Promise.all(value.map(v => resolveField(field, v, ctx)));
  }

  return resolveFields(value, field.include);
}

/**
 * @param {Object} resolver
 * @param {any[]|string[]} fields
 * @returns {Promise}
 */
function resolveFields(resolver, fields) {
  const result = {};
  const promises = fields.map(normalizeField).map(field => {
    result[field.name] = undefined;
    return resolveField(field, resolver[field.name], resolver).then(v => {
      result[field.name] = v;
    })
  });
  return Promise.all(promises).then(() => result);
}

module.exports = resolveFields;