import http from 'http';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { createWebSocketServer, broadcastMessage } from './ws.js';

// Configure chai
chai.use(chaiHttp);
const { expect } = chai;

describe('WebSocket Server Tests', () => {
    let server;

    // Start the HTTP server before running the tests
    before((done) => {
        server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('WebSocket Test\n');
        });

        createWebSocketServer(server);

        server.listen(8000, () => {
            console.log('Server listening on port 8000');
            done();
        });
    });

    // Stop the HTTP server after running the tests
    after((done) => {
        server.close(() => {
            console.log('Server closed');
            done();
        });
    });

    it('should broadcast a message to all connected clients', (done) => {
        // Use chai-http to simulate a WebSocket connection
        chai.request('http://localhost:8000')
            .get('/')
            .end((err, res) => {
                expect(err).to.be.null;

                // Simulate a WebSocket message
                const message = { content: 'Hello, WebSocket!' };
                broadcastMessage(message);

                // Wait for a short time to allow the message to be processed
                setTimeout(() => {
                    // Assert that the message was received by the client
                    expect(res.text).to.include(JSON.stringify(message));
                    done();
                }, 100);
            });
    });
});
