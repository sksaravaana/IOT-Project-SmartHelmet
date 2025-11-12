/**
 * API Helper Functions
 * This module provides functions to interact with the backend API
 */

// API object to hold all API methods
/**
 * Handles API responses and authentication errors
 */
async function handleResponse(response) {
    // First, check if the response is HTML (starts with <!doctype or <html)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
        // If we got HTML instead of JSON, the server might be down or misconfigured
        let errorMessage = 'Server returned an HTML page. The server might be down or misconfigured.';
        
        // Try to get the status text
        if (response.statusText) {
            errorMessage += ` Status: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
    }
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login if not already there
        if (!window.location.pathname.endsWith('login.html') && 
            !window.location.pathname.endsWith('index.html')) {
            window.location.href = 'login.html';
        }
        
        throw new Error('Your session has expired. Please log in again.');
    }
    
    // Try to parse JSON, but handle potential parsing errors
    let data;
    try {
        data = await response.json();
    } catch (error) {
        console.error('Failed to parse JSON response:', error);
        throw new Error('Received an invalid response from the server. Please try again later.');
    }
    
    // Handle other error statuses
    if (!response.ok) {
        throw new Error(data.message || `Server returned status ${response.status}`);
    }
    
    return data;
}

const API = {
    // Authentication APIs
    async login(username, password) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await handleResponse(response);
            return { ok: true, ...data };
        } catch (error) {
            console.error('Login error:', error);
            return { 
                ok: false, 
                error: 'login_failed',
                message: error.message || 'Failed to log in. Please try again.'
            };
        }
    },

    async register(username, password) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await handleResponse(response);
            return { ok: true, ...data };
        } catch (error) {
            console.error('Registration error:', error);
            return { 
                ok: false, 
                error: 'registration_failed',
                message: error.message || 'Failed to register. Please try again.'
            };
        }
    },

    // Analytics APIs
    async getDashboardStats(bikeId) {
        try {
            const url = `${CONFIG.API_URL}/api/analytics/dashboard?bikeId=${bikeId || CONFIG.BIKE_ID}`;
            const response = await fetch(url, {
                headers: getAuthHeaders()
            });

            const data = await handleResponse(response);
            return data;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return {
                ok: false,
                error: 'fetch_error',
                message: 'Failed to load dashboard data. Using sample data instead.',
                // Return sample data for demo purposes
                stats: {
                    totalRides: 24,
                    successfulRides: 20,
                    helmetViolations: 3,
                    alcoholDetections: 1
                }
            };
        }
    },

    async getFleetOverview() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/analytics/fleet`, {
                headers: getAuthHeaders()
            });

            const data = await handleResponse(response);
            return data;
        } catch (error) {
            console.error('Error fetching fleet overview:', error);
            return {
                ok: false,
                error: 'fetch_error',
                message: 'Failed to load fleet data',
                fleet: []
            };
        }
    },

    // Bike APIs
    async getBikes() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/bikes`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch bikes');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching bikes:', error);
            return {
                ok: false,
                error: 'fetch_error',
                message: 'Failed to load bikes',
                bikes: []
            };
        }
    },

    async createBike(bikeData) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/bikes`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(bikeData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create bike');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating bike:', error);
            return {
                ok: false,
                error: 'create_failed',
                message: error.message || 'Failed to create bike'
            };
        }
    },

    // User APIs
    async getUsers() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/users`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
            return {
                ok: false,
                error: 'fetch_error',
                message: 'Failed to load users',
                users: []
            };
        }
    },

    // Admin APIs
    async setIgnition(bikeId, block) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/admin/bike/${bikeId}/ignition`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ block })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update ignition status');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating ignition status:', error);
            return {
                ok: false,
                error: 'update_failed',
                message: error.message || 'Failed to update ignition status'
            };
        }
    },

    async pairHelmet(bikeId, helmetId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/admin/pair`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ bikeId, helmetId })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to pair helmet');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error pairing helmet:', error);
            return {
                ok: false,
                error: 'pair_failed',
                message: error.message || 'Failed to pair helmet'
            };
        }
    },

    // Alerts APIs
    async getAlerts(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${CONFIG.API_URL}/api/alerts?${queryString}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch alerts');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching alerts:', error);
            return {
                ok: false,
                error: 'fetch_error',
                message: 'Failed to load alerts',
                alerts: []
            };
        }
    }
};
