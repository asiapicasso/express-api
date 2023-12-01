import createDebugger from 'debug';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose'; // Import the mongoose module
import dotenv from 'dotenv';
import { Plant } from './models/plant.js';
dotenv.config();
import { User } from './models/user.js';

const debug = createDebugger('express-api:messaging');
const clients = [];

const root = 'asia.picasso@heig-vd.ch';

export async function createWebSocketServer(httpServer) {
  console.debug('Creating WebSocket server');

  // Connect to MongoDB using the DATABASE_URL
  try {
    await mongoose.connect(process.env.DATABASE_URL, { //connexion avec le cloud
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.debug('Connected to MongoDB'); //je rentre
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process if there is an error connecting to the database
  }

  const wss = new WebSocketServer({
    server: httpServer,
  });

  // Realtime changes on the plants collection in MongoDB.
  mongoose.connection.once('open', () => {

    const plantsStream = Plant.watch();
    const usersStream = User.watch();

    // listen for change on plants collection
    plantsStream.on('change', (change) => {
      const plant = change.fullDocument;
      switch (change.operationType) {
        case 'insert':
          console.log('New plant added');
          broadcastMessage({ type: 'plantAdded', data: plant });

          break;
        case 'delete':
          console.log('Plant deleted');
          broadcastMessage({ type: 'plantDeleted', data: plant });

          break;
        case 'update':
          console.log('Plant updated');
          broadcastMessage({ type: 'plantUpdated', data: plant });

          break;
        default:
          console.log('Something happened');
          broadcastMessage({ type: 'unhandled', data: plant });
      }
    });

    // listen for change on users collection
    usersStream.on('change', async (change) => {
      const user = change.fullDocument;
      console.debug(change);

      switch (change.operationType) {
        case 'insert':
          console.log('New user added');
          const userAdded = {
            message: 'welcome',
            type: 'userAdded',
            data: User.firstname,
            data: `${JSON.stringify(User.firstname)}`,
            data: `${JSON.stringify(User.lastname)}`,
          };

          //console.debug(user);
          console.debug(`${JSON.stringify(userAdded)}`); //do not work
          broadcastMessage(userAdded);
          break;

        case 'update':


          const updatedFields = change.updateDescription.updatedFields;

          console.log('Champs mis à jour :', updatedFields);

          break;

        default:
          console.log('Unhandled change:', change);
          broadcastMessage({ type: 'unhandled', data: user });
      }
    });
  });


  // Handle new client connections.
  wss.on('connection', function(ws) {
    console.debug('New WebSocket client connected');

    // Keep track of clients.
    clients.push(ws);

    // Listen for messages sent by clients.
    ws.on('message', (message) => {
      // Make sure the message is valid JSON.
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message);
      } catch (err) {
        // Send an error message to the client with "ws" if you want...
        return debug('Invalid JSON message received from client');
      }

      console.log('Received message from client:', parsedMessage);
    });

    // Clean up disconnected clients.
    ws.on('close', () => {
      clients.splice(clients.indexOf(ws), 1);
      console.debug('WebSocket client disconnected');
    });
  });
}

export function broadcastMessage(message) {
  //console.debug(`Broadcasting message to all connected clients: ${JSON.stringify(message)}`);

  // Iterate over the "clients" array to send a message to all connected clients.
  clients.forEach((client) => {
    try {
      client.send(JSON.stringify(message));
    } catch (error) {
      console.debug(`Error broadcasting message to a client: ${error.message}`);
    }
  });
  // console.debug(message); console log le message ('Broadcasting message:', message)
}
