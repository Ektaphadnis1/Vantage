// Generate a unique ID for this visitor
function getSessionId() {
    let id = sessionStorage.getItem('sessionId');
    if (!id) {
        id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('sessionId', id);
    }
    return id;
}

// Get traffic source from referrer
function getTrafficSource() {
    const referrer = document.referrer;
    if (!referrer) return 'direct';
    if (referrer.includes('google')) return 'organic';
    if (referrer.includes('facebook') || referrer.includes('linkedin') || referrer.includes('twitter') || referrer.includes('instagram')) return 'social';
    return 'referral';
}

// Get device type
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) return 'tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
    return 'desktop';
}

// Get browser name
function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Other';
}

// Get location from IP
async function getLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return `${data.city}, ${data.country_name}`;
    } catch (error) {
        return 'Unknown';
    }
}

// LIVE SERVER URL
const API_BASE_URL = 'https://vantage-dashboard-skto.onrender.com';

// Track when visitor arrives
async function trackVisit() {
    const sessionId = getSessionId();
    const source = getTrafficSource();
    const device = getDeviceType();
    const browser = getBrowserName();
    const location = await getLocation();
    
    await fetch(`${API_BASE_URL}/track?sessionId=${sessionId}&source=${source}&location=${location}&device=${device}&browser=${browser}`);
}

// Track when visitor leaves
function trackLeave() {
    const sessionId = getSessionId();
    fetch(`${API_BASE_URL}/leave?sessionId=${sessionId}`);
}

// Send heartbeat to keep session alive (every 30 seconds)
let heartbeatInterval;
function startHeartbeat() {
    heartbeatInterval = setInterval(() => {
        const sessionId = getSessionId();
        fetch(`${API_BASE_URL}/heartbeat?sessionId=${sessionId}`);
    }, 30000);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
}

// Detect page refresh vs close
let isRefreshing = false;

window.addEventListener('beforeunload', () => {
    isRefreshing = true;
    trackLeave();
    stopHeartbeat();
});

// Handle page visibility change (tab switch vs close)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Tab hidden - don't leave yet, just reduce heartbeat
        console.log('Tab hidden');
    } else {
        // Tab visible again - send heartbeat to confirm still active
        const sessionId = getSessionId();
        fetch(`${API_BASE_URL}/heartbeat?sessionId=${sessionId}`);
    }
});

// Handle page unload (refresh or close)
window.addEventListener('pagehide', () => {
    trackLeave();
    stopHeartbeat();
});

// Initialize tracking
async function init() {
    await trackVisit();
    startHeartbeat();
}

init();