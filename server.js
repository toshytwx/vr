const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 8989;

// Scalars to store data from incoming POST
let scalar1 = 0;
let scalar2 = 0;
let scalar3 = 0;

// Middleware to parse JSON body
app.use(bodyParser.json());

// Handle incoming POST requests at /data
app.post('/data', (req, res) => {
  const data = req.body;
  if (
    typeof data.scalar1 === 'number' &&
    typeof data.scalar2 === 'number' &&
    typeof data.scalar3 === 'number'
  ) {
    scalar1 = data.scalar1;
    scalar2 = data.scalar2;
    scalar3 = data.scalar3;

    console.log(`Received -> scalar1: ${scalar1}, scalar2: ${scalar2}, scalar3: ${scalar3}`);
    res.sendStatus(200);
  } else {
    res.status(400).send('Invalid JSON data. Expecting { scalar1, scalar2, scalar3 }');
  }
});

// Create HTTP server
const server = http.createServer(app);

// Set up WebSocket server
const wss = new WebSocket.Server({ server });

// Broadcast scalars every 20ms to connected clients
wss.on('connection', (ws) => {
  console.log('WebSocket client connected.');

  const interval = setInterval(() => {
    const payload = {
      scalar1,
      scalar2,
      scalar3
    };
    ws.send(JSON.stringify(payload));
    console.log(`Sent -> ${JSON.stringify(payload)}`);
  }, 2000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('WebSocket client disconnected.');
  });
});

// Start server
server.listen(port, () => {
  console.log(`Bridge server running at http://localhost${port}`);
  console.log(`Listening for POST requests at /data and serving WebSocket on same port.`);
});
