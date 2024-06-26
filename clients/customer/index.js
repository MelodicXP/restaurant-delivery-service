'use strict';

// Load environment variables
require('dotenv').config({ path: './.env'});

// Import socket manager
const socketManager = require('../socketManager');

// Imports for external dependencies
const orderCreator = require('./orderCreator');
const orderHandler = require('./handler');

//**------Main execution Logic------**/
const customer = orderCreator.createCustomer();

// Join room using socket manager
socketManager.joinRoom(customer.customerRoom); 

// Request the server send back all prep food notifications
socketManager.emitEvent('GET_PREPARING_FOOD_NOTIFICATIONS', {customerRoom: customer.customerRoom });

// Listen for notification/event of PREPARING_FOOD
socketManager.listenForEvent('PREPARING_FOOD', (foodOrder) => {
  console.log(`Status Update: ${foodOrder.customerName} your food order# ${foodOrder.orderID} is being prepared`);

  // Send acknowledgment back to the server
  socketManager.emitEvent('ACKNOWLEDGE_PREP_FOOD', {
    customerRoom: customer.customerRoom,
    orderID: foodOrder.orderID,
  });
});

// Request the server send back all 'ready for pick up' notifications
socketManager.emitEvent('GET_READY_FOR_PICKUP_NOTIFICATIONS', {customerRoom: customer.customerRoom });

// Listen for notification/event of READY_FOR_PICKUP
socketManager.listenForEvent('READY_FOR_PICKUP', (foodOrder) => {
  console.log(`Status Update: ${foodOrder.customerName} a driver has been notified to pick up your food order# ${foodOrder.orderID}`);

  // Send acknowledgment back to the server
  socketManager.emitEvent('ACKNOWLEDGE_READY_FOR_PICKUP', {
    customerRoom: customer.customerRoom,
    orderID: foodOrder.orderID,
  });
});


// Request the server send back all 'ready for pick up' notifications
socketManager.emitEvent('GET_DELIVERED_NOTIFICATIONS_CUST', {customerRoom: customer.customerRoom });

socketManager.listenForEvent('DELIVERED_NOTIFICATION_CUST', (foodOrder) => {
  console.log(`Status Update: ${foodOrder.customerName} your food order# ${foodOrder.orderID} has been delivered`);
  console.table(foodOrder.items);

  // Send acknowledgment back to the server
  socketManager.emitEvent('ACKNOWLEDGE_DELIVERED_NOTIFICATION_CUST', {
    customerRoom: customer.customerRoom,
    orderID: foodOrder.orderID,
  });
});

// Schedule food orders to be sent regularly (every 11s)
setInterval(() => {
  const foodOrder = orderCreator.createFoodOrderForCustomer(customer);
  console.log(`\n\n---------------New Food Order for ${customer.name}---------------`);

  console.log('\n The following food order has been created:', foodOrder);

  let socket = socketManager.socket;
  orderHandler.sendFoodOrderToRestaurant(socket, foodOrder);
}, 15000);