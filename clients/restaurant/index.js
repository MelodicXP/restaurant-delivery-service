'use strict';

// Load environment variables
require('dotenv').config({ path: './.env'});

// Imports
const socketManager = require('../socketManager');
const handleFoodPrepAndNotifyDriver = require('../restaurant/handler');

// Contain list of customer rooms joined
let joinedRooms = new Set();

// Request the server to send back all customer rooms
socketManager.emitEvent('GET_CUSTOMER_ROOMS');

// Handle receiving list of existing customer rooms
socketManager.listenForEvent('EXISTING_CUSTOMER_ROOMS', (customerRooms) => {
  console.log('Recieved customer rooms', customerRooms);
  customerRooms.forEach(room => {
    if (!joinedRooms.has(room)) {
      joinRoomAndRequestOrders(room);
      joinedRooms.add(room);
    }
  });
});

// Join newly created rooms and request orders(in event driver joins namespace before vendors)
socketManager.listenForEvent('NEW_CUSTOMER_ROOM', (customerRoom) => {
  if (!joinedRooms.has(customerRoom)) {
    joinRoomAndRequestOrders(customerRoom);
    joinedRooms.add(customerRoom);
  }
});

// Listen for food order ready
socketManager.listenForEvent('FOOD_ORDER_READY', (foodOrder) => {
  // Send acknowledgment back to the server
  socketManager.emitEvent('ACKNOWLEDGE_FOOD_ORDER_READY', {
    customerRoom: foodOrder.customerRoom,
    orderID: foodOrder.orderID,
  });
  processFoodOrder(foodOrder);
});

socketManager.listenForEvent('DELIVERED_NOTIFICATION_RESTAURANT', (foodOrder) => {
  console.log(`RESTAURANT: food order# ${foodOrder.orderID} for ${foodOrder.customerName} has been delivered by driver`);
  
  // Send acknowledgment back to the server
  socketManager.emitEvent('ACKNOWLEDGE_DELIVERED_NOTIFICATION_RESTAURANT', {
    customerRoom: foodOrder.customerRoom,
    orderID: foodOrder.orderID,
  });
});

//*------ Helper Functions ------*/

// Join room and request notifications from queue if any
function joinRoomAndRequestOrders(room) {
  socketManager.joinRoom(room);
  console.log(`Joined room ${room}`);
  socketManager.emitEvent('GET_FOOD_ORDERS', {customerRoom: room});
  socketManager.emitEvent('GET_DELIVERED_NOTIFICATIONS_RESTAURANT', {customerRoom: room });
}

//Process food order (prep food and notify driver ready for pickup)
function processFoodOrder(foodOrder) {
  let socket = socketManager.socket;
  setTimeout(() => {
    handleFoodPrepAndNotifyDriver.simulateFoodPrep(socket, foodOrder);
  }, 2000);
  setTimeout(() => {
    handleFoodPrepAndNotifyDriver.simulateNotifyDriverToPickUpOrder(socket, foodOrder);
  }, 4000);
}



