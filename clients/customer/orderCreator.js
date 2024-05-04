'use strict';
const Chance = require('chance');
const chance = new Chance();
const Customer = require('./lib/Customer');
const FoodOrder = require('./lib/FoodOrder');

// Function Delcarations
function createCustomer() {
  // Use default chance name and address if none in env file
  const defaultCustomerInfo = {
    name: chance.name({ nationality: 'en' }),
    address: `${chance.city()}, ${chance.state()}`,
  };
  let customerInfo;

  try {
    customerInfo = process.env.CUSTOMER_INFO ? JSON.parse(process.env.CUSTOMER_INFO) : defaultCustomerInfo;
  } catch (error) {
    console.error('Error parsing CUSTOMER_INFO from environment, using default:', error);
    customerInfo = defaultCustomerInfo;
  }

  return new Customer(customerInfo);
}

function createFoodOrderForCustomer (customer, foodItems = []) {
  const foodOrder = new FoodOrder(customer);
  if (!foodItems || foodItems.length === 0) {
    foodItems = getDefaultFoodItems();  // Use default items if none provided by user
  }
  foodItems.forEach(item => foodOrder.addItem(item));
  return foodOrder.createFoodOrder();
}

function getDefaultFoodItems() {
  // Possible food items
  const possibleItems = [
    'Burger', 'Fries', 'Salad', 'Pizza', 'Soup', 'Sushi',
    'Pasta', 'Ice Cream', 'Sandwich', 'Taco',
  ];

  // Generate between 2 to 5 items
  const itemCount = chance.integer({ min: 2, max: 5 });

  // Generate random items with random prices
  const items = [];
  for (let i = 0; i < itemCount; i++) {
    const item = {
      name: chance.pickone(possibleItems),
      price: parseFloat(chance.floating({ min: 0.99, max: 19.99 }).toFixed(2)),
    };
    items.push(item);
  }
  return items;
}

module.exports = {
  createCustomer,
  createFoodOrderForCustomer,
};