const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store active sessions
let activeSessions = 0;
let sessions = {};

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Also serve HTML files directly from root if needed
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API endpoint for tracking script to call when someone visits
app.get('/track', (req, res) => {
    const sessionId = req.query.sessionId;
    const source = req.query.source || 'direct';
    const location = req.query.location || 'Unknown';
    const device = req.query.device || 'Unknown';
    const browser = req.query.browser || 'Unknown';
    
    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            source: source,
            location: location,
            device: device,
            browser: browser,
            startTime: Date.now()
        };
        activeSessions++;
        
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

// Make sure tracker.js is accessible
app.get('/tracker.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tracker.js'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});