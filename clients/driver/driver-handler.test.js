'use strict';

// Import the functions we are testing
const { simulatePickupProcess, simulateDeliveryProcess } = require('./handler');

describe('Delivery Simulation', () => {
  let mockSocket;
  let order;

  beforeEach(() => {
    // Create a mock socket with jest.fn() for the emit method
    mockSocket = {
      emit: jest.fn(),
    };

    // Create a sample order to use in the tests
    order = {
      orderID: 'order123',
      customerName: 'John Doe',
      items: [
        { name: 'Burger', price: 8.99 },
        { name: 'Fries', price: 2.99 },
      ],
    };

    // Mock console functions to verify output
    global.console = {
      log: jest.fn(),
      table: jest.fn(),
      error: jest.fn(),
    };
  });

  describe('simulatePickupProcess', () => {
    it('should log pickup details and emit an event when an order is picked up', () => {
      simulatePickupProcess(mockSocket, order);

      // Verify console outputs
      expect(console.log).toHaveBeenCalledWith(`\n\n---------------New Driver Pick Up for  ${order.customerName}---------------`);
      expect(console.log).toHaveBeenCalledWith(`\nDRIVER: food order# ${order.orderID} for ${order.customerName} has been picked up`);
      expect(console.table).toHaveBeenCalledWith(order.items);

      // Verify socket emissions
      expect(mockSocket.emit).toHaveBeenCalledWith('IN_TRANSIT', order);
    });
  });

  describe('simulateDeliveryProcess', () => {
    it('should log delivery details and emit events when an order is delivered', () => {
      simulateDeliveryProcess(mockSocket, order);

      // Verify console output
      expect(console.log).toHaveBeenCalledWith(`\nDRIVER: food order# ${order.orderID} has been delivered`);

      // Verify socket emissions for delivery notifications
      expect(mockSocket.emit).toHaveBeenCalledWith('DELIVERED_NOTIFICATION_CUST', order);
      expect(mockSocket.emit).toHaveBeenCalledWith('DELIVERED_NOTIFICATION_RESTAURANT', order);
    });
  });
});
