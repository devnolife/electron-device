// Dashboard page logic
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      window.location.href = './login.html';
      return;
    }

    // Initialize dashboard
    await initializeDashboard();

    console.log('Dashboard initialized successfully');
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    // Redirect to login on error
    window.location.href = './login.html';
  }
});

/**
 * Initialize dashboard components
 */
async function initializeDashboard() {
  try {
    // Validate secure device first
    const deviceValidation = await validateSecureDevice();
    if (!deviceValidation.isValid) {
      console.warn('Device validation failed on dashboard:', deviceValidation.reason);
      showDeviceWarning(deviceValidation.reason);
    }

    // Display user information
    await displayUserInfo();

    // Display secure device information
    await displaySecureDeviceInfo();

    // Setup logout button
    setupLogoutButton();

    // Setup periodic token validation
    setupTokenValidation();

  } catch (error) {
    console.error('Error in dashboard initialization:', error);
    throw error;
  }
}

/**
 * Display user information
 */
async function displayUserInfo() {
  const userInfoElement = document.getElementById('userInfo');

  if (!userInfoElement) return;

  try {
    const userData = getUserData();

    if (userData) {
      userInfoElement.textContent = `Welcome, ${userData.username || userData.name || 'User'}!`;
    } else {
      // Try to fetch user data from API
      const profile = await getUserProfile();
      updateUserData(profile);
      userInfoElement.textContent = `Welcome, ${profile.username || profile.name || 'User'}!`;
    }
  } catch (error) {
    console.error('Error displaying user info:', error);
    userInfoElement.textContent = 'Welcome, User!';
  }
}

/**
 * Display secure device information
 */
async function displaySecureDeviceInfo() {
  try {
    const deviceInfo = await getDeviceInfo();

    // Display device ID
    const deviceIdElement = document.getElementById('deviceId');
    if (deviceIdElement) {
      deviceIdElement.textContent = deviceInfo.deviceIdTruncated || 'Unknown';
    }

    // Display device details
    const deviceDetailsElement = document.getElementById('deviceDetails');
    if (deviceDetailsElement) {
      const statusColor = deviceInfo.integrityValid ? 'text-success' : 'text-warning';
      const statusText = deviceInfo.integrityValid ? 'Valid' : 'Warning';

      deviceDetailsElement.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Platform:</strong> ${deviceInfo.platform || 'Unknown'}</p>
                        <p><strong>Architecture:</strong> ${deviceInfo.arch || 'Unknown'}</p>
                        <p><strong>Hostname:</strong> ${deviceInfo.hostname || 'Unknown'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Status:</strong> <span class="${statusColor}">${statusText}</span></p>
                        <p><strong>Bound:</strong> ${deviceInfo.bindTime ? new Date(deviceInfo.bindTime).toLocaleDateString() : 'Unknown'}</p>
                        <p><strong>Last Check:</strong> ${new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
                ${!deviceInfo.integrityValid ? `<div class="alert alert-warning mt-2"><small>Device integrity warning: ${deviceInfo.integrityReason || 'Unknown issue'}</small></div>` : ''}
            `;
    }

  } catch (error) {
    console.error('Error displaying secure device info:', error);

    const deviceIdElement = document.getElementById('deviceId');
    if (deviceIdElement) {
      deviceIdElement.textContent = 'Error loading device info';
    }
  }
}

/**
 * Show device warning when validation fails
 */
function showDeviceWarning(reason) {
  const warningContainer = document.getElementById('deviceWarning') || createDeviceWarningContainer();

  if (warningContainer) {
    warningContainer.innerHTML = `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <strong>Device Security Warning:</strong> ${reason}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    warningContainer.style.display = 'block';
  }
}

/**
 * Create device warning container if it doesn't exist
 */
function createDeviceWarningContainer() {
  const container = document.createElement('div');
  container.id = 'deviceWarning';
  container.className = 'container mt-3';

  const mainContent = document.querySelector('.container');
  if (mainContent) {
    mainContent.parentNode.insertBefore(container, mainContent);
  }

  return container;
}

/**
 * Setup logout button functionality
 */
function setupLogoutButton() {
  const logoutButton = document.getElementById('logoutButton');

  if (!logoutButton) return;

  logoutButton.addEventListener('click', async (e) => {
    e.preventDefault();

    try {
      // Show loading state
      logoutButton.disabled = true;
      logoutButton.textContent = 'Logging out...';

      // Perform logout
      await performLogout();

    } catch (error) {
      console.error('Logout error:', error);

      // Still clear local data and redirect
      clearAuthData();
      window.location.href = './login.html';
    }
  });
}

/**
 * Perform logout process
 */
async function performLogout() {
  try {
    // Call logout API
    await logout();

    // Clear local authentication data
    clearAuthData();

    // Redirect to login page
    window.location.href = './login.html';

  } catch (error) {
    console.error('Error during logout:', error);

    // Still clear local data and redirect on error
    clearAuthData();
    window.location.href = './login.html';
  }
}

/**
 * Setup periodic token validation
 */
function setupTokenValidation() {
  // Check token validity every 5 minutes
  setInterval(async () => {
    try {
      const isValid = await verifyToken();

      if (!isValid) {
        console.log('Token validation failed, redirecting to login');
        clearAuthData();
        window.location.href = './login.html';
      }
    } catch (error) {
      console.error('Token validation error:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Handle page visibility change
 */
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    try {
      // Verify token when page becomes visible
      const isValid = await verifyToken();
      if (!isValid) {
        clearAuthData();
        window.location.href = './login.html';
      }
    } catch (error) {
      console.error('Error verifying token on visibility change:', error);
    }
  }
});

/**
 * Handle beforeunload event for cleanup
 */
window.addEventListener('beforeunload', () => {
  // Cleanup if not using remember me
  if (!isRememberMeEnabled()) {
    // Session storage will be cleared automatically
    console.log('Session cleanup on page unload');
  }
});

/**
 * Add keyboard shortcuts for dashboard
 */
document.addEventListener('keydown', (e) => {
  // Ctrl+L or Cmd+L for logout
  if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
    e.preventDefault();
    document.getElementById('logoutButton').click();
  }

  // Escape key to focus logout button
  if (e.key === 'Escape') {
    document.getElementById('logoutButton').focus();
  }
});

/**
 * Initialize dashboard styles
 */
function initializeDashboardStyles() {
  // Add any dynamic styling here
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.style.animation = 'fadeIn 0.5s ease-out';
  }

  const welcomeCard = document.querySelector('.welcome-card');
  if (welcomeCard) {
    welcomeCard.style.animation = 'fadeIn 0.5s ease-out 0.2s both';
  }
}

// Call style initialization
initializeDashboardStyles();

/**
 * Debug function for dashboard
 */
function debugDashboard() {
  console.log('Dashboard Debug Info:');
  console.log('Authentication Status:', isAuthenticated());
  console.log('User Data:', getUserData());
  console.log('Storage Info:', getStorageInfo());
  getDeviceInfo().then(info => console.log('Device Info:', info));
}

// Make debug function available globally
window.debugDashboard = debugDashboard;
