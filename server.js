const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store active sessions with timestamps
let sessions = {};
let activeSessions = 0;

// Session timeout (30 minutes = 1800000 ms)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Clean up expired sessions every minute
setInterval(() => {
    const now = Date.now();
    let changed = false;
    
    Object.keys(sessions).forEach(sessionId => {
        if (now - sessions[sessionId].lastHeartbeat > SESSION_TIMEOUT) {
            delete sessions[sessionId];
            activeSessions--;
            changed = true;
        }
    });
    
    if (changed) {
        io.emit('visitor-count', activeSessions);
        io.emit('session-details', sessions);
    }
}, 60000);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Track new session
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
            startTime: Date.now(),
            lastHeartbeat: Date.now()
        };
        activeSessions++;
        
        io.emit('visitor-count', activeSessions);
        io.emit('session-details', sessions);
    } else {
        // Update heartbeat
        sessions[sessionId].lastHeartbeat = Date.now();
    }
    
    res.send('ok');
});

// Heartbeat to keep session alive
app.get('/heartbeat', (req, res) => {
    const sessionId = req.query.sessionId;
    
    if (sessions[sessionId]) {
        sessions[sessionId].lastHeartbeat = Date.now();
    }
    
    res.send('ok');
});

// Remove session
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

// Track custom events
app.get('/event', (req, res) => {
    const eventType = req.query.type;
    const product = req.query.product;
    const price = req.query.price;
    
    console.log(`Event: ${eventType} - Product: ${product} - Price: ${price}`);
    
    io.emit('custom-event', {
        type: eventType,
        product: product,
        price: price,
        timestamp: new Date().toLocaleTimeString()
    });
    
    res.send('ok');
});

// Socket.io connection for dashboard
io.on('connection', (socket) => {
    console.log('Dashboard connected');
    
    // Send current data to new dashboard
    socket.emit('visitor-count', activeSessions);
    socket.emit('session-details', sessions);
    
    socket.on('disconnect', () => {
        console.log('Dashboard disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});