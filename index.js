'use strict';

const Joi = require('joi');
const Promise = require('bluebird');
const {
  isString,
  isArray,
  isEmpty,
  each,
  map,
  filter,
  find,
  transform,
  every,
  some,
  keys,
} = require('lodash');

const REGEX_INJECTOR_SOURCE = /^\S+$/;
const REGEX_INJECTOR_TARGET = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
const REGEX_MATCH_INJECTOR_AS_SYNTAX = /^(\S+) as (\S+)$/;

const JOI_INJECTION = Joi.object().keys({
  source: Joi.string().regex(REGEX_INJECTOR_SOURCE).required(),
  target: Joi.string().regex(REGEX_INJECTOR_TARGET).required(),
  original: Joi.string(),
});

const JOI_REGISTRATION = Joi.object().keys({
  $name: Joi.string().required(),
  $inject: Joi.array(),
  $value: Joi.any(),
  $factory: Joi.func(),
  $service: Joi.func(),
}).xor('$value', '$factory', '$service').required();

exports = module.exports = class Container {

  constructor () {
    this.registry = {};
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

    if (subject.$name in this.registry) {
      throw new Error('${subject.$name} is already registered.');
    }

    this.registry[subject.$name] = subject;

    return this;
  }

  start () {
    return resolveAllDependencies(this.registry);
  }

  static create () {
    return new Container();
  }

};

// --------------
// Helper Classes

// Registration Value Object
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

  get dependencies () {
    return map(this.$inject, 'source');
  }

}

// Injection Value Object
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

// ----------------
// Helper Functions

function resolveAllDependencies(registry) {
  return new Promise((resolve, reject) => {

    // Check if all dependencies are accounted for.
    each(registry, (registeree) => {
      let missing = find(registeree.dependencies, (dep) => !(dep in registry));
      if (missing) throw new Error(`Dependency "${missing}" not defined.`);
    });

    // Objects for final results
    let results = {};
    let resolves = {};

    // This will run until we got everything resolved.
    let resolver = () => {
      let batch = [];
      let order = [];

      each(registry, (registeree, name) => {
        if (name in results) return;

        // if any dependencies are unmet, just return.
        if (some(registeree.dependencies, (dep) => !(dep in results))) return;

        // All dependencies are met!! Run the provider to get value.
        let value = runProvider(registeree, results);

        // Must still be resolved.
        if (isPromise(value)) {
          batch.push(value);
          order.push(name);
        } else {
          results[name] = value;
        }
      });

      if (isEmpty(batch)) {
        if (keys(results).length === keys(registry).length) return results;

        let unresolved = keys(filter(registry, (reg, name) => !(name in results)));
        throw new Error('Unresolvable dependencies: ' + unresolved.join(', '));
      }

      return Promise.all(batch).then((values) => {
        each(values, (val, i) => results[order[i]] = val);
      }).then(resolver);

    }; // end of resolver().

    resolve(resolver());
  });
}

function runProvider(registeree, container) {
  if (registeree.isValue) {
    return registeree.$value;
  }

  if (registeree.isFactory || registeree.isService) {
    let arg = transform(registeree.$inject, (arg, injection) => {
      arg[injection.target] = container[injection.source];
    }, {});

    return registeree.isFactory
      ? registeree.$factory(arg)
      : new registeree.$service(arg);
  }

  throw new Error('Unknown Registeration Type.'); // should never happen.
}

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

function isPromise(o) {
  return o && o.then && typeof o.then === 'function';
}
