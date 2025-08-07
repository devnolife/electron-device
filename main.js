// Main Electron process file
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const SecureDeviceManager = require('./utils/secureDevice');

let mainWindow;
let secureDevice = null;

/**
 * Initialize secure device binding
 */
function initializeSecureDevice() {
  try {
    secureDevice = new SecureDeviceManager();
    const deviceBinding = secureDevice.initializeIfNeeded();

    console.log('Secure device initialized:', {
      deviceId: deviceBinding.deviceId,
      platform: deviceBinding.platform,
      bindTime: deviceBinding.bindTime
    });

    return deviceBinding;
  } catch (error) {
    console.error('Failed to initialize secure device:', error);
    throw new Error('Device security initialization failed');
  }
}

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: true
  });

  // Load the login page
  mainWindow.loadFile(path.join(__dirname, 'frontend/pages/login.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    if (process.platform === 'darwin') {
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

/**
 * Generate device hash for server communication
 */
function generateDeviceHash(additionalData = '') {
  try {
    return secureDevice.generateDeviceHash(additionalData);
  } catch (error) {
    console.error('Error generating device hash:', error);
    throw error;
  }
}

/**
 * IPC Handlers
 */

// Get device credentials
ipcMain.handle('get-device-credentials', async () => {
  try {
    const deviceInfo = secureDevice.getDeviceInfo();
    return {
      deviceId: deviceInfo.deviceId,
      platform: deviceInfo.platform,
      arch: deviceInfo.arch,
      hostname: deviceInfo.hostname,
      bindTime: deviceInfo.bindTime
    };
  } catch (error) {
    console.error('Error getting device credentials:', error);
    throw error;
  }
});

// Generate device hash for authentication
ipcMain.handle('generate-device-hash', async (event, additionalData = '') => {
  try {
    return generateDeviceHash(additionalData);
  } catch (error) {
    console.error('Error generating device hash:', error);
    throw error;
  }
});

// Validate device integrity
ipcMain.handle('validate-device-integrity', async () => {
  try {
    return secureDevice.validateDeviceBinding();
  } catch (error) {
    console.error('Error validating device integrity:', error);
    return {
      isValid: false,
      reason: 'Validation error',
      error: error.message
    };
  }
});

// Reset device binding (for development/debugging)
ipcMain.handle('reset-device-binding', async () => {
  try {
    const result = secureDevice.resetDeviceBinding();
    if (result) {
      // Reinitialize after reset
      initializeSecureDevice();
    }
    return { success: result };
  } catch (error) {
    console.error('Error resetting device binding:', error);
    return { success: false, error: error.message };
  }
});

/**
 * App Event Handlers
 */
app.whenReady().then(() => {
  // Initialize secure device binding first
  try {
    initializeSecureDevice();
  } catch (error) {
    console.error('Critical: Device security initialization failed');
    console.error('Application cannot start without device binding');
    app.quit();
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (process.env.NODE_ENV === 'development' && url.startsWith('http://localhost')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

app.on('before-quit', () => {
  console.log('Application is quitting...');
});

app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});

// Additional IPC handlers for app management
ipcMain.handle('get-app-info', async () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node
  };
});

ipcMain.handle('quit-app', async () => {
  app.quit();
});

ipcMain.handle('restart-app', async () => {
  app.relaunch();
  app.exit();
});

console.log('Electron main process started');
console.log('App version:', app.getVersion());
console.log('Platform:', process.platform);
