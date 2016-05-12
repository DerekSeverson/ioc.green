'use strict';

const co = require('co');
const IoC = require('ioc.green');

class Eater {
  constructor ({ food }) {
    this.food = food;
  }

  eat () {
    console.log('eating: ', this.food);
  }
}

co(function * () {

  let container = yield IoC.create()
    .value('Pasta', {
      ingredients: ['spagetti', 'alfredo'],
      price: 9.75,
    })
    .value('Pizza', {
      ingredients: ['pepperoni', 'sausage'],
      price: 12.45,
    })
    .register({
      $name: 'PizzaEater',
      $inject: ['Pizza as food'],
      $service: Eater,
    })
    .service(
      'PastaEater',
      ['Pasta as food'],
      Eater
    )
    .start();

  container.PastaEater.eat();
  container.PizzaEater.eat();

  return container;

  // .register(require('A'))
  // .register(require('B'))
  // .register(require('C'))
  // .register({
  //   $implements: 'EasyABC',
  //   $inject: [
  //     'config/rethinkdb as config',
  //   ],
  //   $factory: function ({ config }) {
  //     return new Promise((resolve, reject) => resolve('Easy as ABC 123'));
  //   },
  // })
  //
  // .service(
  //   'EasyAbc',
  //   ['config/rethinkdb as config'],
  //   class EasyABC {
  //     constructor ({ config }) {
  //       this.easy = config.easy;
  //     }
  //   }
  // )
  // .factory(
  //   'EasyABC',
  //   ['config/rethinkdb as config'],
  //   function ({ config }) {
  //     return config.easy;
  //   }
  // )
  // .start();

})
.then((container) => console.log('container: ', container))
.catch((err) => console.error('error: ', err));
