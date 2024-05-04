'use strict';

jest.mock('./lib/Customer');
jest.mock('./lib/FoodOrder');
const Customer = require('./lib/Customer');
const FoodOrder = require('./lib/FoodOrder');
const { createCustomer, createFoodOrderForCustomer } = require('./orderCreator');  

describe('Order System', () => {
  describe('createCustomer', () => {
    beforeEach(() => {
      jest.resetModules();
      process.env.CUSTOMER_INFO = JSON.stringify({ name: 'Jane Doe', address: '123 Example St' });
    });

    afterEach(() => {
      delete process.env.CUSTOMER_INFO;
    });

    it('creates a customer using environment variables', () => {
      const customer = createCustomer();
      expect(Customer).toHaveBeenCalledWith({
        name: 'Jane Doe',
        address: '123 Example St',
      });
    });

    it('falls back to default chance values when CUSTOMER_INFO is invalid', () => {
      process.env.CUSTOMER_INFO = 'invalid JSON';
      console.error = jest.fn();

      const customer = createCustomer();
      expect(console.error).toHaveBeenCalled();
      expect(Customer).toHaveBeenCalled();
    });
  });

  describe('createFoodOrderForCustomer', () => {
    let mockCustomer;

    beforeEach(() => {
      mockCustomer = new Customer({ name: 'Test Customer', address: '123 Test Ave' });
      FoodOrder.mockImplementation(() => {
        return {
          items: [],
          addItem: jest.fn(function(item) {
            this.items.push(item);
          }),
          createFoodOrder: jest.fn(function() {
            return {
              orderID: '123456',
              customerName: mockCustomer.name,
              address: mockCustomer.address,
              items: this.items,
            };
          }),
        };
      });
    });

    it('creates a food order for the customer with default items', () => {
      const foodOrder = createFoodOrderForCustomer(mockCustomer);
      expect(foodOrder.items.length).toBeGreaterThan(0);
    });

    it('creates a food order for the customer with provided items', () => {
      const items = [
        { name: 'Burger', price: 10.99 },
        { name: 'Fries', price: 4.99 },
      ];
      const foodOrder = createFoodOrderForCustomer(mockCustomer, items);
      expect(foodOrder.items).toEqual(expect.arrayContaining(items));
    });
  });
});
