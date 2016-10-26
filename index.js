'use strict';
const _ = require('lodash');
const assert = require('assert');

const debug = console.log.bind(console);

function isPromise(obj) {
  return typeof obj.then === 'function';
}

function normalizeField(field) {
  if (_.isString(field)) {
    return {
      name: field,
    };
  }
  return field;
}

function isFinal(value) {
  return _.isNull(value) ||
    _.isBoolean(value) ||
    _.isNumber(value) ||
    _.isString(value);
}

function resolveField(field, value, ctx = null) {
  if (isFinal(value)) {
    return Promise.resolve(value);
  }

  if (_.isFunction(value)) {
    return resolveField(field, value.call(ctx, field.args));
  }

  if (isPromise(value)) {
    return value.then(v => resolveField(field, v, ctx));
  }

  if (_.isArray(value)) {
    return Promise.all(value.map(v => resolveField(field, v, ctx)));
  }

  return resolveFields(value, field.include);
}

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