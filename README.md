# Lab - 401 Class 13 - Restaurant Delivery Service

## Project: Restaurant Delivery Service

Build out a system that emulates a real world food delivery services. Restaurant Delivery Service will simulate a food delivery service where clients will place food order, restaurant receives and prepares order, driver is notified and picks up and delivers food. Once driver delivers food restaurant and client will be notified that their customers received food order purchase.

This will be an event driven application that “distributes” the responsibility for logging to separate modules, using only events to trigger logging based on activity.

### Author: Melo

### Problem Domain - Phase 3 - Message Queues

Objective:  

1. Food Order and Delivery System:

- Hub Server: Manages orders, routing them from customers to restaurants, and then to delivery drivers.
- Clients: Customer clients can place orders; restaurant clients receive orders, mark them as ready; driver clients get notifications for pickups and deliveries. This includes using queues for order management and ensuring the correct flow of events.

### Links and Resources

- [Pull Request](https://github.com/MelodicXP/caps/pull/8)
- [GitHub Actions ci/cd](https://github.com/MelodicXP/caps/actions)

### Collaborators

### Setup

#### `.env` requirements (where applicable)

NAMESPACE_URL='yourURL/caps'

#### How to initialize/run your application (where applicable)

- e.g. node index.js on each file, start in this order:  

        1. server
        2. customers
        2. restaurant
        3. driver

#### How to use your library (where applicable)

#### Features / Routes

- Feature One: Deploy as prod branch once all tests pass.

#### Tests

- How do you run tests?
  - jest

- Any tests of note?  
  - driver-handler.test.js
  - flower-handler.test.js
  - widget-handler.test.js
  - OrderCreator.test.js
  - OrderQueue.test.js

#### UML

![Lab-14-UML](./assets/UMLDiagram.png)

#### File Structure

![Lab-14-UML-File-Structure](./assets/fileStructDiagram.png)

#### Terminal outputs

![Terminal Outputs](./assets/terminalOutputs.png)
