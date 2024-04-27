'use strict';

// Load environment variables
require('dotenv').config({ path: './.env'});

// Imports for external dependencies
const { io } = require('socket.io-client');
// const { createFoodOrder } = require('./handler');

// Constants
const rdsNameSpaceUrl = process.env.NAMESPACE_URL;
const socket = io(rdsNameSpaceUrl);
const customerRoom = process.env.ROOM_NAME || 'default-customer-room';

socket.emit('JOIN', customerRoom, () => {
  console.log(`Joined ${customerRoom} room`);
}); 
