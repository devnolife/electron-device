// API communication module
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Login function to authenticate user
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @param {string} deviceId - Device ID for restriction
 * @returns {Promise<Object>} - Login response with token and user info
 */
async function login(username, password, deviceId) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
                deviceId
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Login failed');
        }
        
        return data;
    } catch (error) {
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to server. Please check your connection.');
        }
        throw error;
    }
}

/**
 * Logout function to invalidate session
 * @returns {Promise<void>}
 */
async function logout() {
    const token = getToken();
    if (!token) return;
    
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        console.error('Logout request failed:', error);
        // Continue with local logout even if server request fails
    }
}

/**
 * Verify token validity
 * @returns {Promise<boolean>} - True if token is valid
 */
async function verifyToken() {
    const token = getToken();
    if (!token) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Token verification failed:', error);
        return false;
    }
}

/**
 * Refresh authentication token
 * @returns {Promise<string>} - New token
 */
async function refreshToken() {
    const token = getToken();
    if (!token) throw new Error('No token available');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Token refresh failed');
        }
        
        return data.token;
    } catch (error) {
        throw error;
    }
}

/**
 * Get user profile data
 * @returns {Promise<Object>} - User profile data
 */
async function getUserProfile() {
    const token = getToken();
    if (!token) throw new Error('No authentication token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch user profile');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Generic API request function with authentication
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - API response
 */
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
        const data = await response.json();
        
        if (!response.ok) {
            // Handle token expiration
            if (response.status === 401) {
                clearAuthData();
                window.location.href = './login.html';
                return;
            }
            throw new Error(data.error || data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Register function to create new user account
 * @param {Object} userData - User registration data
 * @param {string} userData.username - User's username
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @param {string} userData.deviceId - Device ID for restriction
 * @returns {Promise<Object>} - Registration response with token and user info
 */
async function register(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Registration failed');
        }
        
        return data;
    } catch (error) {
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to server. Please check your connection.');
        }
        throw error;
    }
}

/**
 * Check username availability
 * @param {string} username - Username to check
 * @returns {Promise<Object>} - Availability status
 */
async function checkUsernameAvailability(username) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/check-username`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to check username availability');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Check email availability
 * @param {string} email - Email to check
 * @returns {Promise<Object>} - Availability status
 */
async function checkEmailAvailability(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to check email availability');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}
