'use strict';

const simulateFoodPrep = (socket, foodOrder) => {
  console.log(`\n\n---------------New Food Order for ${foodOrder.customerName}---------------`);
  console.log(`\n RESTAURANT: Received food order# ${foodOrder.orderID} for ${foodOrder.customerName}, commencing preparation of food items.`);
  console.table(foodOrder.items);
  socket.emit('PREPARING_FOOD', foodOrder);
};

const simulateNotifyDriverToPickUpOrder = (socket, foodOrder) => {
  console.log(`\n RESTAURANT: food order# ${foodOrder.orderID} is ready, driver has been notified to pick up order`);
  socket.emit('READY_FOR_PICKUP', foodOrder);
};

module.exports = {
  simulateFoodPrep,
  simulateNotifyDriverToPickUpOrder,
};



