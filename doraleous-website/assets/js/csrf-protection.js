// File Location: /assets/js/csrf-protection.js

class CSRFProtection {
    constructor() {
        this.tokenName = 'X-CSRF-Token';
        this.cookieName = 'csrf_token';
        this.headerName = 'X-CSRF-Token';
        this.metaTagName = 'csrf-token';
        this.tokenRefreshInterval = 15 * 60 * 1000; // 15 minutes
        this.refreshTimer = null;
    }

    // Initialize CSRF protection
    init() {
        this.loadTokenFromMeta();
        this.setupFormProtection();
        this.setupAjaxProtection();
        this.scheduleTokenRefresh();
        
        // Refresh token on page focus
        window.addEventListener('focus', () => {
            this.refreshToken();
        });
    }

    // Load CSRF token from meta tag
    loadTokenFromMeta() {
        const metaTag = document.querySelector(`meta[name="${this.metaTagName}"]`);
        if (metaTag) {
            this.token = metaTag.getAttribute('content');
            window.csrfToken = this.token;
        } else {
            console.warn('CSRF token meta tag not found');
            this.requestNewToken();
        }
    }

    // Get current CSRF token
    getToken() {
        return this.token || window.csrfToken;
    }

    // Set CSRF token
    setToken(token) {
        this.token = token;
        window.csrfToken = token;
        
        // Update meta tag
        const metaTag = document.querySelector(`meta[name="${this.metaTagName}"]`);
        if (metaTag) {
            metaTag.setAttribute('content', token);
        }
    }

    // Request new CSRF token from server
    async requestNewToken() {
        try {
            const response = await fetch('/api/csrf-token', {
                method: 'GET',
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                this.setToken(data.token);
                return data.token;
            } else {
                console.error('Failed to get CSRF token');
                return null;
            }
        } catch (error) {
            console.error('Error requesting CSRF token:', error);
            return null;
        }
    }

    // Refresh CSRF token
    async refreshToken() {
        const newToken = await this.requestNewToken();
        if (newToken) {
            this.updateFormTokens();
            console.log('CSRF token refreshed');
        }
    }

    // Schedule automatic token refresh
    scheduleTokenRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        this.refreshTimer = setInterval(() => {
            this.refreshToken();
        }, this.tokenRefreshInterval);
    }

    // Setup CSRF protection for forms
    setupFormProtection() {
        // Add tokens to existing forms
        this.updateFormTokens();

        // Add tokens to dynamically created forms
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'FORM') {
                            this.addTokenToForm(node);
                        } else {
                            const forms = node.querySelectorAll('form');
                            forms.forEach(form => this.addTokenToForm(form));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Add CSRF token to all forms
    updateFormTokens() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => this.addTokenToForm(form));
    }

    // Add CSRF token to a specific form
    addTokenToForm(form) {
        // Skip forms that already have a token
        if (form.querySelector(`input[name="${this.tokenName}"]`)) {
            return;
        }

        // Skip forms with GET method
        if (form.method.toLowerCase() === 'get') {
            return;
        }

        // Skip external forms
        if (form.action && !this.isInternalUrl(form.action)) {
            return;
        }

        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = this.tokenName;
        tokenInput.value = this.getToken();
        
        form.appendChild(tokenInput);
    }

    // Setup CSRF protection for AJAX requests
    setupAjaxProtection() {
        // Override XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            this._method = method;
            this._url = url;
            return originalXHROpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function(data) {
            if (this._method && this._method.toUpperCase() !== 'GET' && 
                this._url && window.csrfProtection.isInternalUrl(this._url)) {
                this.setRequestHeader(window.csrfProtection.headerName, window.csrfProtection.getToken());
            }
            return originalXHRSend.apply(this, arguments);
        };

        // Override fetch API
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            if (options.method && options.method.toUpperCase() !== 'GET' && 
                window.csrfProtection.isInternalUrl(url)) {
                
                options.headers = options.headers || {};
                if (typeof options.headers.append === 'function') {
                    options.headers.append(window.csrfProtection.headerName, window.csrfProtection.getToken());
                } else {
                    options.headers[window.csrfProtection.headerName] = window.csrfProtection.getToken();
                }
            }
            return originalFetch.apply(this, arguments);
        };

        // Setup jQuery AJAX if jQuery is available
        if (window.jQuery) {
            window.jQuery.ajaxSetup({
                beforeSend: (xhr, settings) => {
                    if (settings.type && settings.type.toUpperCase() !== 'GET' && 
                        this.isInternalUrl(settings.url)) {
                        xhr.setRequestHeader(this.headerName, this.getToken());
                    }
                }
            });
        }
    }

    // Check if URL is internal/same-origin
    isInternalUrl(url) {
        if (!url) return true;

        // Relative URLs are always internal
        if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
            return true;
        }

        // Check if URL has same origin
        try {
            const urlObj = new URL(url, window.location.origin);
            return urlObj.origin === window.location.origin;
        } catch (error) {
            // If URL parsing fails, assume it's internal
            return true;
        }
    }

    // Validate CSRF token on form submission
    validateFormSubmission(form) {
        const tokenInput = form.querySelector(`input[name="${this.tokenName}"]`);
        
        if (!tokenInput) {
            console.warn('Form submitted without CSRF token');
            return false;
        }

        if (tokenInput.value !== this.getToken()) {
            console.warn('Form submitted with invalid CSRF token');
            return false;
        }

        return true;
    }

    // Handle CSRF token mismatch
    handleTokenMismatch() {
        console.warn('CSRF token mismatch detected, refreshing token');
        this.refreshToken();
    }

    // Create a protected form submission handler
    createProtectedSubmitHandler(originalHandler) {
        return (event) => {
            const form = event.target;
            
            if (!this.validateFormSubmission(form)) {
                event.preventDefault();
                this.handleTokenMismatch();
                return false;
            }

            if (originalHandler) {
                return originalHandler.call(this, event);
            }
        };
    }

    // Get token for manual use
    getTokenForManualUse() {
        return {
            name: this.headerName,
            value: this.getToken()
        };
    }

    // Clean up resources
    destroy() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
}

// Create global CSRF protection instance
window.csrfProtection = new CSRFProtection();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.csrfProtection.init();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    window.csrfProtection.destroy();
});
