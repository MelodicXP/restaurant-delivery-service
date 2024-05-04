'use strict';

const Customer = require('./Customer');

describe('Customer Class', () => {
  describe('constructor', () => {
    it('should create a customer with provided name, address, and a customer room', () => {
      // Define customer info
      const customerInfo = {
        name: 'John Doe',
        address: '123 Elm St',
      };

      // Create a new Customer instance
      const customer = new Customer(customerInfo);

      // Verify that the properties are set correctly
      expect(customer.name).toBe(customerInfo.name);
      expect(customer.address).toBe(customerInfo.address);
      expect(customer.customerRoom).toBe(customerInfo.name);  // Customer room is set to the name
    });

    it('should handle cases where incomplete info is provided', () => {
      // Define incomplete customer info
      const customerInfo = {
        name: 'Jane Doe',
        // No address provided
      };

      // Create a new Customer instance with incomplete info
      const customer = new Customer(customerInfo);

      // Verify that the name is set and address is undefined
      expect(customer.name).toBe(customerInfo.name);
      expect(customer.address).toBeUndefined();
      expect(customer.customerRoom).toBe(customerInfo.name);
    });
  });
});
