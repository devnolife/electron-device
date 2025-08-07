// Test script untuk registration dan login
// const fetch = require('node-fetch'); // Commented out, using built-in fetch

const API_BASE_URL = 'http://localhost:3000/api';

async function testRegistration() {
    const testData = {
        username: 'testuser123',
        email: 'test@example.com',
        password: 'TestPassword123',
        deviceId: 'test-device-id-12345'
    };

    try {
        console.log('Testing registration...');
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✓ Registration successful!');
            console.log('User:', result.user);
            console.log('Token length:', result.token.length);
            return result.token;
        } else {
            console.log('✗ Registration failed:', result.error);
            return null;
        }
    } catch (error) {
        console.error('✗ Registration error:', error.message);
        return null;
    }
}

async function testLogin() {
    const testData = {
        username: 'testuser123',
        password: 'TestPassword123',
        deviceId: 'test-device-id-12345'
    };

    try {
        console.log('\nTesting login...');
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✓ Login successful!');
            console.log('User:', result.user);
            console.log('Token length:', result.token.length);
            return result.token;
        } else {
            console.log('✗ Login failed:', result.error);
            return null;
        }
    } catch (error) {
        console.error('✗ Login error:', error.message);
        return null;
    }
}

async function runTests() {
    console.log('Starting API tests...\n');
    
    const regToken = await testRegistration();
    if (regToken) {
        console.log('Registration test passed!\n');
    }
    
    const loginToken = await testLogin();
    if (loginToken) {
        console.log('Login test passed!\n');
    }
    
    console.log('Tests completed.');
}

runTests().catch(console.error);
