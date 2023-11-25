import http from 'http';
import { Mongoose } from 'mongoose';
import { Vibration } from './models/vibration.js';
import { createWebSocketServer, broadcastMessage } from './ws.js';
import WebSocket from "ws";


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

    // Test broadcasting a message every 1 seconds
    setInterval(() => {
        const message = { content: 'Hello, WebSocket!' };
        broadcastMessage(message);
    }, 1000);


});


/* const ws = new WebSocket("ws://localhost:8000");


ws.on("open", function open() {
    console.log("Connected to WebSocket server");

    // ID correspondant de l'user dans la base de donnée
    const userID = "655379f9f4da0d1eb4f841b8";

    ws.send(JSON.stringify({ type: "new_user", id: userID }));
    console.log("Message sent");
});

ws.on("message", function incoming(data) {
    console.log('Received:', { data });
});

ws.on("close", function close() {
    console.log("Disconnected from WebSocket server");
});  */