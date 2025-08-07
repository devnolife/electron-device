// Shared validation functions
const validators = {
    /**
     * Validate username
     * @param {string} value - Username to validate
     * @returns {string|null} - Error message or null if valid
     */
    username: (value) => {
        if (!value || value.length < 3) {
            return 'Username must be at least 3 characters long';
        }
        if (value.length > 20) {
            return 'Username must be less than 20 characters';
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            return 'Username can only contain letters, numbers, and underscores';
        }
        if (value.startsWith('_') || value.endsWith('_')) {
            return 'Username cannot start or end with underscore';
        }
        return null;
    },

    /**
     * Validate email address
     * @param {string} value - Email to validate
     * @returns {string|null} - Error message or null if valid
     */
    email: (value) => {
        if (!value) {
            return 'Email is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'Please enter a valid email address';
        }
        if (value.length > 254) {
            return 'Email address is too long';
        }
        return null;
    },

    /**
     * Validate password
     * @param {string} value - Password to validate
     * @returns {string|null} - Error message or null if valid
     */
    password: (value) => {
        if (!value || value.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        if (value.length > 128) {
            return 'Password must be less than 128 characters';
        }
        if (!/(?=.*[a-z])/.test(value)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/(?=.*[A-Z])/.test(value)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/(?=.*\d)/.test(value)) {
            return 'Password must contain at least one number';
        }
        return null;
    },

    /**
     * Validate password confirmation
     * @param {string} password - Original password
     * @param {string} confirmPassword - Confirmation password
     * @returns {string|null} - Error message or null if valid
     */
    confirmPassword: (password, confirmPassword) => {
        if (!confirmPassword) {
            return 'Please confirm your password';
        }
        if (password !== confirmPassword) {
            return 'Passwords do not match';
        }
        return null;
    },

    /**
     * Calculate password strength
     * @param {string} password - Password to evaluate
     * @returns {Object} - Strength score and level
     */
    passwordStrength: (password) => {
        if (!password) {
            return { score: 0, level: 'none' };
        }

        let strength = 0;
        const checks = {
            length: password.length >= 8,
            longLength: password.length >= 12,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /[0-9]/.test(password),
            symbols: /[^a-zA-Z0-9]/.test(password),
            noCommon: !isCommonPassword(password),
            noSequential: !hasSequentialChars(password)
        };

        // Calculate strength based on checks
        Object.values(checks).forEach(check => {
            if (check) strength++;
        });

        // Determine level
        let level;
        if (strength <= 3) {
            level = 'weak';
        } else if (strength <= 5) {
            level = 'medium';
        } else {
            level = 'strong';
        }

        return {
            score: strength,
            level: level,
            checks: checks
        };
    },

    /**
     * Validate terms acceptance
     * @param {boolean} accepted - Whether terms are accepted
     * @returns {string|null} - Error message or null if valid
     */
    terms: (accepted) => {
        if (!accepted) {
            return 'You must accept the Terms and Conditions';
        }
        return null;
    }
};

/**
 * Check if password is commonly used
 * @param {string} password - Password to check
 * @returns {boolean} - True if password is common
 */
function isCommonPassword(password) {
    const commonPasswords = [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', 'monkey',
        'dragon', 'master', 'superman', 'football', 'baseball'
    ];
    return commonPasswords.includes(password.toLowerCase());
}

/**
 * Check if password has sequential characters
 * @param {string} password - Password to check
 * @returns {boolean} - True if has sequential chars
 */
function hasSequentialChars(password) {
    const sequences = ['123', '234', '345', '456', '567', '678', '789', 'abc', 'bcd', 'cde'];
    return sequences.some(seq => password.toLowerCase().includes(seq));
}

/**
 * Real-time validation for form fields
 * @param {string} fieldName - Name of the field to validate
 * @param {string} value - Value to validate
 * @param {Object} additionalData - Additional data for validation
 * @returns {Object} - Validation result
 */
function validateField(fieldName, value, additionalData = {}) {
    let error = null;
    let success = false;

    switch (fieldName) {
        case 'username':
            error = validators.username(value);
            success = !error;
            break;
        case 'email':
            error = validators.email(value);
            success = !error;
            break;
        case 'password':
            error = validators.password(value);
            success = !error;
            break;
        case 'confirmPassword':
            error = validators.confirmPassword(additionalData.password, value);
            success = !error;
            break;
        case 'terms':
            error = validators.terms(value);
            success = !error;
            break;
        default:
            error = 'Unknown field';
    }

    return { error, success };
}

/**
 * Validate entire registration form
 * @param {Object} formData - Form data to validate
 * @returns {Object} - Validation results
 */
function validateRegistrationForm(formData) {
    const results = {};
    let isValid = true;

    // Validate each field
    results.username = validateField('username', formData.username);
    results.email = validateField('email', formData.email);
    results.password = validateField('password', formData.password);
    results.confirmPassword = validateField('confirmPassword', formData.confirmPassword, {
        password: formData.password
    });
    results.terms = validateField('terms', formData.acceptTerms);

    // Check if any field is invalid
    Object.values(results).forEach(result => {
        if (result.error) {
            isValid = false;
        }
    });

    return {
        isValid,
        results
    };
}

/**
 * Sanitize input values
 * @param {string} value - Value to sanitize
 * @returns {string} - Sanitized value
 */
function sanitizeInput(value) {
    if (typeof value !== 'string') return '';
    
    return value
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 255); // Limit length
}

/**
 * Format email for consistency
 * @param {string} email - Email to format
 * @returns {string} - Formatted email
 */
function formatEmail(email) {
    return sanitizeInput(email).toLowerCase();
}

/**
 * Get password strength description
 * @param {string} level - Strength level
 * @returns {string} - Human readable description
 */
function getPasswordStrengthText(level) {
    switch (level) {
        case 'weak':
            return 'Weak password';
        case 'medium':
            return 'Medium strength';
        case 'strong':
            return 'Strong password';
        default:
            return 'Password strength';
    }
}

/**
 * Generate helpful password suggestions
 * @param {Object} checks - Password strength checks
 * @returns {Array} - Array of suggestions
 */
function getPasswordSuggestions(checks) {
    const suggestions = [];

    if (!checks.length) {
        suggestions.push('Make it at least 8 characters long');
    }
    if (!checks.uppercase) {
        suggestions.push('Add an uppercase letter');
    }
    if (!checks.lowercase) {
        suggestions.push('Add a lowercase letter');
    }
    if (!checks.numbers) {
        suggestions.push('Add a number');
    }
    if (!checks.symbols) {
        suggestions.push('Add a special character');
    }
    if (!checks.noCommon) {
        suggestions.push('Avoid common passwords');
    }

    return suggestions;
}

// Export validators for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validators,
        validateField,
        validateRegistrationForm,
        sanitizeInput,
        formatEmail,
        getPasswordStrengthText,
        getPasswordSuggestions
    };
}
