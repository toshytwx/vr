const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 8989;

// Scalars to store data from incoming POST
let x = 0;
let y = 0;
let z = 0;

// Middleware to parse JSON body
app.use(bodyParser.json());

// Handle incoming POST requests at /data
app.post('/data', (req, res) => {
    const data = req.body;
    try {
      const parsed = parseSensorData(data);
  
      const latestAccel = parsed.accelerometer[parsed.accelerometer.length - 1];
  
      if (latestAccel && latestAccel.values.length >= 3) {
        x = latestAccel.values[0];
        y = latestAccel.values[1];
        z = latestAccel.values[2];
  
        console.log(`Received -> x: ${x}, y: ${y}, z: ${z}`);
        res.sendStatus(200);
      } else {
        console.log('No valid accelerometer data found');
        res.status(422).send('No valid accelerometer data found');
      }  
    } catch (err) {
      console.log('Error parsing payload:', err.message);
      res.status(400).send('Invalid payload format');
    }
  });
  

function parseSensorData(data) {
    if (!data || !Array.isArray(data.payload)) {
      throw new Error('Invalid input: payload missing or not an array');
    }
  
    const accelerometer = [];
    const accelerometerUncalibrated = [];
  
    data.payload.forEach(entry => {
      if (!entry || typeof entry.name !== 'string' || !entry.time || !entry.values) return;
  
      const parsedEntry = {
        time: entry.time,
        values: Array.isArray(entry.values) ? entry.values : Object.values(entry.values)
      };
  
      if (entry.name.toLowerCase() === 'accelerometer') {
        accelerometer.push(parsedEntry);
      } else if (entry.name.toLowerCase() === 'accelerometeruncalibrated') {
        accelerometerUncalibrated.push(parsedEntry);
      }
    });
  
    return {
      messageId: data.messageId,
      sessionId: data.sessionId,
      deviceId: data.deviceId,
      accelerometer,
      accelerometerUncalibrated
    };
  }  

// Create HTTP server
const server = http.createServer(app);

// Set up WebSocket server
const wss = new WebSocket.Server({ server });

// Broadcast scalars every 20ms to connected clients
wss.on('connection', (ws) => {
  console.log('WebSocket client connected.');

  const interval = setInterval(() => {
    const payload = {
      x,
      y,
      z
    };
    ws.send(JSON.stringify(payload));
    console.log(`Sent -> ${JSON.stringify(payload)}`);
  }, 20);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('WebSocket client disconnected.');
  });
});

// Start server
server.listen(port, () => {
  console.log(`Bridge server running at http://localhost:${port}`);
  console.log(`Listening for POST requests at /data and serving WebSocket on same port.`);
});
