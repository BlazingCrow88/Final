// File Location: /assets/js/security-utils.js

class SecurityUtils {
    constructor() {
        this.maxAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.attemptKey = 'loginAttempts';
        this.lockoutKey = 'lockoutUntil';
    }

    // Sanitize HTML to prevent XSS
    sanitizeHtml(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Escape HTML entities
    escapeHtml(str) {
        if (typeof str !== 'string') return str;
        
        const entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };

        return str.replace(/[&<>"'`=\/]/g, (s) => entityMap[s]);
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const strength = {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
            length: password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar,
            score: 0
        };

        // Calculate strength score
        if (strength.length) strength.score += 1;
        if (strength.hasUpperCase) strength.score += 1;
        if (strength.hasLowerCase) strength.score += 1;
        if (strength.hasNumbers) strength.score += 1;
        if (strength.hasSpecialChar) strength.score += 1;

        strength.level = this.getPasswordStrengthLevel(strength.score);

        return strength;
    }

    // Get password strength level
    getPasswordStrengthLevel(score) {
        if (score <= 2) return 'weak';
        if (score <= 3) return 'fair';
        if (score <= 4) return 'good';
        return 'strong';
    }

    // Rate limiting for login attempts
    recordLoginAttempt(success, identifier = 'default') {
        const key = `${this.attemptKey}_${identifier}`;
        const lockoutKey = `${this.lockoutKey}_${identifier}`;

        if (success) {
            // Clear attempts on successful login
            localStorage.removeItem(key);
            localStorage.removeItem(lockoutKey);
            return { allowed: true };
        }

        // Record failed attempt
        const attempts = this.getLoginAttempts(identifier) + 1;
        const attemptData = {
            count: attempts,
            lastAttempt: Date.now()
        };

        localStorage.setItem(key, JSON.stringify(attemptData));

        // Check if should be locked out
        if (attempts >= this.maxAttempts) {
            const lockoutUntil = Date.now() + this.lockoutDuration;
            localStorage.setItem(lockoutKey, lockoutUntil.toString());
            
            return {
                allowed: false,
                locked: true,
                attemptsRemaining: 0,
                lockoutUntil
            };
        }

        return {
            allowed: true,
            locked: false,
            attemptsRemaining: this.maxAttempts - attempts
        };
    }

    // Check if login is allowed
    isLoginAllowed(identifier = 'default') {
        const lockoutKey = `${this.lockoutKey}_${identifier}`;
        const lockoutUntil = localStorage.getItem(lockoutKey);

        if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
            return {
                allowed: false,
                locked: true,
                lockoutUntil: parseInt(lockoutUntil)
            };
        }

        // Clear expired lockout
        if (lockoutUntil) {
            localStorage.removeItem(lockoutKey);
            localStorage.removeItem(`${this.attemptKey}_${identifier}`);
        }

        const attempts = this.getLoginAttempts(identifier);
        return {
            allowed: true,
            locked: false,
            attemptsRemaining: this.maxAttempts - attempts
        };
    }

    // Get login attempts count
    getLoginAttempts(identifier = 'default') {
        const key = `${this.attemptKey}_${identifier}`;
        const data = localStorage.getItem(key);
        
        if (!data) return 0;

        try {
            const attemptData = JSON.parse(data);
            // Clear old attempts (older than 1 hour)
            if (Date.now() - attemptData.lastAttempt > 60 * 60 * 1000) {
                localStorage.removeItem(key);
                return 0;
            }
            return attemptData.count;
        } catch (error) {
            localStorage.removeItem(key);
            return 0;
        }
    }

    // Generate secure random string
    generateRandomString(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        if (window.crypto && window.crypto.getRandomValues) {
            const randomArray = new Uint8Array(length);
            window.crypto.getRandomValues(randomArray);
            
            for (let i = 0; i < length; i++) {
                result += chars[randomArray[i] % chars.length];
            }
        } else {
            // Fallback for older browsers
            for (let i = 0; i < length; i++) {
                result += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        
        return result;
    }

    // Validate file upload security
    validateFileUpload(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
        const errors = [];

        // Check file size
        if (file.size > maxSize) {
            errors.push(`File size exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`);
        }

        // Check file type
        if (allowedTypes.length > 0) {
            const fileType = file.type;
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            const isTypeAllowed = allowedTypes.some(type => {
                if (type.includes('/')) {
                    return fileType === type;
                } else {
                    return fileExtension === type.toLowerCase();
                }
            });

            if (!isTypeAllowed) {
                errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
            }
        }

        // Check for potentially dangerous extensions
        const dangerousExtensions = ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'php', 'asp', 'jsp'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (dangerousExtensions.includes(fileExtension)) {
            errors.push('File type not allowed for security reasons');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Format file size for display
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Secure localStorage wrapper
    secureStorage = {
        set: (key, value, encrypt = false) => {
            try {
                let finalValue = JSON.stringify(value);
                
                if (encrypt && window.crypto && window.crypto.subtle) {
                    // Simple encryption using base64 (not cryptographically secure)
                    finalValue = btoa(finalValue);
                }
                
                localStorage.setItem(key, finalValue);
                return true;
            } catch (error) {
                console.error('Error storing data:', error);
                return false;
            }
        },

        get: (key, decrypt = false) => {
            try {
                let value = localStorage.getItem(key);
                
                if (!value) return null;
                
                if (decrypt) {
                    try {
                        value = atob(value);
                    } catch (error) {
                        console.error('Error decrypting data:', error);
                        return null;
                    }
                }
                
                return JSON.parse(value);
            } catch (error) {
                console.error('Error retrieving data:', error);
                return null;
            }
        },

        remove: (key) => {
            localStorage.removeItem(key);
        },

        clear: () => {
            localStorage.clear();
        }
    };

    // Detect potentially malicious content
    detectMaliciousContent(content) {
        const maliciousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /onload=/gi,
            /onerror=/gi,
            /onclick=/gi,
            /onmouseover=/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /<link.*href.*javascript:/gi
        ];

        for (let pattern of maliciousPatterns) {
            if (pattern.test(content)) {
                return true;
            }
        }

        return false;
    }

    // Content Security Policy violation handler
    handleCSPViolation(violation) {
        console.warn('CSP Violation:', violation);
        
        // Log to server if needed
        if (window.fetch) {
            fetch('/api/security/csp-violation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.csrfToken
                },
                body: JSON.stringify({
                    violatedDirective: violation.violatedDirective,
                    blockedURI: violation.blockedURI,
                    documentURI: violation.documentURI,
                    timestamp: Date.now()
                })
            }).catch(error => {
                console.error('Failed to report CSP violation:', error);
            });
        }
    }

    // Initialize security monitoring
    init() {
        // Setup CSP violation reporting
        document.addEventListener('securitypolicyviolation', (e) => {
            this.handleCSPViolation(e);
        });

        // Monitor for suspicious activity
        this.setupActivityMonitoring();
    }

    // Setup activity monitoring for suspicious behavior
    setupActivityMonitoring() {
        let rapidClickCount = 0;
        let rapidClickTimer = null;

        document.addEventListener('click', () => {
            rapidClickCount++;
            
            if (rapidClickTimer) {
                clearTimeout(rapidClickTimer);
            }

            rapidClickTimer = setTimeout(() => {
                if (rapidClickCount > 20) {
                    console.warn('Suspicious rapid clicking detected');
                    // Could implement additional security measures here
                }
                rapidClickCount = 0;
            }, 1000);
        });
    }
}

// Create global security utils instance
window.securityUtils = new SecurityUtils();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.securityUtils.init();
});
