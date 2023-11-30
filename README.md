# README

> REST API with express.js and MongoDB and mongoose
> 

🪴 [**Deploy version**](https://express-api-56k1.onrender.com/)

# Documentation

💡 You can find the documentation at [/docs](https://express-api-56k1.onrender.com/docs)

# Installation

## Install dependencies

👩🏻‍🌾 **npm install**

### What do I use ?

- **[Bcrypt](https://www.npmjs.com/package/bcrypt)** is a password-hashing function
- **[Mocha](https://mochajs.org/)** is a test framework making asynchronous testing
- **[EJS](https://ejs.co/)** is a template engine that works with Express.js
- **[Express.js](https://expressjs.com/)** is a back end web application framework for building RESTful APIs
- **[Morgan](https://www.npmjs.com/package/morgan)** is an HTTP request level Middleware
- **[MongoDB](https://www.mongodb.com/)** is a cross-platform document-oriented database program
- **[Mongoose](https://mongoosejs.com/docs/)** is a library for MongoDB that structure and access your data with ease
- **[ws](https://www.npmjs.com/package/ws)** is a library to implement WebSockets in your web application

# WebSocket Documentation

WebSockets are used to establish bidirectional real-time communication between the server and the client. Here is the documentation for the WebSockets used in my web application.

It send a defined piece of data when there is any kind of operations in the plant collection (CRUD concept).

ℹ️ [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

## 🌱 Plant WebSocket

### Listening for Changes on the Plant Collection

```jsx
const plantsStream = Plant.watch();

plantsStream.on('change', (change) => {
  const plant = change.fullDocument;

  switch (change.operationType) {
    case 'insert':
      // New plant added
      broadcastMessage({ type: 'plantAdded', data: plant });
      break;

    case 'delete':
      // Plant deleted
      broadcastMessage({ type: 'plantDeleted', data: plant });
      break;

    case 'update':
      // Plant updated
      broadcastMessage({ type: 'plantUpdated', data: plant });
      break;

    default:
      // Unhandled event
      broadcastMessage({ type: 'unhandled', data: plant });
  }
});
```

## 👥 User WebSocket

### Listening for Changes on the User Collection

```jsx
const usersStream = User.watch();

usersStream.on('change', async (change) => {
  const user = change.fullDocument;

  switch (change.operationType) {
    case 'insert':
      // New user added
      const userAdded = {
        message: 'welcome',
        type: 'userAdded',
        data: { firstname: user.firstname, lastname: user.lastname },
      };
      broadcastMessage(userAdded);
      break;

    case 'update':
      // User updated
      const updatedFields = change.updateDescription.updatedFields;
      // Handle updated fields if needed
      break;

    default:
      // Unhandled event
      broadcastMessage({ type: 'unhandled', data: user });
  }
});
```