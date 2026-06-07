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
// Change this to your actual city for testing
const MANUAL_LOCATION = "Pune, Maharashtra, India";

// Get location from IP with better accuracy
async function getLocation() {
    // MANUAL OVERRIDE FOR TESTING
    // Remove this line when deploying to production
    return MANUAL_LOCATION;
    
    /* 
    // UNCOMMENT THIS FOR PRODUCTION WITH REAL IP DETECTION
    const apis = [
        'https://ipapi.co/json/',
        'https://ipwho.is/',
        'https://freeipapi.com/api/json/'
    ];
    
    for (const api of apis) {
        try {
            const response = await fetch(api);
            const data = await response.json();
            
            let city = data.city || '';
            let region = data.region || data.state || '';
            let country = data.country_name || data.country || '';
            
            if (city && city !== 'Unknown' && city !== '') {
                // Clean up city names
                city = city.replace(' district', '').trim();
                return `${city}, ${region}, ${country}`;
            }
        } catch (error) {
            console.log(`Location API failed: ${api}`);
        }
    }
    
    return "Location detection failed";
    */
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
    
    console.log(`Tracking: ${sessionId} - ${location} - ${device} - ${source}`);
    
    await fetch(`${API_BASE_URL}/track?sessionId=${sessionId}&source=${source}&location=${encodeURIComponent(location)}&device=${device}&browser=${browser}`);
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

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        const sessionId = getSessionId();
        fetch(`${API_BASE_URL}/heartbeat?sessionId=${sessionId}`);
    }
});

// Handle page unload
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