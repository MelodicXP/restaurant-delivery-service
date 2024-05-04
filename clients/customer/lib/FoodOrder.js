'use strict';
const Chance = require('chance');
const chance = new Chance();

class FoodOrder {
  constructor(customer) {
    this.customer = customer;
    this.items = [];
  }

  addItem(item) {
    this.items.push(item);
  }

  createFoodOrder() {
    this.orderID = chance.guid();
    return {
      orderID: this.orderID,
      customerName: this.customer.name,
      address: this.customer.address,
      customerRoom: this.customer.customerRoom,
      items: this.items,
    };
  }
}

module.exports = FoodOrder;