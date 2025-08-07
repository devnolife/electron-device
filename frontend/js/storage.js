// Storage management module for authentication data
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const DEVICE_KEY = 'device_id';
const REMEMBER_KEY = 'remember_me';

/**
 * Save authentication data to storage
 * @param {string} token - JWT token
 * @param {Object} user - User information
 * @param {boolean} remember - Whether to persist data
 */
function saveAuthData(token, user, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    
    try {
        storage.setItem(TOKEN_KEY, token);
        storage.setItem(USER_KEY, JSON.stringify(user));
        storage.setItem(REMEMBER_KEY, remember.toString());
        
        // Also save to localStorage if remember is true
        if (remember) {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            localStorage.setItem(REMEMBER_KEY, 'true');
        }
        
        console.log('Authentication data saved successfully');
    } catch (error) {
        console.error('Error saving authentication data:', error);
    }
}

/**
 * Get authentication token
 * @returns {string|null} - JWT token or null
 */
function getToken() {
    try {
        // Check localStorage first (for remember me)
        const localToken = localStorage.getItem(TOKEN_KEY);
        if (localToken) return localToken;
        
        // Check sessionStorage
        const sessionToken = sessionStorage.getItem(TOKEN_KEY);
        if (sessionToken) return sessionToken;
        
        return null;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
}

/**
 * Get user data from storage
 * @returns {Object|null} - User data or null
 */
function getUserData() {
    try {
        // Check localStorage first
        const localUser = localStorage.getItem(USER_KEY);
        if (localUser) {
            return JSON.parse(localUser);
        }
        
        // Check sessionStorage
        const sessionUser = sessionStorage.getItem(USER_KEY);
        if (sessionUser) {
            return JSON.parse(sessionUser);
        }
        
        return null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if authenticated
 */
function isAuthenticated() {
    const token = getToken();
    if (!token) return false;
    
    try {
        // Basic token validation (check if it's not expired)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp < currentTime) {
            // Token expired, clear it
            clearAuthData();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error validating token:', error);
        clearAuthData();
        return false;
    }
}

/**
 * Clear all authentication data
 */
function clearAuthData() {
    try {
        // Clear from localStorage
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(REMEMBER_KEY);
        
        // Clear from sessionStorage
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(REMEMBER_KEY);
        
        console.log('Authentication data cleared');
    } catch (error) {
        console.error('Error clearing authentication data:', error);
    }
}

/**
 * Update user data in storage
 * @param {Object} userData - New user data
 */
function updateUserData(userData) {
    try {
        const remember = localStorage.getItem(REMEMBER_KEY) === 'true';
        const storage = remember ? localStorage : sessionStorage;
        
        storage.setItem(USER_KEY, JSON.stringify(userData));
        
        if (remember) {
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
        }
        
        console.log('User data updated successfully');
    } catch (error) {
        console.error('Error updating user data:', error);
    }
}

/**
 * Save device ID to storage
 * @param {string} deviceId - Device ID
 */
function saveDeviceId(deviceId) {
    try {
        localStorage.setItem(DEVICE_KEY, deviceId);
        console.log('Device ID saved successfully');
    } catch (error) {
        console.error('Error saving device ID:', error);
    }
}

/**
 * Get device ID from storage
 * @returns {string|null} - Device ID or null
 */
function getStoredDeviceId() {
    try {
        return localStorage.getItem(DEVICE_KEY);
    } catch (error) {
        console.error('Error getting device ID:', error);
        return null;
    }
}

/**
 * Check if remember me is enabled
 * @returns {boolean} - True if remember me is enabled
 */
function isRememberMeEnabled() {
    try {
        return localStorage.getItem(REMEMBER_KEY) === 'true';
    } catch (error) {
        console.error('Error checking remember me status:', error);
        return false;
    }
}

/**
 * Update token in storage (for token refresh)
 * @param {string} newToken - New JWT token
 */
function updateToken(newToken) {
    try {
        const remember = isRememberMeEnabled();
        const storage = remember ? localStorage : sessionStorage;
        
        storage.setItem(TOKEN_KEY, newToken);
        
        if (remember) {
            localStorage.setItem(TOKEN_KEY, newToken);
        }
        
        console.log('Token updated successfully');
    } catch (error) {
        console.error('Error updating token:', error);
    }
}

/**
 * Get storage info for debugging
 * @returns {Object} - Storage information
 */
function getStorageInfo() {
    return {
        hasToken: !!getToken(),
        hasUser: !!getUserData(),
        rememberMe: isRememberMeEnabled(),
        deviceId: getStoredDeviceId(),
        storageType: isRememberMeEnabled() ? 'localStorage' : 'sessionStorage'
    };
}
