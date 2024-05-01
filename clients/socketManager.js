'use strict';

const { io } = require('socket.io-client');

const rdsNameSpaceUrl = process.env.NAMESPACE_URL; 
const socket = io(rdsNameSpaceUrl);

function joinRoom(roomName) {
  socket.emit('JOIN', roomName);
}

function emitEvent(event, data = null) {
  if (data !== null) {
    socket.emit(event, data);
  } else {
    socket.emit(event);
  }
}

function listenForEvent(eventType, handler) {
  socket.on(eventType, handler);
}

module.exports = {
  joinRoom,
  emitEvent,
  listenForEvent,
  socket,
};
