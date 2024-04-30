'use strict';

const { io } = require('socket.io-client');

const rdsNameSpaceUrl = process.env.NAMESPACE_URL; 
const socket = io(rdsNameSpaceUrl);

function joinRoom(roomName) {
  socket.emit('JOIN', roomName);
}

function emitEvent(event, data) {
  socket.emit(event, data);
}

module.exports = {
  joinRoom,
  emitEvent,
  socket,
};
