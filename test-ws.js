import http from 'http';
import { createWebSocketServer, broadcastMessage } from './ws.js';

// Create an HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket Test\n');
});

// Pass the HTTP server to createWebSocketServer
createWebSocketServer(server);

// Start the HTTP server
server.listen(8000, async () => {
    console.log('Server listening on port 8000');

    const message = { content: 'Hello, WebSocket!' };
    broadcastMessage(message);
});
