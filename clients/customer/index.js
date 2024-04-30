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

// Schedule food orders to be sent regularly (every 11s)
setInterval(() => {
  const foodOrder = orderCreator.createFoodOrderForCustomer(customer);
  console.log('The following food order has been created:', foodOrder);

  let socket = socketManager.socket;
  orderHandler.sendFoodOrderToRestaurant(socket, foodOrder);
}, 11000);