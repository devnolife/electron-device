// Main authentication logic for login page
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Validate secure device before proceeding
    const deviceValidation = await validateSecureDevice();
    if (!deviceValidation.isValid) {
      showError(`Device security check failed: ${deviceValidation.reason}`);
      if (deviceValidation.reason.includes('binding')) {
        showDeviceResetOption();
      }
      return;
    }

    console.log('Secure device validation passed');

    // Check if already logged in
    if (isAuthenticated()) {
      window.location.href = './dashboard.html';
      return;
    }

    // Initialize login form
    initializeLoginForm();

    console.log('Login page initialized successfully');
  } catch (error) {
    console.error('Error initializing login page:', error);
    showError('Error initializing application. Please restart the application.');
  }
});

/**
 * Initialize login form event listeners
 */
function initializeLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const togglePasswordBtn = document.getElementById('togglePassword');

  // Handle form submission
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Handle password toggle
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
  }

  // Handle form input changes
  const inputs = loginForm.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', clearError);
  });
}

/**
 * Handle login form submission
 * @param {Event} e - Form submission event
 */
async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('rememberMe').checked;

  // Validate inputs
  if (!validateInputs(username, password)) {
    return;
  }

  try {
    // Show loading state
    setLoadingState(true);
    clearError();

    // Validate secure device before authentication
    const deviceValidation = await validateSecureDevice();
    if (!deviceValidation.isValid) {
      throw new Error(`Device security check failed: ${deviceValidation.reason}`);
    }

    // Get secure device hash for authentication
    const deviceHash = await getSecureDeviceHash(username);
    if (!deviceHash) {
      throw new Error('Unable to generate secure device authentication.');
    }

    // Attempt login
    const response = await loginWithDeviceHash(username, password, deviceHash);

    // Save authentication data
    saveAuthData(response.token, response.user, rememberMe);

    // Show success message briefly
    showSuccess('Login successful! Redirecting...');

    // Redirect to dashboard after short delay
    setTimeout(() => {
      window.location.href = './dashboard.html';
    }, 1000);

  } catch (error) {
    console.error('Login error:', error);
    handleLoginError(error);
  } finally {
    setLoadingState(false);
  }
}

/**
 * Login with device hash
 * @param {string} username - Username
 * @param {string} password - Password  
 * @param {string} deviceHash - Device hash
 * @returns {Promise<Object>} - Login response
 */
async function loginWithDeviceHash(username, password, deviceHash) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        deviceHash
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
 * Validate login inputs
 * @param {string} username - Username input
 * @param {string} password - Password input
 * @returns {boolean} - True if valid
 */
function validateInputs(username, password) {
  if (!username) {
    showError('Please enter your username.');
    document.getElementById('username').focus();
    return false;
  }

  if (!password) {
    showError('Please enter your password.');
    document.getElementById('password').focus();
    return false;
  }

  if (username.length < 3) {
    showError('Username must be at least 3 characters long.');
    document.getElementById('username').focus();
    return false;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters long.');
    document.getElementById('password').focus();
    return false;
  }

  return true;
}

/**
 * Handle login errors
 * @param {Error} error - Login error
 */
function handleLoginError(error) {
  let errorMessage = 'Login failed. Please try again.';

  if (error.message) {
    const message = error.message.toLowerCase();

    if (message.includes('invalid credentials') || message.includes('unauthorized')) {
      errorMessage = 'Invalid username or password. Please try again.';
    } else if (message.includes('device') && message.includes('active')) {
      errorMessage = 'This account is already active on another device. Please logout from the other device first or use force logout.';
      showDeviceConflictOptions();
    } else if (message.includes('device') && message.includes('registered')) {
      errorMessage = 'This device is already registered to another account.';
    } else if (message.includes('device authentication')) {
      errorMessage = 'Device authentication failed. Please restart the application.';
    } else if (message.includes('account is deactivated')) {
      errorMessage = 'Your account has been deactivated. Please contact support.';
    } else if (message.includes('network') || message.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (message.includes('server') || message.includes('500')) {
      errorMessage = 'Server error. Please try again later.';
    } else {
      errorMessage = error.message;
    }
  }

  showError(errorMessage);

  // Clear password field on error
  document.getElementById('password').value = '';
}

/**
 * Show device conflict resolution options
 */
function showDeviceConflictOptions() {
  // Create modal or additional UI for device conflict resolution
  const conflictDiv = document.createElement('div');
  conflictDiv.className = 'device-conflict-options';
  conflictDiv.innerHTML = `
        <div class="conflict-message">
            <p>Your account is active on another device.</p>
            <button id="forceLogoutBtn" class="force-logout-btn">
                Force Logout from Other Devices
            </button>
            <button id="cancelBtn" class="cancel-btn">Cancel</button>
        </div>
    `;

  // Insert after error message
  const errorElement = document.getElementById('errorMessage');
  if (errorElement && errorElement.parentNode) {
    errorElement.parentNode.insertBefore(conflictDiv, errorElement.nextSibling);
  }

  // Handle force logout
  document.getElementById('forceLogoutBtn').addEventListener('click', async () => {
    try {
      setLoadingState(true);

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const deviceHash = await getDeviceHashForAuth(username);

      // First login to get token, then force logout from other devices
      const response = await loginWithDeviceHash(username, password, deviceHash);

      // Now logout from other devices
      await logoutFromOtherDevices(response.token, deviceHash);

      // Save auth data and redirect
      saveAuthData(response.token, response.user, document.getElementById('rememberMe').checked);
      showSuccess('Successfully logged out from other devices. Redirecting...');

      setTimeout(() => {
        window.location.href = './dashboard.html';
      }, 1000);

    } catch (error) {
      console.error('Force logout error:', error);
      showError('Failed to logout from other devices. Please try again.');
    } finally {
      setLoadingState(false);
      conflictDiv.remove();
    }
  });

  // Handle cancel
  document.getElementById('cancelBtn').addEventListener('click', () => {
    conflictDiv.remove();
  });
}

/**
 * Logout from other devices
 * @param {string} token - Auth token
 * @param {string} deviceHash - Current device hash
 */
async function logoutFromOtherDevices(token, deviceHash) {
  const response = await fetch(`${API_BASE_URL}/auth/logout-other-devices`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceHash })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to logout from other devices');
  }

  return response.json();
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('togglePassword');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.textContent = 'Hide';
  } else {
    passwordInput.type = 'password';
    toggleBtn.textContent = 'Show';
  }
}

