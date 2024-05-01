'use strict';

// Load environment variables
require('dotenv').config({ path: './.env' });

// Imports for external dependencies
const { Server } = require('socket.io');
// const Queue = require('./lib/Queue');

// Server setup
const server = new Server();
const rds = server.of('/rds');

// Constants
const PORT = process.env.PORT || 3002;


// Instantiate queues for handling orders
// const queue = new Queue();
// const driverQueue = new Queue(); // holds notitications of food ready for pickup
// const customerAndRestaurantQueue = new Queue(); // holds notifications of food delivered

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

  // Todo - Listen for 'FOOD_ORDER_READY' events to forward food orders to all clients in the relevant room.
  // Handle Food Order Ready (send to restaurant)
  socket.on('FOOD_ORDER_READY', (foodOrder) => {
    socket.broadcast.emit('FOOD_ORDER_READY', foodOrder);
  });
  
});
