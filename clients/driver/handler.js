'use strict';

const simulatePickupProcess = (socket, order) => {
  console.log(`\n\n---------------New Driver Pick Up for  ${order.customerName}---------------`);
  console.log(`\nDRIVER: food order# ${order.orderID} for ${order.customerName} has been picked up`);
  console.table(order.items);
  socket.emit('IN_TRANSIT', order);
};

const simulateDeliveryProcess = (socket, order) => {
  console.log(`\nDRIVER: food order# ${order.orderID} has been delivered`);
  socket.emit('DELIVERED_NOTIFICATION_CUST', order);
  socket.emit('DELIVERED_NOTIFICATION_DRIVER', order);
};

module.exports = {
  simulatePickupProcess,
  simulateDeliveryProcess,
};