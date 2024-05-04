'use strict';

const FoodOrder = require('./FoodOrder');

describe('FoodOrder Class', () => {
  let customer;
  let foodOrder;

  beforeEach(() => {
    // Setup a customer object for testing
    customer = {
      name: 'John Doe',
      address: '123 Elm St',
      customerRoom: 'Room123',
    };

    // Instantiate a new FoodOrder with the mock customer
    foodOrder = new FoodOrder(customer);
  });

  describe('addItem', () => {
    it('should add an item to the order', () => {
      const item = { name: 'Burger', price: 8.99 };
      foodOrder.addItem(item);

      // Check if the item has been added
      expect(foodOrder.items).toContainEqual(item);
    });
  });

  describe('createFoodOrder', () => {
    it('should create a food order with an order ID and customer details', () => {
      // Optionally add items
      foodOrder.addItem({ name: 'Burger', price: 8.99 });
      foodOrder.addItem({ name: 'Fries', price: 3.50 });
  
      const result = foodOrder.createFoodOrder();
  
      // Check if the result has the expected structure and data
      expect(result).toMatchObject({
        customerName: customer.name,
        address: customer.address,
        customerRoom: customer.customerRoom,
        items: [
          { name: 'Burger', price: 8.99 },
          { name: 'Fries', price: 3.50 },
        ],
      });
  
      // Additionally check if orderID is a string
      expect(typeof result.orderID).toBe('string');
    });
  });
  
});
