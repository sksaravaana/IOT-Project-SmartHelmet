// Configuration
const CONFIG = {
    API_URL: window.location.origin || 'http://localhost:5001',
    BIKE_ID: 'BIKE123' // Default bike ID
};

// Store user data
let currentUser = null;
let currentToken = null;

// Initialize from localStorage
function initializeAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentToken = token;
        currentUser = JSON.parse(user);
        return true;
    }
    return false;
}

// Save auth data
function saveAuth(token, user) {
    currentToken = token;
    currentUser = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

// Clear auth data
function clearAuth() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Get auth headers
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    return headers;
}
