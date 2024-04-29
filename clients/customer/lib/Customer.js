'use strict';

class Customer {
  constructor(customerInfo) {
    this.name = customerInfo.name;
    this.address = customerInfo.address;
    this.customerRoom = customerInfo.name; // Using name as room identifier
  }
}

module.exports = Customer;