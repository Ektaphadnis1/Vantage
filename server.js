const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store active sessions
let activeSessions = 0;

// Store session details (for locations, devices, etc.)
let sessions = {};

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// API endpoint for tracking script to call when someone visits
app.get('/track', (req, res) => {
    const sessionId = req.query.sessionId;
    const source = req.query.source || 'direct';
    const location = req.query.location || 'Unknown';
    const device = req.query.device || 'Unknown';
    const browser = req.query.browser || 'Unknown';
    
    // Check if this is a new session
    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            source: source,
            location: location,
            device: device,
            browser: browser,
            startTime: Date.now()
        };
        activeSessions++;
        
        // Broadcast updated count to all connected dashboards
        io.emit('visitor-count', activeSessions);
        io.emit('session-details', sessions);
    }
    
    res.send('ok');
});

// API endpoint for tracking when someone leaves
app.get('/leave', (req, res) => {
    const sessionId = req.query.sessionId;
    
    if (sessions[sessionId]) {
        delete sessions[sessionId];
        activeSessions--;
        io.emit('visitor-count', activeSessions);
        io.emit('session-details', sessions);
    }
    
    res.send('ok');
});

// Start server
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});