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
    if (!referrer || referrer === '') return 'Direct';
    if (referrer.includes('google')) return 'Google';
    if (referrer.includes('facebook')) return 'Facebook';
    if (referrer.includes('linkedin')) return 'LinkedIn';
    if (referrer.includes('twitter')) return 'Twitter';
    if (referrer.includes('instagram')) return 'Instagram';
    return 'Referral';
}

// Get device type
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) return 'Tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'Mobile';
    return 'Desktop';
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

// FOR TESTING: Manually set your location
const MANUAL_LOCATION = "Pune, Maharashtra, India";

// Get location
async function getLocation() {
    return MANUAL_LOCATION;
}

// LIVE SERVER URL
const API_BASE_URL = 'https://vantage-dashboard-skto.onrender.com';

// Track page view
function trackPageView() {
    const sessionId = getSessionId();
    const page = window.location.pathname;
    fetch(`${API_BASE_URL}/pageview?sessionId=${sessionId}&page=${encodeURIComponent(page)}`)
        .catch(err => console.log("Page view tracking error:", err));
}

// Track when visitor arrives
async function trackVisit() {
    const sessionId = getSessionId();
    const source = getTrafficSource();
    const device = getDeviceType();
    const browser = getBrowserName();
    const location = await getLocation();
    
    console.log(`Tracking: ${location} - ${device} - ${source}`);
    
    await fetch(`${API_BASE_URL}/track?sessionId=${sessionId}&source=${source}&location=${encodeURIComponent(location)}&device=${device}&browser=${browser}`);
}

// Track when visitor leaves
function trackLeave() {
    const sessionId = getSessionId();
    fetch(`${API_BASE_URL}/leave?sessionId=${sessionId}`);
}

// Send heartbeat every 15 seconds
let heartbeatInterval;
let isLeaving = false;

function startHeartbeat() {
    heartbeatInterval = setInterval(() => {
        if (!isLeaving) {
            const sessionId = getSessionId();
            fetch(`${API_BASE_URL}/heartbeat?sessionId=${sessionId}`);
            console.log('Heartbeat sent');
        }
    }, 15000);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

// Multiple ways to detect page/tab closing
window.addEventListener('beforeunload', () => {
    isLeaving = true;
    trackLeave();
    stopHeartbeat();
});

window.addEventListener('pagehide', () => {
    isLeaving = true;
    trackLeave();
    stopHeartbeat();
});

window.addEventListener('unload', () => {
    isLeaving = true;
    trackLeave();
    stopHeartbeat();
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        const sessionId = getSessionId();
        fetch(`${API_BASE_URL}/heartbeat?sessionId=${sessionId}`);
        console.log('Tab visible, heartbeat sent');
    }
});

// Initialize tracking
async function init() {
    await trackVisit();
    startHeartbeat();
    trackPageView(); // Track initial page view
}

init();