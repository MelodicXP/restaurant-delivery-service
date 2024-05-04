'use strict';

const { sendFoodOrderToRestaurant, thankDriverForDelivering } = require('./handler');

describe('Order Handling', () => {
  let mockSocket;
  let foodOrder;

  beforeEach(() => {
    // Mocking socket with Jest
    mockSocket = {
      emit: jest.fn(),
    };

    // Mocking a food order object
    foodOrder = {
      orderID: '1234',
      customerName: 'John Doe',
    };

    console.log = jest.fn(); // Mock console.log to verify output
    console.error = jest.fn(); // Mock console.error to verify error handling
  });

  describe('sendFoodOrderToRestaurant', () => {
    it('should emit food order details to restaurant', () => {
      sendFoodOrderToRestaurant(mockSocket, foodOrder);
      expect(mockSocket.emit).toHaveBeenCalledWith('FOOD_ORDER_READY', foodOrder);
      expect(console.log).toHaveBeenCalledWith(`\nStatus Update: ${foodOrder.customerName} your food order# ${foodOrder.orderID} sent to Restaurant`);
    });
  });

  describe('thankDriverForDelivering', () => {
    it('should thank driver when order is valid', () => {
      thankDriverForDelivering(mockSocket, foodOrder);
      expect(mockSocket.emit).toHaveBeenCalledWith('DELIVERY_THANK_YOU', foodOrder);
      expect(console.log).toHaveBeenCalledWith(`Thanking driver for delivery of ${foodOrder.orderID}`);
    });

    it('should log an error when order is invalid', () => {
      const invalidOrder = {}; // Missing orderID
      thankDriverForDelivering(mockSocket, invalidOrder);
      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Invalid or missing order data');
    });
  });
});
