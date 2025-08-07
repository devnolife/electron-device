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
    dashboardComponents.setupDeviceCopy();

    // Populate security status
    const authSince = document.getElementById('authSinceText');
    if (authSince) authSince.textContent = new Date().toLocaleTimeString();

    // Record initial activity
    dashboardComponents.addActivity('Login successful');

    // Setup logout button
    setupLogoutButton();

    // Setup periodic token validation
    setupTokenValidation();

    // Quick action listeners
    const refreshBtn = document.getElementById('refreshSession');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await verifyToken();
        dashboardComponents.addActivity('Session refreshed');
      });
    }

  } catch (error) {
    console.error('Error in dashboard initialization:', error);
    throw error;
  }
}

/**
 * Display user information
 */
async function displayUserInfo() {
  const userNameEl = document.getElementById('userName');

  if (!userNameEl) return;

  try {
    const userData = getUserData();

    if (userData) {
      userNameEl.textContent = `${userData.username || userData.name || 'User'}`;
    } else {
      // Try to fetch user data from API
      const profile = await getUserProfile();
      updateUserData(profile);
      userNameEl.textContent = `${profile.username || profile.name || 'User'}`;
    }
  } catch (error) {
    console.error('Error displaying user info:', error);
    userNameEl.textContent = 'User';
  }
}

/**
 * Display secure device information
 */
async function displaySecureDeviceInfo() {
  try {
    const info = await getDeviceInfo();

    const idEl = document.getElementById('deviceId');
    if (idEl) idEl.textContent = info.deviceIdTruncated || 'Unknown';

    const platformEl = document.getElementById('devicePlatform');
    if (platformEl) platformEl.textContent = info.platform || 'Unknown';

    const regEl = document.getElementById('deviceRegistered');
    if (regEl) regEl.textContent = info.bindTime ? new Date(info.bindTime).toLocaleString() : 'Unknown';

    const lastValEl = document.getElementById('deviceLastValidation');
    if (lastValEl) lastValEl.textContent = new Date().toLocaleString();

    const integrityEl = document.getElementById('deviceIntegrity');
    if (integrityEl) integrityEl.textContent = info.integrityValid ? '100% 🟢' : '0% 🔴';

    const statusEl = document.getElementById('deviceStatusText');
    if (statusEl) statusEl.textContent = info.integrityValid ? 'Active' : 'Warning';
  } catch (error) {
    console.error('Error displaying secure device info:', error);
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
  const secureLogout = document.getElementById('secureLogout');

  const handler = async (e) => {
    e.preventDefault();

    const btn = e.currentTarget;
    try {
      btn.disabled = true;
      btn.textContent = 'Logging out...';
      await performLogout();
    } catch (error) {
      console.error('Logout error:', error);
      clearAuthData();
      window.location.href = './login.html';
    }
  };

  if (logoutButton) logoutButton.addEventListener('click', handler);
  if (secureLogout) secureLogout.addEventListener('click', handler);
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
  const header = document.querySelector('.dashboard-header');
  if (header) {
    header.style.animation = 'fadeIn 0.5s ease-out';
  }

  document.querySelectorAll('.status-card').forEach((card, idx) => {
    card.style.animation = `fadeIn 0.5s ease-out ${idx * 0.1}s both`;
  });
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
