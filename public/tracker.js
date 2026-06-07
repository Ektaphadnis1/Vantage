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

// Get location from IP with fallback
async function getLocation() {
    // Try multiple APIs for better accuracy
    const apis = [
        'https://ipapi.co/json/',
        'https://ipwho.is/',
        'https://freeipapi.com/api/json/'
    ];
    
    for (const api of apis) {
        try {
            const response = await fetch(api);
            const data = await response.json();
            
            let city = data.city || 'Unknown';
            let region = data.region || data.state || '';
            let country = data.country_name || data.country || 'India';
            
            // Clean up city names
            if (city === 'Unknown' && region && region !== 'Unknown') {
                city = region;
            }
            
            if (city !== 'Unknown') {
                return `${city}, ${country}`;
            }
        } catch (error) {
            console.log(`Location API failed: ${api}`);
        }
    }
    
    // Fallback: Try to get from browser's timezone
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone) {
            const city = timezone.split('/').pop().replace('_', ' ');
            return `${city}, India (approx)`;
        }
    } catch (e) {}
    
    return 'Pune, India'; // Default fallback for testing
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
        // Tab visible again - send heartbeat to confirm still active
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