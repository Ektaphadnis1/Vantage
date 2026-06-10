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

// FEATURE #2: Historical Data Storage
let totalVisitors = 0;  // Total unique visitors ever
let totalPageViews = 0;  // Total page views across all sessions
let allTimeEvents = {
    product_views: 0,
    add_to_cart: 0
};

// Store session page views for duration calculation
let sessionPageViews = {};

// Session timeout (2 minutes for testing)
const SESSION_TIMEOUT = 2 * 60 * 1000; // 2 minutes

// Clean up expired sessions every 10 seconds
setInterval(() => {
    const now = Date.now();
    let changed = false;
    let expiredSessions = [];
    
    Object.keys(sessions).forEach(sessionId => {
        const lastHeartbeat = sessions[sessionId].lastHeartbeat || sessions[sessionId].startTime;
        if (now - lastHeartbeat > SESSION_TIMEOUT) {
            expiredSessions.push(sessionId);
        }
    });
    
    expiredSessions.forEach(sessionId => {
        // Calculate session duration before removing
        const session = sessions[sessionId];
        if (session) {
            const duration = (Date.now() - session.startTime) / 1000; // in seconds
            session.duration = duration;
        }
        delete sessions[sessionId];
        activeSessions--;
        changed = true;
        console.log(`Session expired: ${sessionId}`);
    });
    
    if (changed) {
        console.log(`Active sessions: ${activeSessions}`);
        io.emit('visitor-count', activeSessions);
        io.emit('session-details', sessions);
        io.emit('engagement-stats', calculateEngagementStats());
    }
}, 10000);

// Calculate engagement metrics
function calculateEngagementStats() {
    const sessionValues = Object.values(sessions);
    const totalSessions = sessionValues.length;
    
    // Calculate average session duration
    let totalDuration = 0;
    sessionValues.forEach(s => {
        const duration = (Date.now() - s.startTime) / 1000;
        totalDuration += duration;
    });
    const avgSessionDuration = totalSessions > 0 ? (totalDuration / totalSessions).toFixed(1) : 0;
    
    // Calculate pages per session
    let totalPages = 0;
    sessionValues.forEach(s => {
        totalPages += (s.pageViews || 1);
    });
    const pagesPerSession = totalSessions > 0 ? (totalPages / totalSessions).toFixed(1) : 0;
    
    // Calculate bounce rate (sessions with only 1 page view)
    let bounceCount = 0;
    sessionValues.forEach(s => {
        if ((s.pageViews || 1) === 1) {
            bounceCount++;
        }
    });
    const bounceRate = totalSessions > 0 ? ((bounceCount / totalSessions) * 100).toFixed(1) : 0;
    
    return {
        totalVisitors: totalVisitors,
        totalPageViews: totalPageViews,
        avgSessionDuration: avgSessionDuration,
        pagesPerSession: pagesPerSession,
        bounceRate: bounceRate,
        allTimeEvents: allTimeEvents
    };
}

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
        lastHeartbeat: Date.now(),
        pageViews: sessions[sessionId]?.pageViews || 1
    };
    
    if (isNewSession) {
        activeSessions++;
        totalVisitors++;
        console.log(`New session: ${sessionId.substring(0, 20)}... Location: ${location}`);
        console.log(`Total active: ${activeSessions} | Total all-time: ${totalVisitors}`);
    }
    
    io.emit('visitor-count', activeSessions);
    io.emit('session-details', sessions);
    io.emit('engagement-stats', calculateEngagementStats());
    
    res.send('ok');
});

// Track page view
app.get('/pageview', (req, res) => {
    const sessionId = req.query.sessionId;
    const page = req.query.page || 'unknown';
    
    if (sessions[sessionId]) {
        sessions[sessionId].pageViews = (sessions[sessionId].pageViews || 0) + 1;
        totalPageViews++;
        console.log(`Page view: ${page} - Session: ${sessionId.substring(0, 20)}... Total views: ${totalPageViews}`);
        
        io.emit('engagement-stats', calculateEngagementStats());
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

// Manual leave (when tab closes gracefully)
app.get('/leave', (req, res) => {
    const sessionId = req.query.sessionId;
    
    if (sessions[sessionId]) {
        delete sessions[sessionId];
        activeSessions--;
        console.log(`Session left: ${sessionId?.substring(0, 20)}... Active: ${activeSessions}`);
        io.emit('visitor-count', activeSessions);
        io.emit('session-details', sessions);
        io.emit('engagement-stats', calculateEngagementStats());
    }
    
    res.send('ok');
});

// Track custom events
app.get('/event', (req, res) => {
    const eventType = req.query.type;
    const product = req.query.product;
    const price = req.query.price;
    const sessionId = req.query.sessionId;
    
    console.log(`Event: ${eventType} - Product: ${product} - Price: ${price}`);
    
    // Update all-time event counts
    if (eventType === 'product_view') {
        allTimeEvents.product_views++;
    } else if (eventType === 'add_to_cart') {
        allTimeEvents.add_to_cart++;
    }
    
    // Also track page view for product pages
    if (eventType === 'product_view' && sessionId && sessions[sessionId]) {
        sessions[sessionId].pageViews = (sessions[sessionId].pageViews || 0) + 1;
        totalPageViews++;
        io.emit('engagement-stats', calculateEngagementStats());
    }
    
    io.emit('custom-event', {
        type: eventType,
        product: product,
        price: price,
        timestamp: new Date().toLocaleTimeString()
    });
    
    io.emit('engagement-stats', calculateEngagementStats());
    
    res.send('ok');
});

// Socket.io connection for dashboard
io.on('connection', (socket) => {
    console.log('Dashboard connected');
    
    // Send current data to new dashboard
    socket.emit('visitor-count', activeSessions);
    socket.emit('session-details', sessions);
    socket.emit('engagement-stats', calculateEngagementStats());
    
    socket.on('request-initial', () => {
        socket.emit('visitor-count', activeSessions);
        socket.emit('session-details', sessions);
        socket.emit('engagement-stats', calculateEngagementStats());
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