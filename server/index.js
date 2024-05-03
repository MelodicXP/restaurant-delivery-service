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
    let customerRoom = room.customerRoom;

    console.log(`Emitting food ready orders for: ${customerRoom}`);

    // Attempt to get the customer's order queue from the rdsQueue manager.
    let customerOrders = rdsQueue.getOrder(customerRoom);
    
    if(customerOrders){
      Object.keys(customerOrders.orders).forEach(orderID => {
        // Emit event for each order in the queue
        const orderDetails = customerOrders.orders[orderID];
        socket.emit('FOOD_ORDER_READY', orderDetails);
      });
    } else {
      console.log('No customer food orders found or empty order queue');
    }
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
    let customerRoom = foodOrder.customerRoom;

    console.log(`Emitting preparing food notifications for: ${customerRoom}`);

    // Attempt to get customer prep food notification queue from preparingFoodQueue manager.
    let prepFoodNotifications = preparingFoodQueue.getOrder(customerRoom);

    // Check if orders exist to process
    if(prepFoodNotifications){
      Object.keys(prepFoodNotifications.orders).forEach(orderID => {
        // Emit event for each order in the queue
        const orderDetails = prepFoodNotifications.orders[orderID];
        socket.emit('PREPARING_FOOD', orderDetails);
      });
    } else {
      console.log('No prep food notifications found or empty order queue');
    }
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
    let customerRoom = foodOrder.customerRoom;

    console.log(`Emitting 'ready for pickup' notifcations for: ${customerRoom}`);

    // Attempt to get customer prep food notification queue from readyForPickUpQueue manager.
    let readyForPickupNotifications = readyForPickupQueue.getOrder(customerRoom);

    // Check if notifications exist to process
    if(readyForPickupNotifications){
      Object.keys(readyForPickupNotifications.orders).forEach(orderID => {
        // Emit event for each order in the queue
        const orderDetails = readyForPickupNotifications.orders[orderID];
        socket.emit('READY_FOR_PICKUP', orderDetails);
      });
    } else {
      console.log('No \'ready\' for pickup notifications found or empty order queue');
    }
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

// Remove from queue acknowledged notifications from client
function acknowledgeOrder(queue, acknowledgment) {
  const { customerRoom, orderID } = acknowledgment;
  let notifications = queue.getOrder(customerRoom);

  if (notifications && notifications.hasOrder(orderID)) {
    notifications.removeOrder(orderID);
    console.log(`Acknowledged and removed notification for order# ${orderID}`);
  }
}
