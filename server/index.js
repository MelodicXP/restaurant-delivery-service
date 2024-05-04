'use strict';

// Load environment variables
require('dotenv').config({ path: './.env' });

// Imports for external dependencies
const { Server } = require('socket.io');
const Queue = require('./lib/Queue');

// Server setup
const server = new Server();
const rds = server.of('/rds');

// Constants
const PORT = process.env.PORT || 3002;

// Instantiate queue for handling orders
const rdsQueue = new Queue(); // For food orders
const preparingFoodQueue = new Queue(); // For 'preparing food' notifications
const clientReadyForPickupQueue = new Queue(); // hold client 'ready for pick up' notifications
const driverReadyForPickupQueue = new Queue(); // Queue for 'driver pick up' notifications
const deliveredNotificationCustomerQueue = new Queue();
// const deliveredNotificationDriverQueue = new Queue();
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

  socket.on('FOOD_ORDER_READY', (foodOrder) => {
    addToQueueAndEmitToRoom('FOOD_ORDER_READY', socket, rdsQueue, foodOrder);
  });

  socket.on('ACKNOWLEDGE_FOOD_ORDER_READY', (acknowledgment) => {
    acknowledgeAndRemoveFromQueue(rdsQueue, acknowledgment);
  });

  socket.on('GET_FOOD_ORDERS', (room) => {
    getFromQueueAndEmitNotifications('FOOD_ORDER_READY', socket, rdsQueue, room);
  });

  socket.on('PREPARING_FOOD', (foodOrder) => {
    addToQueueAndEmitToRoom('PREPARING_FOOD', socket, preparingFoodQueue, foodOrder);
  });

  socket.on('ACKNOWLEDGE_PREP_FOOD', (acknowledgment) => {
    acknowledgeAndRemoveFromQueue(preparingFoodQueue, acknowledgment);
  });

  socket.on('GET_PREPARING_FOOD_NOTIFICATIONS', (foodOrder) => {
    getFromQueueAndEmitNotifications('PREPARING_FOOD', socket, preparingFoodQueue, foodOrder);
  });

  socket.on('READY_FOR_PICKUP', (foodOrder) => {
    addToQueueAndEmitToRoom('READY_FOR_PICKUP', socket, clientReadyForPickupQueue, foodOrder);
  });

  socket.on('ACKNOWLEDGE_READY_FOR_PICKUP', (acknowledgment) => {
    acknowledgeAndRemoveFromQueue(clientReadyForPickupQueue, acknowledgment);
  });

  socket.on('GET_READY_FOR_PICKUP_NOTIFICATIONS', (foodOrder) => {
    getFromQueueAndEmitNotifications('READY_FOR_PICKUP', socket, clientReadyForPickupQueue, foodOrder);
  });

  socket.on('DRIVER_PICK_UP', (foodOrder) => {
    addToQueueAndEmitToRoom('DRIVER_PICK_UP', socket, driverReadyForPickupQueue, foodOrder);
  });

  socket.on('ACKNOWLEDGE_DRIVER_PICK_UP', (acknowledgment) => {
    acknowledgeAndRemoveFromQueue(driverReadyForPickupQueue, acknowledgment);
  });

  socket.on('GET_DRIVER_PICK_UP_NOTIFICATIONS', (foodOrder) => {
    getFromQueueAndEmitNotifications('DRIVER_PICK_UP', socket, driverReadyForPickupQueue, foodOrder);
  });

  socket.on('DELIVERED_NOTIFICATION_CUST', (foodOrder) => {
    addToQueueAndEmitToRoom('DELIVERED_NOTIFICATION_CUST', socket, deliveredNotificationCustomerQueue, foodOrder);
  });

  socket.on('ACKNOWLEDGE_DELIVERED_NOTIFICATION_CUST', (acknowledgment) => {
    acknowledgeAndRemoveFromQueue(deliveredNotificationCustomerQueue, acknowledgment);
  });

  socket.on('GET_DELIVERED_NOTIFICATIONS_CUST', (foodOrder) => {
    getFromQueueAndEmitNotifications('DELIVERED_NOTIFICATION_CUST', socket, deliveredNotificationCustomerQueue, foodOrder);
  });
  
});

//*------ Helper Functions ------*/

// Add to queue, if id does not exist add to queue
function addToQueueAndEmitToRoom(eventType, socket, queue, foodOrder) {
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
function acknowledgeAndRemoveFromQueue(queue, acknowledgment) {
  const { customerRoom, orderID } = acknowledgment;
  let notifications = queue.getOrder(customerRoom);

  if (notifications && notifications.hasOrder(orderID)) {
    notifications.removeOrder(orderID);
    console.log(`Acknowledged and removed notification for order# ${orderID}`);
  }
}

// Get notifications from queue, and send for emission
function getFromQueueAndEmitNotifications(eventType, socket, queue, foodOrder) {
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