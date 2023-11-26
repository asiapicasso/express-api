import createDebugger from 'debug';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose'; // Import the mongoose module
import dotenv from 'dotenv';
dotenv.config();


const debug = createDebugger('express-api:messaging');
const clients = [];


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
    const plantsStream = mongoose.connection.collection('plants').watch();

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
  });


  // Handle new client connections.
  wss.on('connection', function (ws) {
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

      // Handle the message.
      onMessageReceived(ws, parsedMessage);

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
  console.debug(
    `Broadcasting message to all connected clients: ${JSON.stringify(message)}`
  );
  // Iterate over the "clients" array to send a message to all connected clients.
  clients.forEach((client) => {
    try {
      client.send(JSON.stringify(message));
    } catch (error) {
      console.debug(`Error broadcasting message to a client: ${error.message}`);
    }
  });
  console.log(message); //console log le message ('Broadcasting message:', message)
}

