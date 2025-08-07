# Frontend Development Agent Prompt - Registration Page for Device-Restricted Authentication

## Project Context
You are a frontend development assistant tasked with creating a registration page for an Electron application. This registration system connects to an existing Express.js backend that implements JWT authentication with device ID restrictions, ensuring one account can only be used on one device. The registration page should follow the same design patterns as the existing login page.

## Backend Integration Details
- **Backend URL**: http://localhost:3000
- **Registration Endpoint**: POST /api/auth/register
- **Required Fields**: username, email, password, deviceId
- **Response**: JWT token and user information
- **Authentication Header**: Bearer token (for authenticated requests)

## Technical Requirements

### 1. Technology Stack
- **Framework**: Vanilla JavaScript (ES6+) for Electron renderer process
- **Styling**: Modern CSS with responsive design (consistent with login.css)
- **HTTP Client**: Fetch API (reuse existing api.js)
- **Storage**: localStorage for token storage (reuse existing storage.js)
- **Device ID**: Generate using Electron's system information (reuse existing device.js)

### 2. Registration Page Features
Create a registration page (`register.html`) with:
- Username input field (alphanumeric validation, min 3 characters)
- Email input field (email format validation)
- Password input field with show/hide toggle
- Confirm password field (must match password)
- Password strength indicator
- Terms and conditions checkbox
- Register button with loading state
- Error message display area
- Link back to login page
- Device ID display (read-only, auto-generated)
- Success message before redirect

### 3. Registration Flow Implementation
1. Generate/retrieve device ID on page load
2. Validate all form inputs in real-time
3. Check password strength and match
4. Ensure terms are accepted
5. Send registration request with all required fields
6. Handle successful registration:
   - Store JWT token in localStorage
   - Store user information
   - Show success message
   - Redirect to dashboard after delay
7. Handle registration errors:
   - Display appropriate error messages
   - Handle duplicate username/email errors
   - Handle device already registered errors
   - Show loading/disabled state during request

### 4. Input Validation Rules
- **Username**: 
  - Minimum 3 characters
  - Only letters, numbers, and underscores
  - Real-time availability check (optional)
- **Email**: 
  - Valid email format
  - Convert to lowercase
- **Password**: 
  - Minimum 6 characters
  - Must contain uppercase, lowercase, and number
  - Show strength indicator
- **Confirm Password**: 
  - Must match password field
  - Real-time matching validation

### 5. Error Handling
Handle specific error scenarios:
- Username already exists
- Email already exists
- Device already registered to another account
- Password too weak
- Network errors
- Server errors
- Validation errors

### 6. Security Considerations
- Client-side validation as first line of defense
- Never expose sensitive data in console logs
- Clear form data on successful registration
- Implement proper input sanitization
- Password strength requirements
- Prevent double submission

## File Structure
```
frontend/
├── pages/
│   ├── login.html (existing)
│   ├── register.html (new)
│   └── dashboard.html (existing)
├── css/
│   ├── common.css (existing)
│   ├── login.css (existing)
│   └── register.css (new)
├── js/
│   ├── auth.js (existing - for login)
│   ├── register.js (new - for registration)
│   ├── api.js (existing - add register function)
│   ├── storage.js (existing)
│   ├── device.js (existing)
│   └── validators.js (new - shared validation)
└── assets/
    └── images/
```

## Implementation Details

### 1. HTML Structure (register.html)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Device Restricted App</title>
    <link rel="stylesheet" href="../css/common.css">
    <link rel="stylesheet" href="../css/register.css">
</head>
<body>
    <div class="register-container">
        <div class="register-card">
            <h1>Create Account</h1>
            <div class="device-info">
                <small>Device ID: <span id="deviceId">Loading...</span></small>
            </div>
            <form id="registerForm">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" required>
                    <span class="field-hint">At least 3 characters, letters, numbers, and underscores only</span>
                    <span class="field-error" id="usernameError"></span>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                    <span class="field-error" id="emailError"></span>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="password" name="password" required>
                        <button type="button" id="togglePassword">Show</button>
                    </div>
                    <div class="password-strength" id="passwordStrength">
                        <div class="strength-bar"></div>
                        <span class="strength-text">Password strength</span>
                    </div>
                    <span class="field-hint">At least 6 characters with uppercase, lowercase, and number</span>
                    <span class="field-error" id="passwordError"></span>
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="confirmPassword" name="confirmPassword" required>
                        <button type="button" id="toggleConfirmPassword">Show</button>
                    </div>
                    <span class="field-error" id="confirmPasswordError"></span>
                </div>
                <div class="form-group checkbox">
                    <input type="checkbox" id="acceptTerms" name="acceptTerms" required>
                    <label for="acceptTerms">I accept the <a href="#" id="termsLink">Terms and Conditions</a></label>
                </div>
                <div id="errorMessage" class="error-message"></div>
                <div id="successMessage" class="success-message"></div>
                <button type="submit" id="registerButton" class="register-button">
                    <span class="button-text">Create Account</span>
                    <span class="loading-spinner" style="display: none;">Creating...</span>
                </button>
            </form>
            <div class="links">
                <a href="./login.html">Already have an account? Login</a>
            </div>
        </div>
    </div>
    <script src="../js/api.js"></script>
    <script src="../js/storage.js"></script>
    <script src="../js/device.js"></script>
    <script src="../js/validators.js"></script>
    <script src="../js/register.js"></script>
