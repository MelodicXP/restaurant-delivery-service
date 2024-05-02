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
    let customerRoom = foodOrder.customerRoom; 
    let orderID = foodOrder.orderID;

    // Attempt to get the customer orders queue from the rdsQueue manager.
    let customerOrders = rdsQueue.getOrder(customerRoom);

    // Check if the customer already has an order queue.
    if (customerOrders) {
      // If customer has an existing queue, proceed to add the new food order.
      customerOrders.addOrder(orderID, foodOrder);
    } else {
      // No existing queue for this customer, create one, then retrieve and add food order to it.
      let customerQueueId = rdsQueue.addOrder(foodOrder.customerRoom, new Queue());
      customerOrders = rdsQueue.getOrder(customerQueueId);
      customerOrders.addOrder(orderID, foodOrder);
    }
    socket.to(customerRoom).emit('FOOD_ORDER_READY', foodOrder);
  });

  // Get food orders from customer room queue
  socket.on('GET_FOOD_ORDERS', (room) => {
    let customerRoom = room.customerRoom;

    console.log(`Emitting customer orders for: ${customerRoom}`);

    // Attempt to get the customer's order queue from the rdsQueue manager.
    let customerOrders = rdsQueue.getOrder(customerRoom);

    // Check if orders exist to process
    let ordersExist = customerOrders && Object.keys(customerOrders).length > 0;
    
    if(ordersExist){
      Object.keys(customerOrders.orders).forEach(orderID => {
        // Emit event for each order in the queue
        const orderDetails = customerOrders.orders[orderID];
        socket.emit('FOOD_ORDER_READY', orderDetails);
      });
    } else {
      console.log('No orders found or empty order queue');
    }
  });

  // Listen for PREPARING_FOOD event, store notifications in queue, notify customer of status
  socket.on('PREPARING_FOOD', (foodOrder) => {
    let customerRoom = foodOrder.customerRoom;
    let orderID = foodOrder.orderID;

    // Attempt to get preparing food notifications if any from preparingFoodQueue
    let prepFoodNotifications = preparingFoodQueue.getOrder(customerRoom);

    // If no existing queue for this customer, create one, then retrieve and add food order to it.
    if (!prepFoodNotifications) {
      let customerQueueID = preparingFoodQueue.addOrder(customerRoom, new Queue());
      prepFoodNotifications = preparingFoodQueue.getOrder(customerQueueID);
      prepFoodNotifications.addOrder(orderID, foodOrder);
    }

    // If queue (prep food notifiations) does not contain orderID passed in, add to queue
    if (!prepFoodNotifications.hasOrder(orderID)) {
      prepFoodNotifications.addOrder(orderID, foodOrder);
    }
    socket.to(customerRoom).emit('PREPARING_FOOD', foodOrder);
  });

  // Listen for Acknowledgment from client that notification has been received.
  socket.on('ACKNOWLEDGE_PREP_FOOD', (acknowledgment) => {
    let { customerRoom, orderID } = acknowledgment;

    let prepFoodNotifications = preparingFoodQueue.getOrder(customerRoom);
    
    if (prepFoodNotifications && prepFoodNotifications.hasOrder(orderID)) {
      prepFoodNotifications.removeOrder(orderID);
      console.log(`Acknowledged and removed prep food notification for order ${orderID}`);
    }
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
    let customerRoom = foodOrder.customerRoom;
    let orderID = foodOrder.orderID;

    // Attempt to get preparing food notifications if any from preparingFoodQueue
    let readyForPickupNotifications = readyForPickupQueue.getOrder(customerRoom);

    // Check if customer already has a prep food notification queue
    if (readyForPickupNotifications) {
      // if queue exists, and food order to queue
      readyForPickupNotifications.addOrder(orderID, foodOrder);
    } else {
      // No existing queue for this customer, create one, then retrieve and add food order to it.
      let customerQueueID = readyForPickupQueue.addOrder(foodOrder.customerRoom, new Queue());
      readyForPickupNotifications = readyForPickupQueue.getOrder(customerQueueID);
      readyForPickupNotifications.addOrder(orderID, foodOrder);
    }
    socket.to(foodOrder.customerRoom).emit('READY_FOR_PICKUP', foodOrder);
  });

  // Todo - get ready for pick up notifications from queue
  socket.on('GET_READY_FOR_PICKUP_NOTIFICATIONS', (foodOrder) => {
    let customerRoom = foodOrder.customerRoom;

    console.log(`Emitting 'ready for pickup' notifcations for: ${customerRoom}`);

    // Attempt to get customer prep food notification queue from readyForPickUpQueue manager.
    let readyForPickupNotifications = readyForPickupQueue.getOrder(customerRoom);

    // Check if orders exist to process
    let notificationsExist = readyForPickupNotifications && Object.keys(readyForPickupNotifications).length > 0;
    
    if(notificationsExist){
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

