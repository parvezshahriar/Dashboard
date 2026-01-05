// Error Handler - Comprehensive Global Error Management System

const errorMessages = {
    'SERVER_NOT_CONNECTED': 'Server connection failed. Please ensure the backend is running.',
    'INVALID_CREDENTIALS': 'Invalid username or password',
    'VALIDATION_FAILED': 'Please fill in all required fields',
    'CREATE_FAILED': 'Failed to create user',
    'UPDATE_FAILED': 'Failed to update user',
    'DELETE_FAILED': 'Failed to delete user',
    'ACCOUNT_DEACTIVATED': 'Your account has been deactivated. Please contact administrator.',
    'FILE_UPLOAD_FAILED': 'File upload failed',
    'NETWORK_ERROR': 'Network error occurred',
    'UNKNOWN_ERROR': 'An unexpected error occurred'
};

/**
 * Create error popup element if it doesn't exist
 */
function createErrorPopupElement() {
    if (document.getElementById('error-popup')) {
        return; // Already exists
    }
    
    const popup = document.createElement('div');
    popup.id = 'error-popup';
    popup.className = 'error-popup';
    popup.innerHTML = `
        <div class="error-container">
            <div class="error-header">
                <i class="fa-solid fa-circle-exclamation"></i>
                <h3>Error</h3>
                <button class="error-close" onclick="closeError()">&times;</button>
            </div>
            <div class="error-body">
                <p id="error-message"></p>
            </div>
            <div class="error-footer">
                <button class="error-btn-close" onclick="closeError()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    console.log('[ERROR-HANDLER] Popup element created');
}

/**
 * Show error popup with message
 * @param {string} errorKey - Key from errorMessages object
 * @param {string} customMessage - Custom message to override default
 * @param {boolean} isSuccess - If true, show as success message instead of error
 */
function showError(errorKey, customMessage, isSuccess = false) {
    // Ensure popup exists
    let popup = document.getElementById('error-popup');
    if (!popup) {
        createErrorPopupElement();
        popup = document.getElementById('error-popup');
    }
    
    if (!popup) {
        console.error('[ERROR-HANDLER] Failed to create popup element');
        return;
    }
    
    // Get the message element and update it
    const messageEl = document.getElementById('error-message');
    const message = customMessage || errorMessages[errorKey] || errorMessages['UNKNOWN_ERROR'];
    
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    // Update header based on success/error
    const headerTitle = popup.querySelector('.error-header h3');
    const headerIcon = popup.querySelector('.error-header i');
    
    if (isSuccess) {
        popup.classList.add('success');
        if (headerTitle) headerTitle.textContent = 'Success';
        if (headerIcon) headerIcon.className = 'fa-solid fa-circle-check';
    } else {
        popup.classList.remove('success');
        if (headerTitle) headerTitle.textContent = 'Error';
        if (headerIcon) headerIcon.className = 'fa-solid fa-circle-exclamation';
    }
    
    // Display the popup using CSS class
    popup.classList.add('show');
}

/**
 * Close error popup
 */
function closeError() {
    const popup = document.getElementById('error-popup');
    if (popup) {
        popup.classList.remove('show');
    }
}

/**
 * Initialize error handler on DOM ready
 */
function initErrorHandler() {
    if (!document.getElementById('error-popup')) {
        createErrorPopupElement();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initErrorHandler);
} else {
    // DOM already loaded
    initErrorHandler();
}

// ============================================
// OVERRIDE BROWSER DEFAULT ERROR DISPLAYS
// ============================================

// 1. Override window.alert() - Replace with custom popup
const originalAlert = window.alert;
window.alert = function(message) {
    console.log('[OVERRIDE-ALERT]', message);
    showError('UNKNOWN_ERROR', message, false);
};

// 2. Override window.confirm() - Replace with custom behavior
const originalConfirm = window.confirm;
window.confirm = function(message) {
    console.log('[OVERRIDE-CONFIRM]', message);
    return true;
};

// 3. Global error event handler
window.addEventListener('error', (event) => {
    console.log('[GLOBAL-ERROR]', event.error);
    event.preventDefault();
    showError('UNKNOWN_ERROR', `Error: ${event.error?.message || 'Unknown error'}`);
});

// 4. Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.log('[UNHANDLED-REJECTION]', event.reason);
    event.preventDefault();
    showError('UNKNOWN_ERROR', `Error: ${event.reason?.message || String(event.reason)}`);
});

// 5. Override console.error for critical errors
const originalConsoleError = console.error;
console.error = function(...args) {
    originalConsoleError.apply(console, args);
    const message = args.join(' ');
    if (message.includes('CRITICAL') || message.includes('FATAL')) {
        showError('UNKNOWN_ERROR', message);
    }
};

// 6. Disable browser's default form validation messages
document.addEventListener('invalid', (e) => {
    e.preventDefault();
    const field = e.target;
    let message = 'Please fill in all required fields';
    
    if (field.validity.valueMissing) {
        message = `${field.name || field.id || 'Field'} is required`;
    } else if (field.validity.typeMismatch) {
        message = `${field.name || field.id || 'Field'} has invalid format`;
    } else if (field.validity.tooShort) {
        message = `${field.name || field.id || 'Field'} is too short`;
    } else if (field.validity.tooLong) {
        message = `${field.name || field.id || 'Field'} is too long`;
    }
    
    showError('VALIDATION_FAILED', message);
}, true);

// 7. Intercept fetch errors
const originalFetch = window.fetch;
window.fetch = function(...args) {
    return originalFetch.apply(this, args).catch(error => {
        console.log('[FETCH-ERROR]', error);
        showError('SERVER_NOT_CONNECTED', `Network error: ${error.message}`);
        throw error;
    });
};

console.log('[ERROR-HANDLER] Fully initialized - All browser errors will show custom popups');
window.addEventListener('error', (event) => {
    console.error('[GLOBAL-ERROR]', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[UNHANDLED-REJECTION]', event.reason);
});