</body>
</html>
```

### 2. CSS Styling (register.css)
- Inherit and extend styles from login.css
- Add password strength indicator styles
- Field validation states (success/error)
- Smooth transitions for all interactions
- Consistent with login page design

### 3. JavaScript Implementation (register.js)
```javascript
// Main registration logic
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize device ID
    await initializeDeviceId();
    
    // Check if already logged in
    if (isAuthenticated()) {
        window.location.href = './dashboard.html';
        return;
    }
    
    // Initialize registration form
    initializeRegistrationForm();
    
    // Setup real-time validation
    setupFieldValidation();
});

async function handleRegistration(e) {
    e.preventDefault();
    
    // Get form values
    const formData = {
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        password: document.getElementById('password').value,
        deviceId: await getDeviceId()
    };
    
    // Validate all fields
    if (!validateRegistrationForm(formData)) {
        return;
    }
    
    try {
        // Show loading state
        setLoadingState(true);
        clearMessages();
        
        // Attempt registration
        const response = await register(formData);
        
        // Save authentication data
        saveAuthData(response.token, response.user, false);
        
        // Show success message
        showSuccess('Registration successful! Redirecting to dashboard...');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = './dashboard.html';
        }, 1500);
        
    } catch (error) {
        handleRegistrationError(error);
    } finally {
        setLoadingState(false);
    }
}
```

### 4. API Integration (update api.js)
```javascript
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
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to server.');
        }
        throw error;
    }
}
```

### 5. Validation Module (validators.js)
```javascript
// Shared validation functions
const validators = {
    username: (value) => {
        if (!value || value.length < 3) {
            return 'Username must be at least 3 characters long';
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            return 'Username can only contain letters, numbers, and underscores';
        }
        return null;
    },
    
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'Please enter a valid email address';
        }
        return null;
    },
    
    password: (value) => {
        if (!value || value.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            return 'Password must contain uppercase, lowercase, and number';
        }
        return null;
    },
    
    passwordStrength: (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        return {
            score: strength,
            level: strength <= 2 ? 'weak' : strength <= 4 ? 'medium' : 'strong'
        };
    }
};
```

### 6. Password Strength Indicator
Implement visual feedback for password strength:
- Weak (red): < 3 criteria met
- Medium (yellow): 3-4 criteria met
- Strong (green): 5+ criteria met

### 7. Real-time Validation Features
- Username: Check format and show feedback
- Email: Validate format on blur
- Password: Show strength indicator while typing
- Confirm Password: Check match in real-time
- Visual indicators (checkmarks, X marks)

## Testing Guidelines
1. Test successful registration flow
2. Test duplicate username/email scenarios
3. Test device already registered error
4. Test password strength indicator
5. Test form validation (empty fields, invalid formats)
6. Test password mismatch
7. Test terms acceptance requirement
8. Test auto-redirect when already logged in
9. Test network error handling

## Success Criteria
- User can successfully register with valid information
- Device ID is automatically generated and sent
- Proper validation with helpful error messages
- Password strength indicator works correctly
- Smooth user experience with loading states
- Token is stored and user is redirected to dashboard
- Clean, modern UI consistent with login page
- All error scenarios handled gracefully

## Additional Features to Consider
1. Email verification (optional for future)
2. Username availability check via API
3. Social registration options
4. Profile picture upload
5. Additional user information fields
6. CAPTCHA for bot prevention
7. Registration analytics

## Security Best Practices
1. Never trust client-side validation alone
2. Sanitize all inputs before sending
3. Use HTTPS in production
4. Implement rate limiting on backend
5. Strong password requirements
6. Prevent timing attacks on username/email check