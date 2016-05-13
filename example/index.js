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
    .factory(
      'Menu',
      ['Pasta', 'Pizza'],
      function (food) {
        console.log('Menu: ' + Object.keys(food).join(', '));
      }
    )
    .factory(
      'NoDependants',
      function (nothing) {
        console.log('NoDependants', nothing);
      }
    )
    .registerMany({
      './Dad': {
        $name: 'Dad',
        $inject: ['Pizza'],
        $value: {
          name: 'Jerry',
          enjoy: ['Painting', 'Water Aerobics'],
        },
      },
      'Mother/index.js': {
        $name: 'Mom',
        $factory: function () {
          return {
            name: 'Laura',
            enjoy: ['Family', 'Walks'],
          };
        },
      },
    })
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
