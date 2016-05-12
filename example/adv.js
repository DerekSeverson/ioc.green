'use strict';

const co = require('co');
const requirer = require('auto-module-requirer');
const IoC = require('ioc.green');

co(function * () {

  const registry = yield requirer();

  console.log(registry);

  let container = yield IoC.create()
    .registerMany(registry)
    .register(require('some-module'))
    .register({
      $implements: 'EasyABC',
      $inject: [
        'config/rethinkdb as config',
      ],
      $factory: function ({ config }) {
        return new Promise((resolve, reject) => resolve('Easy as ABC 123'));
      },
    })
    .value('Pizza', {
      ingredients: ['pepperoni', 'sausage'],
      price: 12.45,
    })
    .service(
      'EasyAbc',
      ['config/rethinkdb as config'],
      class EasyABC {
        constructor ({ config }) {
          this.easy = config.easy;
        }
      }
    )
    .factory(
      'EasyABC',
      ['config/rethinkdb as config'],
      function ({ config }) {
        return config.easy;
      }
    )
    .start();

  return yield IoC.create(container)
    .constant('Pizza', {
      ingredients: ['mushrooms'],
      price: 10.25,
    })
    .start();

})
.then()
.catch((err) => console.error(err));
