// Terms and Conditions Modal Component

/**
 * Create and show terms and conditions modal
 */
function showTermsModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('termsModal');
    if (!modal) {
        modal = createTermsModal();
        document.body.appendChild(modal);
    }
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Focus close button for accessibility
    const closeButton = modal.querySelector('.modal-close');
    if (closeButton) {
        closeButton.focus();
    }
}

/**
 * Hide terms modal
 */
function hideTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }
}

/**
 * Create terms modal element
 */
function createTermsModal() {
    const modal = document.createElement('div');
    modal.id = 'termsModal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Terms and Conditions</h2>
                <button class="modal-close" type="button" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <h3>1. Account Creation and Security</h3>
                <p>By creating an account with our device-restricted authentication system, you agree to:</p>
                <ul>
                    <li>Provide accurate, current, and complete information during registration</li>
                    <li>Maintain and promptly update your account information</li>
                    <li>Keep your login credentials secure and confidential</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Notify us immediately of any unauthorized use</li>
                </ul>

                <h3>2. Device-Based Authentication</h3>
                <p>Our service implements device-restricted authentication, which means:</p>
                <ul>
                    <li>Your account is tied to the specific device you register from</li>
                    <li>You cannot use the same account on multiple devices simultaneously</li>
                    <li>Device ID is generated using your system's hardware information</li>
                    <li>Changing devices may require account verification or re-registration</li>
                </ul>

                <h3>3. Acceptable Use</h3>
                <p>You agree to use our service responsibly and not to:</p>
                <ul>
                    <li>Violate any applicable laws or regulations</li>
                    <li>Attempt to circumvent device restrictions</li>
                    <li>Share account credentials with others</li>
                    <li>Use the service for any illegal or unauthorized purpose</li>
                    <li>Interfere with or disrupt the service</li>
                </ul>

                <h3>4. Data Privacy and Security</h3>
                <p>We are committed to protecting your privacy:</p>
                <ul>
                    <li>Personal information is collected only as necessary for service operation</li>
                    <li>Device information is used solely for authentication purposes</li>
                    <li>Data is stored securely and encrypted where appropriate</li>
                    <li>We do not share your information with third parties without consent</li>
                </ul>

                <h3>5. Service Availability</h3>
                <p>While we strive for reliable service:</p>
                <ul>
                    <li>Service availability is not guaranteed 100% of the time</li>
                    <li>Maintenance and updates may cause temporary interruptions</li>
                    <li>We reserve the right to modify or discontinue features</li>
                </ul>

                <h3>6. Account Termination</h3>
                <p>Account termination may occur:</p>
                <ul>
                    <li>Upon your request to delete your account</li>
                    <li>For violation of these terms</li>
                    <li>For extended periods of inactivity</li>
                    <li>If required by law or regulation</li>
                </ul>

                <h3>7. Limitation of Liability</h3>
                <p>To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, or consequential damages arising from your use of the service.</p>

                <h3>8. Changes to Terms</h3>
                <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.</p>

                <h3>9. Contact Information</h3>
                <p>If you have questions about these terms, please contact our support team through the appropriate channels provided in the application.</p>

                <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
                
                <p><em>By clicking "I accept" during registration, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</em></p>
            </div>
        </div>
    `;
    
    // Add event listeners
    const closeButton = modal.querySelector('.modal-close');
    closeButton.addEventListener('click', hideTermsModal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideTermsModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            hideTermsModal();
        }
    });
    
    return modal;
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.showTermsModal = showTermsModal;
    window.hideTermsModal = hideTermsModal;
}
