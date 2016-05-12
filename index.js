'use strict';

const Joi = require('joi');
const {
  isString,
  isArray,
} = require('lodash');

exports = module.exports = Container;

const REGEX_INJECTOR_SOURCE = /^\S+$/;
const REGEX_INJECTOR_TARGET = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
const REGEX_MATCH_INJECTOR_AS_SYNTAX = /^(\S+) as (\S+)$/;

const JOI_INJECTION = Joi.object().keys({
  source: Joi.string().regex(REGEX_INJECTOR_SOURCE).required(),
  target: Joi.string().regex(REGEX_INJECTOR_TARGET).required(),
});

const JOI_REGISTRATION = Joi.object.keys({
  $name: Joi.string().required(),
  $inject: Joi.array(),
  $value: Joi.any(),
  $factory: Joi.func(),
  $service: Joi.func(),
}).xor('$value', '$factory', '$service').required();

class Container {

  constructor () {
    this.registry = new Map();
  }

  value (name, object) {
    return this.register(prepForRegister(name, [], object, '$value'));
  }

  factory (name, injections, callback) {
    return this.register(prepForRegister(name, injections, callback, '$factory'));
  }

  service (name, injections, callback) {
    return this.register(prepForRegister(name, injections, callback, '$service'));
  }

  register (subject) {

    subject = new Registration(subject);

    if (this.registry.has(subject.$name)) {
      throw new Error('${subject.$name} is already registered.');
    }

    this.registry.set(subject.$name, subject);

    return this;
  }

  start () {
    return new Promise((resolve, reject) => {
      const registry = this.registry;

    });
  }

  static create () {
    return new Container();
  }

}

class Registration {

  constructor (registration) {

    Joi.assert(registration, JOI_REGISTRATION, 'Invalid Registration Object');

    this.$name = registration.$name;
    this.$inject = registration.$inject.map((injection) => new Injection(injection));
    this.$value = registration.$value;
    this.$factory = registration.$factory;
    this.$service = registration.$service;
  }

  get isValue () {
    return exists(this.$value);
  }

  get isFactory () {
    return exists(this.$factory);
  }

  get isService () {
    return exists(this.$service);
  }

}

// Injection ValueObject
class Injection {

  constructor (injector) {

    if (!isString(injector)) {
      throw new Error('Injection constructor expects first argument to be a string.');
    }

    let result = injector.match(REGEX_MATCH_INJECTOR_AS_SYNTAX);

    if (isArray(result) && result.length === 3) { // has 'as' in it.
      this.source = result[1];
      this.target = result[2];
    } else {
      this.source = injector;
      this.target = injector;
    }

    this.original = injector;

    Joi.assert(this, JOI_INJECTION, 'Invalid Injection');
  }

}

// NOTE: make sure to bind to Container when using.
function prepForRegister($name, $inject, callback, type) {

  if (!exists(callback)) {
    callback = $inject;
    $inject = [];
  }

  let registeree = { $name, $inject };
  registeree[type] = callback;

  return registeree;
}

function exists(o) {
  return o != null; // === null || === undefined;
}
