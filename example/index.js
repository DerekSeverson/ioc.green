'use strict';

const co = require('co');
const IoC = require('ioc.green');

class Eater {
  constructor ({ food }) {
    this.food = food;
  }

  eat (who, how) {
    let str = '';
    if (who) str += (who + ' is ');
    str += 'eating ';
    str += this.food;
    if (how) str += (' with ' + how);
    console.log(str);
  }
}

co(function * () {

  let container = yield IoC.create()
    .value('Pasta', {
      toString() {
        return 'pasta';
      },

      ingredients: ['spagetti', 'alfredo'],
      price: 9.75,
    })
    .value('Pizza', {
      toString() {
        return 'pizza';
      },

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
      Self: {
        $name: 'Derek',
        $inject: ['PizzaEater as pizza', 'PastaEater as pasta'],
        $factory: function ({ pizza, pasta }) {
          const Derek = {
            eat() {
              pizza.eat('Derek', 'hands');
              pasta.eat('Derek', 'fork');
            },
          };
          Derek.eat();
          return Derek;
        },
      },
    })
    .start();

  container.PastaEater.eat();
  container.PizzaEater.eat();

  return container;

})
.then((container) => console.log('container: ', container))
.catch((err) => console.error('error: ', err));
