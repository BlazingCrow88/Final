// File Location: /assets/js/auth.js

class AuthManager {
    constructor() {
        this.apiBase = '/api';
        this.tokenKey = 'authToken';
        this.userKey = 'currentUser';
        this.refreshTokenKey = 'refreshToken';
    }

    // Login user with credentials
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.csrfToken
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.setToken(data.token);
                this.setRefreshToken(data.refreshToken);
                this.setUser(data.user);
                this.scheduleTokenRefresh();
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Register new user
    async register(userData) {
        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.csrfToken
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Logout user
    async logout() {
        try {
            await fetch(`${this.apiBase}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`,
                    'X-CSRF-Token': window.csrfToken
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
            window.location.href = '/';
        }
    }

    // Refresh authentication token
    async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                this.logout();
                return false;
            }

            const response = await fetch(`${this.apiBase}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.csrfToken
                },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();

            if (response.ok) {
                this.setToken(data.token);
                this.setRefreshToken(data.refreshToken);
                this.scheduleTokenRefresh();
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            return false;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        // Check if token is expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } catch (error) {
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    // Token management
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setRefreshToken(token) {
        localStorage.setItem(this.refreshTokenKey, token);
    }

    getRefreshToken() {
        return localStorage.getItem(this.refreshTokenKey);
    }

    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userKey);
        clearTimeout(this.refreshTimer);
    }

    // Schedule automatic token refresh
    scheduleTokenRefresh() {
        const token = this.getToken();
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiresIn = payload.exp * 1000 - Date.now();
            const refreshTime = expiresIn - 5 * 60 * 1000; // Refresh 5 minutes before expiry

            if (refreshTime > 0) {
                this.refreshTimer = setTimeout(() => {
                    this.refreshToken();
                }, refreshTime);
            }
        } catch (error) {
            console.error('Error scheduling token refresh:', error);
        }
    }

    // Password reset request
    async requestPasswordReset(email) {
        try {
            const response = await fetch(`${this.apiBase}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.csrfToken
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            return { success: response.ok, message: data.message };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Verify email
    async verifyEmail(token) {
        try {
            const response = await fetch(`${this.apiBase}/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.csrfToken
                },
                body: JSON.stringify({ token })
            });

            const data = await response.json();
            return { success: response.ok, message: data.message };
        } catch (error) {
            console.error('Email verification error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Initialize auth on page load
    init() {
        if (this.isAuthenticated()) {
            this.scheduleTokenRefresh();
        } else {
            this.clearAuth();
        }
    }
}

// Create global auth instance
window.authManager = new AuthManager();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.authManager.init();
});
