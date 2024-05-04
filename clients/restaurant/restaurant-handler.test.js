'use strict';

// Import the functions we are testing
const { simulateFoodPrep, simulateNotifyDriverToPickUpOrder } = require('./handler');

describe('Restaurant Order Simulation', () => {
  let mockSocket;
  let foodOrder;

  beforeEach(() => {
    // Create a mock socket with jest.fn() for the emit method
    mockSocket = {
      emit: jest.fn(),
    };

    // Create a sample food order to use in the tests
    foodOrder = {
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

  describe('simulateFoodPrep', () => {
    it('should log order details and emit an event for food preparation', () => {
      simulateFoodPrep(mockSocket, foodOrder);

      // Verify console outputs
      expect(console.log).toHaveBeenCalledWith(`\n\n---------------New Food Order for ${foodOrder.customerName}---------------`);
      expect(console.log).toHaveBeenCalledWith(`\nRESTAURANT: Received food order# ${foodOrder.orderID} for ${foodOrder.customerName}, commencing preparation of food items.`);
      expect(console.table).toHaveBeenCalledWith(foodOrder.items);

      // Verify socket emissions
      expect(mockSocket.emit).toHaveBeenCalledWith('PREPARING_FOOD', foodOrder);
    });
  });

  describe('simulateNotifyDriverToPickUpOrder', () => {
    it('should log notification details and emit events for pickup', () => {
      simulateNotifyDriverToPickUpOrder(mockSocket, foodOrder);

      // Verify console output
      expect(console.log).toHaveBeenCalledWith(`\nRESTAURANT: food order# ${foodOrder.orderID} is ready, driver has been notified to pick up order`);

      // Verify socket emissions for both stages of the notification process
      expect(mockSocket.emit).toHaveBeenCalledWith('READY_FOR_PICKUP', foodOrder);
      expect(mockSocket.emit).toHaveBeenCalledWith('DRIVER_PICK_UP', foodOrder);
    });
  });
});