/**
 * Set loading state for login button
 * @param {boolean} isLoading - Loading state
 */
function setLoadingState(isLoading) {
  const loginButton = document.getElementById('loginButton');
  const buttonText = loginButton.querySelector('.button-text');
  const loadingSpinner = loginButton.querySelector('.loading-spinner');

  if (isLoading) {
    loginButton.disabled = true;
    loginButton.classList.add('loading');
    buttonText.style.display = 'none';
    loadingSpinner.style.display = 'inline-block';
  } else {
    loginButton.disabled = false;
    loginButton.classList.remove('loading');
    buttonText.style.display = 'inline';
    loadingSpinner.style.display = 'none';
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
    errorElement.style.display = 'block';

    // Auto-hide after 10 seconds for device-related errors
    setTimeout(() => {
      clearError();
    }, 10000);
  }
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  const errorElement = document.getElementById('errorMessage');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.color = '#27ae60';
    errorElement.style.backgroundColor = '#d5f4e6';
    errorElement.style.borderColor = '#27ae60';
    errorElement.classList.add('show');
    errorElement.style.display = 'block';
  }
}

/**
 * Clear error message
 */
function clearError() {
  const errorElement = document.getElementById('errorMessage');
  if (errorElement) {
    errorElement.classList.remove('show');
    errorElement.style.display = 'none';
    errorElement.textContent = '';

    // Reset error styling
    errorElement.style.color = '#e74c3c';
    errorElement.style.backgroundColor = '#fdf2f2';
    errorElement.style.borderColor = '#f5c6cb';
  }

  // Remove any device conflict options
  const conflictDiv = document.querySelector('.device-conflict-options');
  if (conflictDiv) {
    conflictDiv.remove();
  }
}

/**
 * Handle keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
  // Handle Enter key on login form
  if (e.key === 'Enter') {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.form && activeElement.form.id === 'loginForm') {
      e.preventDefault();
      handleLogin(e);
    }
  }

  // Handle Escape key to clear errors
  if (e.key === 'Escape') {
    clearError();
  }
});

/**
 * Auto-focus username field on page load
 */
window.addEventListener('load', () => {
  const usernameInput = document.getElementById('username');
  if (usernameInput) {
    usernameInput.focus();
  }
});

/**
 * Handle page visibility change (for token refresh)
 */
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden && isAuthenticated()) {
    try {
      // Verify token is still valid when page becomes visible
      const isValid = await verifyToken();
      if (!isValid) {
        clearAuthData();
        window.location.reload();
      }
    } catch (error) {
      console.error('Error verifying token:', error);
    }
  }
});

/**
 * Show device reset option when device binding fails
 */
function showDeviceResetOption() {
  const errorContainer = document.querySelector('.error-message');
  if (errorContainer) {
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Device Binding';
    resetButton.className = 'btn btn-secondary btn-sm mt-2';
    resetButton.onclick = handleDeviceReset;

    const resetInfo = document.createElement('p');
    resetInfo.className = 'text-muted small mt-2';
    resetInfo.textContent = 'This will reset device binding and allow you to re-authenticate this device.';

    errorContainer.appendChild(resetButton);
    errorContainer.appendChild(resetInfo);
  }
}

/**
 * Handle device reset action
 */
async function handleDeviceReset() {
  try {
    const confirmed = confirm('Are you sure you want to reset device binding? This will require re-authentication.');
    if (!confirmed) return;

    showInfo('Resetting device binding...');

    const result = await resetDeviceBinding();
    if (result) {
      showSuccess('Device binding reset successfully. Please restart the application.');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      showError('Failed to reset device binding. Please restart the application manually.');
    }
  } catch (error) {
    console.error('Error resetting device binding:', error);
    showError('Error resetting device binding. Please restart the application.');
  }
}

/**
 * Debug function to check authentication state
 */
function debugAuth() {
  console.log('Authentication Debug Info:');
  console.log('Is Authenticated:', isAuthenticated());
  console.log('Token:', getToken() ? 'Present' : 'None');
  console.log('User Data:', getUserData());
  console.log('Storage Info:', getStorageInfo());
  getDeviceInfo().then(info => console.log('Device Info:', info));
}

// Make debug function available globally
window.debugAuth = debugAuth;
