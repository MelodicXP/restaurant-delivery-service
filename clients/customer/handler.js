'use strict';

function sendFoodOrderToRestaurant (socket, foodOrder) {
  console.log('---------------Food Order Sent to Restaurant-------------');
  socket.emit('FOOD_ORDER_READY', foodOrder);
}

function thankDriverForDelivering (socket, foodOrder) {
  if (orderExists(foodOrder)) {
    console.log(`Thanking driver for delivery of ${foodOrder.orderID}`);
    socket.emit('DELIVERY_THANK_YOU', foodOrder);
  } else {
    console.error('Invalid or missing order data');
  }
}

// Validates order data
function orderExists (order) {
  return order && order.orderID;
}

module.exports = {
  sendFoodOrderToRestaurant,
  thankDriverForDelivering,
};