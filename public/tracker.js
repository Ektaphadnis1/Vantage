// Generate a unique ID for this visitor
function getSessionId() {
    let id = localStorage.getItem('sessionId');
    if (!id) {
        id = 'session_' + Date.now() + '_' + Math.random();
        localStorage.setItem('sessionId', id);
    }
    return id;
}

// Get traffic source from referrer
function getTrafficSource() {
    const referrer = document.referrer;
    if (!referrer) return 'direct';
    if (referrer.includes('google')) return 'organic';
    if (referrer.includes('facebook') || referrer.includes('linkedin') || referrer.includes('twitter')) return 'social';
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
    return 'Other';
}

// Get location from IP (simplified - in production use a real IP geolocation API)
async function getLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return `${data.city}, ${data.country_name}`;
    } catch (error) {
        return 'Unknown';
    }
}

// LIVE SERVER URL - CHANGE THIS TO YOUR RENDER URL
const API_BASE_URL = 'https://vantage-dashboard-skto.onrender.com';

// Track when visitor arrives
async function trackVisit() {
    const sessionId = getSessionId();
    const source = getTrafficSource();
    const device = getDeviceType();
    const browser = getBrowserName();
    const location = await getLocation();
    
    fetch(`${API_BASE_URL}/track?sessionId=${sessionId}&source=${source}&location=${location}&device=${device}&browser=${browser}`);
}

// Track when visitor leaves
function trackLeave() {
    const sessionId = getSessionId();
    fetch(`${API_BASE_URL}/leave?sessionId=${sessionId}`);
}

// Run tracking
trackVisit();

// Track leave when closing page/tab
window.addEventListener('beforeunload', trackLeave);