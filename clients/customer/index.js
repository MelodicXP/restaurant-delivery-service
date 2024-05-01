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

// Listen for notification/event of PREPARING_FOOD
socketManager.listenForEvent('PREPARING_FOOD', (foodOrder) => {
  console.log(
    `${foodOrder.customerName} your food order# ${foodOrder.orderID} is being prepared`);
});

// Listen for notification/event of READY_FOR_PICKUP
socketManager.listenForEvent('READY_FOR_PICKUP', (foodOrder) => {
  console.log(`${foodOrder.customerName} a driver has been notified to pick up your food order# ${foodOrder.orderID}`);
});

// Schedule food orders to be sent regularly (every 11s)
setInterval(() => {
  const foodOrder = orderCreator.createFoodOrderForCustomer(customer);
  console.log(`\n\n---------------New Food Order for ${customer.name}---------------`);

  console.log('\n The following food order has been created:', foodOrder);

  let socket = socketManager.socket;
  orderHandler.sendFoodOrderToRestaurant(socket, foodOrder);
}, 11000);