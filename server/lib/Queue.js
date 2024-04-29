'use strict';

class OrderQueue {
  constructor() {
    this.orders = {};
  }

  addOrder(orderID, orderDetails) {
    this.orders[orderID] = orderDetails;
    console.log('Order added to the queue');
    return orderID;
  }

  getOrder(orderID) {
    return this.orders[orderID];
  }

  removeOrder(orderID) {
    if (!this.orders[orderID]) {
      console.error('Order not found in queue');
      return null;
    }
    let orderDetails = this.orders[orderID];
    delete this.orders[orderID];
    console.log('Order was deleted from queue');
    return orderDetails;
  }
}

module.exports = OrderQueue;