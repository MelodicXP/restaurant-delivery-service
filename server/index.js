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
// const driverQueue = new Queue(); // holds notitications of food ready for pickup
// const customerAndRestaurantQueue = new Queue(); // holds notifications of food delivered

// Set for tracking active vendor rooms
// const customerRooms = new Set();

// Server listener
server.listen(PORT);

// create / allow for connection
rds.on('connection', (socket) => {
  console.log(`Socket ${socket.id} connected to rds (Restaurant Delivery Service) namespace`);

  // Handle joining rooms
  socket.on('JOIN', (customerRoom) => {
    socket.join(customerRoom);
    console.log(`Socket ${socket.id} joined ${customerRoom} room`);
  });
  
});
