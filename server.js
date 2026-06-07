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

// Session timeout (2 minutes for testing, change to 30 minutes for production)
// Using 2 minutes so you can see it work faster
const SESSION_TIMEOUT = 2 * 60 * 1000; // 2 minutes

// Clean up expired sessions every 10 seconds (more aggressive cleanup)
setInterval(() => {
    const now = Date.now();
    let changed = false;
    let expiredSessions = [];
    
    // Find expired sessions
    Object.keys(sessions).forEach(sessionId => {
        const lastHeartbeat = sessions[sessionId].lastHeartbeat || sessions[sessionId].startTime;
        if (now - lastHeartbeat > SESSION_TIMEOUT) {
            expiredSessions.push(sessionId);
        }
    });
    
    // Remove expired sessions
    expiredSessions.forEach(sessionId => {
        delete sessions[sessionId];
        activeSessions--;
        changed = true;
        console.log(`Session expired: ${sessionId}`);
    });
    
    if (changed) {
        console.log(`Active sessions: ${activeSessions}`);
        io.emit('visitor-count', activeSessions);
        io.emit('session-details', sessions);
    }
}, 10000); // Check every 10 seconds

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Track new session or update existing
app.get('/track', (req, res) => {
    const sessionId = req.query.sessionId;
    const source = req.query.source || 'Direct';
    const location = req.query.location || 'Unknown';
    const device = req.query.device || 'Unknown';
    const browser = req.query.browser || 'Unknown';
    
    const isNewSession = !sessions[sessionId];
    
    sessions[sessionId] = {
        source: source,
        location: location,
        device: device,
        browser: browser,
        startTime: sessions[sessionId]?.startTime || Date.now(),
        lastHeartbeat: Date.now()
    };
    
    if (isNewSession) {
        activeSessions++;
        console.log(`New session: ${sessionId.substring(0, 20)}... Location: ${location}`);
        console.log(`Total active: ${activeSessions}`);
    }
    
    io.emit('visitor-count', activeSessions);
    io.emit('session-details', sessions);
    
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

// Manual leave (when tab closes gracefully)
app.get('/leave', (req, res) => {
    const sessionId = req.query.sessionId;
    
    if (sessions[sessionId]) {
        delete sessions[sessionId];
        activeSessions--;
        console.log(`Session left: ${sessionId?.substring(0, 20)}... Active: ${activeSessions}`);
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
    
    socket.on('request-initial', () => {
        socket.emit('visitor-count', activeSessions);
        socket.emit('session-details', sessions);
    });
    
    socket.on('disconnect', () => {
        console.log('Dashboard disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Session timeout: ${SESSION_TIMEOUT / 1000} seconds`);
});