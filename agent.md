# Frontend Development Agent Prompt - Login Page for Device-Restricted Authentication

## Project Context
You are a frontend development assistant tasked with creating a login page for an Electron application. This login system connects to an existing Express.js backend that implements JWT authentication with device ID restrictions, ensuring one account can only be used on one device.

## Backend Integration Details
- **Backend URL**: http://localhost:3000
- **Login Endpoint**: POST /api/auth/login
- **Required Fields**: username, password, deviceId
- **Response**: JWT token and user information
- **Authentication Header**: Bearer token

## Technical Requirements

### 1. Technology Stack
- **Framework**: Vanilla JavaScript (ES6+) for Electron renderer process
- **Styling**: Modern CSS with responsive design
- **HTTP Client**: Fetch API
- **Storage**: localStorage for token storage
- **Device ID**: Generate using Electron's system information

### 2. Login Page Features
Create a login page (`login.html`) with:
- Username input field
- Password input field with show/hide toggle
- Remember me checkbox
- Login button with loading state
- Error message display area
- Link to registration page (for future implementation)
- Device ID display (read-only, auto-generated)

### 3. Device ID Generation
Implement device ID generation using Electron APIs:
```javascript
const { ipcRenderer } = require('electron');

// Request device ID from main process
async function getDeviceId() {
  return await ipcRenderer.invoke('get-device-id');
}
```

### 4. Login Flow Implementation
1. Generate/retrieve device ID on page load
2. Validate form inputs before submission
3. Send login request with username, password, and deviceId
4. Handle successful login:
   - Store JWT token in localStorage
   - Store user information
   - Redirect to dashboard/home page
5. Handle login errors:
   - Display appropriate error messages
   - Handle device mismatch errors specifically
   - Show loading/disabled state during request

### 5. Error Handling
Handle specific error scenarios:
- Invalid credentials
- Device mismatch error (different device trying to login)
- Network errors
- Server errors
- Token expiration

### 6. Security Considerations
- Never expose sensitive data in console logs
- Implement proper input sanitization
- Use HTTPS in production
- Store tokens securely
- Clear sensitive data on logout
- Implement auto-logout on token expiration

## File Structure
```
frontend/
├── pages/
│   ├── login.html
│   └── dashboard.html (placeholder)
├── css/
│   ├── login.css
│   └── common.css
├── js/
│   ├── auth.js (authentication logic)
│   ├── api.js (API communication)
│   ├── storage.js (token management)
│   └── device.js (device ID handling)
└── assets/
    └── images/
```

## Implementation Details

### 1. HTML Structure (login.html)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Login - Device Restricted App</title>
    <link rel="stylesheet" href="../css/common.css">
    <link rel="stylesheet" href="../css/login.css">
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <h1>Login</h1>
            <div class="device-info">
                <small>Device ID: <span id="deviceId">Loading...</span></small>
            </div>
            <form id="loginForm">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="password" required>
                        <button type="button" id="togglePassword">Show</button>
                    </div>
                </div>
                <div class="form-group checkbox">
                    <input type="checkbox" id="rememberMe">
                    <label for="rememberMe">Remember me</label>
                </div>
                <div id="errorMessage" class="error-message"></div>
                <button type="submit" id="loginButton" class="login-button">
                    <span class="button-text">Login</span>
                    <span class="loading-spinner" style="display: none;">Loading...</span>
                </button>
            </form>
            <div class="links">
                <a href="#" id="registerLink">Don't have an account? Register</a>
            </div>
        </div>
    </div>
    <script src="../js/api.js"></script>
    <script src="../js/storage.js"></script>
    <script src="../js/device.js"></script>
    <script src="../js/auth.js"></script>
</body>
</html>
```

### 2. CSS Styling Guidelines (login.css)
- Modern, clean design with card-based layout
- Responsive design for different screen sizes
- Smooth transitions and hover effects
- Loading states with spinner animation
- Error message styling with red color
- Focus states for accessibility
- Dark mode support (optional)

### 3. JavaScript Implementation (auth.js)
```javascript
// Main authentication logic
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize device ID
    const deviceId = await getDeviceId();
    document.getElementById('deviceId').textContent = deviceId;
    
    // Handle form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
    
    // Check if already logged in
    if (isAuthenticated()) {
        window.location.href = './dashboard.html';
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const deviceId = await getDeviceId();
    
    // Show loading state
    setLoadingState(true);
    clearError();
    
    try {
        const response = await login(username, password, deviceId);
        
        // Store token and user info
        saveAuthData(response.token, response.user, rememberMe);
        
        // Redirect to dashboard
        window.location.href = './dashboard.html';
    } catch (error) {
        handleLoginError(error);
    } finally {
        setLoadingState(false);
    }
}
```

### 4. API Communication (api.js)
```javascript
const API_BASE_URL = 'http://localhost:3000/api';

async function login(username, password, deviceId) {
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
        throw new Error(data.error || 'Login failed');
    }
    
    return data;
}
```

### 5. Storage Management (storage.js)
```javascript
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

function saveAuthData(token, user, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(user));
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function isAuthenticated() {
    return !!getToken();
}

function clearAuthData() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
}
```

### 6. Main Process Integration (for Electron)
Add to your Electron main process:
```javascript
const { ipcMain } = require('electron');
const os = require('os');
const crypto = require('crypto');

ipcMain.handle('get-device-id', async () => {
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const networkInterfaces = os.networkInterfaces();
    
    // Get MAC address
    const macAddress = Object.values(networkInterfaces)
        .flat()
        .find(iface => iface.mac && iface.mac !== '00:00:00:00:00:00')?.mac || 'unknown';
    
    const deviceInfo = `${hostname}-${platform}-${arch}-${macAddress}`;
    return crypto.createHash('sha256').update(deviceInfo).digest('hex');
});
```

## Testing Guidelines
1. Test successful login flow
2. Test login with wrong credentials
3. Test login from different device (should fail)
4. Test network error handling
5. Test form validation
6. Test remember me functionality
7. Test auto-redirect when already logged in

## Success Criteria
- User can successfully login with valid credentials
- Device ID is automatically generated and displayed
- Proper error messages for different failure scenarios
- Smooth user experience with loading states
- Token is securely stored
- Successful redirect to dashboard after login
- Clean, modern, and responsive UI design

## Next Steps
After implementing the login page:
1. Create registration page (register.html)
2. Create dashboard/home page (dashboard.html)
3. Implement logout functionality
4. Add token refresh mechanism
5. Implement