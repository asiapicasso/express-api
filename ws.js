import createDebugger from 'debug';
import { WebSocketServer } from 'ws';

const debug = createDebugger('express-api:messaging');

const clients = [];

export function createWebSocketServer(httpServer) {
  debug('Creating WebSocket server');
  const wss = new WebSocketServer({
    server: httpServer,
  });

  // Handle new client connections.
  wss.on('connection', function (ws) {
    debug('New WebSocket client connected');

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
      debug('WebSocket client disconnected');
    });
  });
}

/* export function broadcastVibrationAdded(vibration) {
  debug(`Broadcasting vibration added: ${JSON.stringify(vibration)}`);
  const message = { type: 'vibrationAdded', data: vibration };
  broadcastMessage(message);
} */

export function broadcastMessage(message) {
  debug(
    `Broadcasting message to all connected clients: ${JSON.stringify(message)}`
  );
  // Iterate over the "clients" array to send a message to all connected clients.
  clients.forEach((client) => {
    try {
      client.send(JSON.stringify(message));
    } catch (error) {
      debug(`Error broadcasting message to a client: ${error.message}`);
    }
  });
  console.log(message); //console log le message ('Broadcasting message:', message)
}
