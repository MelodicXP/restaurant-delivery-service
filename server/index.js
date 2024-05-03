'use strict';

// Load environment variables
require('dotenv').config({ path: './.env' });

// Imports for external dependencies
const { Server } = require('socket.io');
const Queue = require('./lib/Queue');
const { socket } = require('../clients/socketManager');

// Server setup
const server = new Server();
const rds = server.of('/rds');

// Constants
const PORT = process.env.PORT || 3002;

// Instantiate queue for handling orders
const rdsQueue = new Queue(); // For food orders
const preparingFoodQueue = new Queue(); // For 'preparing food' notifications
const readyForPickupQueue = new Queue(); // For 'ready for pick up' notifications

// Set for tracking active vendor rooms
const customerRooms = new Set();

// Server listener
server.listen(PORT);

// Set up event listener for new socket connections to the 'rds' namespace.
rds.on('connection', (socket) => {
  console.log(`Socket ${socket.id} connected to rds (Restaurant Delivery Service) namespace`);

  // Listen for a 'JOIN' event to handle a socket joining a specific customer room.
  socket.on('JOIN', (customerRoom) => {
    socket.join(customerRoom);
    console.log(`Socket ${socket.id} joined customer ${customerRoom}'s room`);
    customerRooms.add(customerRoom); // Update the set of active customer rooms to include this new room.
    socket.broadcast.emit('NEW_CUSTOMER_ROOM', customerRoom); // Notify all other connected clients about the new customer room, excluding the socket that joined.
  });

  // Generic handler for logging any events received in this namespace.
  socket.onAny((event, foodOrder) => {
    const time = new Date();
    console.log('EVENT:', {
      event,
      time,
      foodOrder,
    });
  });

  // Respond to a request for all active customer rooms.
  socket.on('GET_CUSTOMER_ROOMS', () => {
    console.log('Emitting customer room list (if any):', Array.from(customerRooms));
    socket.emit('EXISTING_CUSTOMER_ROOMS', Array.from(customerRooms));
  });

  // Listen for 'FOOD_ORDER_READY' events, store orders in customer queue, forward food orders to restaurant
  socket.on('FOOD_ORDER_READY', (foodOrder) => {
    manageQueue('FOOD_ORDER_READY', socket, rdsQueue, foodOrder);
  });

  // Listen for acknowledgement from client that nofication ahs been received and remove from queue
  socket.on('ACKNOWLEDGE_FOOD_ORDER_READY', (acknowledgment) => {
    acknowledgeOrder(rdsQueue, acknowledgment);
  });

  // Get food orders from customer room queue
  socket.on('GET_FOOD_ORDERS', (room) => {
    emitAllNotifications('FOOD_ORDER_READY', rdsQueue, room);
  });

  // Listen for PREPARING_FOOD event, store notifications in queue, notify customer of status
  socket.on('PREPARING_FOOD', (foodOrder) => {
    manageQueue('PREPARING_FOOD', socket, preparingFoodQueue, foodOrder);
  });

  // Listen for Acknowledgment from client that notification has been received and remove from queue
  socket.on('ACKNOWLEDGE_PREP_FOOD', (acknowledgment) => {
    acknowledgeOrder(preparingFoodQueue, acknowledgment);
  });

  // Get preparing food notifications from queue
  socket.on('GET_PREPARING_FOOD_NOTIFICATIONS', (foodOrder) => {
    emitAllNotifications('PREPARING_FOOD', preparingFoodQueue, foodOrder);
  });

  // Listen for READY FOR PICKUP event to notify customer and driver that order is ready to pick up
  socket.on('READY_FOR_PICKUP', (foodOrder) => {
    manageQueue('READY_FOR_PICKUP', socket, readyForPickupQueue, foodOrder);
  });

  // Listen for acknowledgement from client that notification has been received and remove from queue
  socket.on('ACKNOWLEDGE_READY_FOR_PICKUP', (acknowledgment) => {
    acknowledgeOrder(readyForPickupQueue, acknowledgment);
  });

  // Get 'ready for pick up notifications' from queue
  socket.on('GET_READY_FOR_PICKUP_NOTIFICATIONS', (foodOrder) => {
    emitAllNotifications('READY_FOR_PICKUP', readyForPickupQueue, foodOrder);
  });
  
});

//*------ Helper Functions ------*/

// Add to queue, if id does not exist add to queue
function manageQueue(eventType, socket, queue, foodOrder) {
  const { customerRoom, orderID } = foodOrder;

  // Attempt to get data from queue
  let notifications = queue.getOrder(customerRoom);

  // If no existing notification queues, create one, then retrieve and add food order to it
  if (!notifications) {
    let customerQueueID = queue.addOrder(customerRoom, new Queue());
    notifications = queue.getOrder(customerQueueID);
    notifications.addOrder(orderID, foodOrder);
  }

  // If queue does not contain orderID passed in, add to queue
  if (!notifications.hasOrder(orderID)) {
    notifications.addOrder(orderID, foodOrder);
  }

  socket.to(customerRoom).emit(eventType, foodOrder);
}

// Remove acknowledged notifications from queue
function acknowledgeOrder(queue, acknowledgment) {
  const { customerRoom, orderID } = acknowledgment;
  let notifications = queue.getOrder(customerRoom);

  if (notifications && notifications.hasOrder(orderID)) {
    notifications.removeOrder(orderID);
    console.log(`Acknowledged and removed notification for order# ${orderID}`);
  }
}

// Get notifications from queue, and send for emission
function emitAllNotifications(eventType, queue, foodOrder) {
  const { customerRoom } = foodOrder;
  console.log(`Emitting ${eventType} notifications for ${customerRoom}`);

  // Attempt to get notifications from queue.
  let notifications = queue.getOrder(customerRoom);

  // If notifications exist, emit notification for each order in the queue
  if (notifications) {
    Object.keys(notifications.orders).forEach(orderID => {
      const orderDetails = notifications.orders[orderID];
      socket.emit(eventType, orderDetails);
    });
  } else {
    console.log(`No ${eventType} notifications found or empty queue`);
  }
} 