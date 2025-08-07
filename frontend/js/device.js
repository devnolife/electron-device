// Secure Device handling module for Electron
const { ipcRenderer } = require('electron');

let deviceCredentials = null;

/**
 * Initialize device credentials using secure device binding
 * @returns {Promise<Object>} - Device credentials
 */
async function initializeDeviceCredentials() {
  try {
    if (deviceCredentials) {
      return deviceCredentials;
    }

    // Get secure device credentials from main process
    deviceCredentials = await ipcRenderer.invoke('get-device-credentials');

    if (!deviceCredentials || !deviceCredentials.deviceId) {
      throw new Error('Failed to get secure device credentials from main process');
    }

    console.log('Secure device credentials initialized:', {
      deviceId: deviceCredentials.deviceId,
      platform: deviceCredentials.platform,
      bindTime: deviceCredentials.bindTime
    });
    return deviceCredentials;
  } catch (error) {
    console.error('Error initializing secure device credentials:', error);
    throw new Error('Secure device authentication failed');
  }
}

/**
 * Generate secure device hash for server authentication
 * @param {string} additionalData - Additional data to include in hash
 * @returns {Promise<string>} - Secure device hash
 */
async function generateSecureDeviceHash(additionalData = '') {
  try {
    await initializeDeviceCredentials();

    // Use main process to generate secure hash with hardware binding
    const deviceHash = await ipcRenderer.invoke('generate-device-hash', additionalData);

    if (!deviceHash) {
      throw new Error('Failed to generate secure device hash');
    }

    return deviceHash;
  } catch (error) {
    console.error('Error generating secure device hash:', error);
    throw new Error('Secure device authentication failed');
  }
}

/**
 * Get device ID (for display purposes only)
 * @returns {Promise<string>} - Device ID
 */
async function getDeviceId() {
  try {
    const credentials = await initializeDeviceCredentials();
    return credentials.deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    throw error;
  }
}

/**
 * Validate secure device binding integrity
 * @returns {Promise<Object>} - Validation result with details
 */
async function validateSecureDeviceIntegrity() {
  try {
    const result = await ipcRenderer.invoke('validate-device-integrity');

    if (!result.isValid) {
      console.warn('Secure device integrity validation failed:', result.reason);
      if (result.details) {
        console.warn('Hardware fingerprint mismatch:', result.details);
      }
    } else {
      console.log('Secure device integrity validation passed');
    }

    return result;
  } catch (error) {
    console.error('Error validating secure device integrity:', error);
    return {
      isValid: false,
      reason: 'Validation error',
      error: error.message
    };
  }
}

/**
 * Reset device binding (for development/debugging only)
 * @returns {Promise<boolean>} - Success status
 */
async function resetDeviceBinding() {
  try {
    const result = await ipcRenderer.invoke('reset-device-binding');

    if (result.success) {
      // Clear cached credentials to force reload
      deviceCredentials = null;
      console.log('Device binding reset successfully');
    } else {
      console.error('Failed to reset device binding:', result.error);
    }

    return result.success;
  } catch (error) {
    console.error('Error resetting device binding:', error);
    return false;
  }
}

/**
 * Display device ID in UI element (truncated for security)
 * @param {string} elementId - Element ID to display device ID
 */
async function displayDeviceId(elementId) {
  try {
    const deviceId = await getDeviceId();
    const element = document.getElementById(elementId);

    if (element) {
      // Display truncated device ID for UI
      const truncatedId = deviceId.length > 16 ?
        deviceId.substring(0, 8) + '...' + deviceId.substring(deviceId.length - 8) :
        deviceId;

      element.textContent = truncatedId;
      element.title = 'Device ID (click to copy)';

      // Add click to copy functionality (copy truncated version only)
      element.style.cursor = 'pointer';
      element.addEventListener('click', () => {
        navigator.clipboard.writeText(truncatedId).then(() => {
          element.textContent = 'Copied!';
          setTimeout(() => {
            element.textContent = truncatedId;
          }, 1000);
        }).catch(err => {
          console.error('Failed to copy device ID:', err);
        });
      });
    }
  } catch (error) {
    console.error('Error displaying device ID:', error);
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = 'Error loading device ID';
    }
  }
}

/**
 * Get device information for debugging (limited info for security)
 * @returns {Promise<Object>} - Device information
 */
async function getDeviceInfo() {
  try {
    const credentials = await initializeDeviceCredentials();
    const integrity = await validateSecureDeviceIntegrity();

    return {
      deviceIdTruncated: credentials.deviceId.length > 16 ?
        credentials.deviceId.substring(0, 8) + '...' + credentials.deviceId.substring(credentials.deviceId.length - 8) :
        credentials.deviceId,
      platform: credentials.platform,
      arch: credentials.arch,
      hostname: credentials.hostname,
      bindTime: credentials.bindTime,
      integrityValid: integrity.isValid,
      integrityReason: integrity.reason,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Initialize secure device system
 */
async function initializeSecureDevice() {
  try {
    await initializeDeviceCredentials();

    // Validate device integrity
    const validation = await validateSecureDeviceIntegrity();
    if (!validation.isValid) {
      console.warn('Secure device integrity check failed:', validation.reason);
      // Don't throw error for some cases, just log warning
      if (validation.reason.includes('expired')) {
        console.warn('Device binding expired - may need re-authentication');
      }
    }

    console.log('Secure device system initialized successfully');

    // Display in UI if element exists
    const deviceElement = document.getElementById('deviceId');
    if (deviceElement) {
      await displayDeviceId('deviceId');
    }

    return validation;
  } catch (error) {
    console.error('Error initializing secure device system:', error);
    throw error;
  }
}

/**
 * Get secure device hash for authentication
 * @param {string} username - Username for additional entropy
 * @returns {Promise<string>} - Secure device hash
 */
async function getSecureDeviceHash(username = '') {
  try {
    // Generate hash with username as additional data for unique session binding
    const deviceHash = await generateSecureDeviceHash(username);
    return deviceHash;
  } catch (error) {
    console.error('Error getting secure device hash for auth:', error);
    throw error;
  }
}

/**
 * Validate secure device state before authentication
 * @returns {Promise<Object>} - Validation result
 */
async function validateSecureDevice() {
  try {
    // Check if credentials are available
    await initializeDeviceCredentials();

    // Validate integrity
    const validation = await validateSecureDeviceIntegrity();

    return validation;
  } catch (error) {
    console.error('Secure device validation failed:', error);
    return {
      isValid: false,
      reason: 'Device validation error',
      error: error.message
    };
  }
}

// Legacy function names for backward compatibility
async function initializeDeviceId() {
  return await initializeSecureDevice();
}

async function getDeviceHashForAuth(username) {
  return await getSecureDeviceHash(username);
}

async function validateDeviceForAuth() {
  const validation = await validateSecureDevice();
  return validation.isValid;
}

async function validateDeviceIntegrity() {
  const validation = await validateSecureDeviceIntegrity();
  return validation.isValid;
}

async function generateDeviceHash(additionalData) {
  return await generateSecureDeviceHash(additionalData);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeDeviceCredentials,
    generateSecureDeviceHash,
    getDeviceId,
    validateSecureDeviceIntegrity,
    resetDeviceBinding,
    displayDeviceId,
    getDeviceInfo,
    initializeSecureDevice,
    getSecureDeviceHash,
    validateSecureDevice,
    // Legacy compatibility
    initializeDeviceId,
    getDeviceHashForAuth,
    validateDeviceForAuth,
    validateDeviceIntegrity,
    generateDeviceHash
  };
}


