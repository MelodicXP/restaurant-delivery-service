'use strict';

const OrderQueue = require('./Queue');

describe('OrderQueue', () => {
  let queue;
  beforeEach(() => {
    queue = new OrderQueue();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('addOrder', () => {
    it('should add an order to the queue', () => {
      const orderID = '123';
      const orderDetails = { item: 'Apple', quantity: 3 };
      const result = queue.addOrder(orderID, orderDetails);

      expect(result).toBe(orderID);
      expect(queue.orders[orderID]).toEqual(orderDetails);
      expect(console.log).toHaveBeenCalledWith('Order added to the queue');
    });
  });

  describe('getOrder', () => {
    it('should retrieve an order by ID', () => {
      const orderID = '123';
      const orderDetails = { item: 'Apple', quantity: 3 };
      queue.addOrder(orderID, orderDetails); // First add order to retrieve

      const retrievedOrder = queue.getOrder(orderID);
      expect(retrievedOrder).toEqual(orderDetails);
    });

    it('should return undefined for a non-existent order', () => {
      const retrievedOrder = queue.getOrder('nonexistent');
      expect(retrievedOrder).toBeUndefined();
    });
  });

  describe('removeOrder', () => {
    it('should remove an existing order from the queue', () => {
      const orderID = '123';
      const orderDetails = { item: 'Apple', quantity: 3 };
      queue.addOrder(orderID, orderDetails);

      const removedOrder = queue.removeOrder(orderID);
      expect(removedOrder).toEqual(orderDetails);
      expect(queue.orders).not.toHaveProperty(orderID);
      expect(console.log).toHaveBeenCalledWith('Order was deleted from queue');
    });

    it('should handle attempts to remove a non-existent order', () => {
      const removedOrder = queue.removeOrder('nonexistent');
      expect(removedOrder).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Order not found in queue');
    });
  });
});
