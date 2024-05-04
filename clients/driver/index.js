'use strict';

// Load environment variables
require('dotenv').config({ path: './.env'});

// Imports
const socketManager = require('../socketManager');
const handlePickupAndDelivery = require('./handler');

// Contains list of joined rooms
let joinedRooms = new Set();

// Request server to send back all existing rooms
socketManager.emitEvent('GET_CUSTOMER_ROOMS');

// Join all existing customer rooms and request notifications
socketManager.listenForEvent('EXISTING_CUSTOMER_ROOMS', (customerRooms) => {
  console.log('Recieved customer rooms', customerRooms);
  customerRooms.forEach(room => {
    if (!joinedRooms.has(room)) {
      joinRoomAndRequestOrders(room);
      joinedRooms.add(room);
    }
  });
});

// Join newly created rooms and request notifications (in event driver joins namespace before anyone)
socketManager.listenForEvent('NEW_CUSTOMER_ROOM', (customerRoom) => {
  if (!joinedRooms.has(customerRoom)) {
    joinRoomAndRequestOrders(customerRoom);
    joinedRooms.add(customerRoom);
  }
});

// Listen for 'READY FOR PICKUP'
socketManager.listenForEvent('DRIVER_PICK_UP', (foodOrder) => {
  // Send acknowledgment back to the server
  socketManager.emitEvent('ACKNOWLEDGE_DRIVER_PICK_UP', {
    customerRoom: foodOrder.customerRoom,
    orderID: foodOrder.orderID,
  });
  processFoodOrder(foodOrder);
});

//*------ Helper Functions ------*/

// Join room and request notifications if any
function joinRoomAndRequestOrders(room) {
  socketManager.joinRoom(room);
  console.log(`Joined room ${room}`);
  socketManager.emitEvent('GET_DRIVER_PICK_UP_NOTIFICATIONS', {customerRoom: room});
}

// Process food order (pick up and delivery, notify restaurant and customer)
function processFoodOrder(foodOrder) {
  let socket = socketManager.socket;
  setTimeout(() => {
    handlePickupAndDelivery.simulatePickupProcess(socket, foodOrder);
  }, 2000);
  setTimeout(() => {
    handlePickupAndDelivery.simulateDeliveryProcess(socket, foodOrder);
  }, 4000);
}
