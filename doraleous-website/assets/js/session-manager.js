// File Location: /assets/js/session-manager.js

class SessionManager {
    constructor() {
        this.sessionKey = 'userSession';
        this.activityKey = 'lastActivity';
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.warningTime = 5 * 60 * 1000; // 5 minutes before timeout
        this.checkInterval = 60 * 1000; // Check every minute
        this.warningShown = false;
        this.intervalId = null;
        this.warningTimeoutId = null;
    }

    // Start session management
    startSession(userData) {
        const sessionData = {
            user: userData,
            startTime: Date.now(),
            lastActivity: Date.now(),
            isActive: true
        };

        this.setSession(sessionData);
        this.updateActivity();
        this.startActivityMonitoring();
        this.bindActivityEvents();
    }

    // End session
    endSession() {
        this.clearSession();
        this.stopActivityMonitoring();
        this.unbindActivityEvents();
        this.warningShown = false;
    }

    // Update last activity timestamp
    updateActivity() {
        const session = this.getSession();
        if (session) {
            session.lastActivity = Date.now();
            this.setSession(session);
            
            // Hide warning if shown
            if (this.warningShown) {
                this.hideSessionWarning();
                this.warningShown = false;
            }
        }
    }

    // Check if session is valid
    isSessionValid() {
        const session = this.getSession();
        if (!session) return false;

        const timeSinceLastActivity = Date.now() - session.lastActivity;
        return timeSinceLastActivity < this.sessionTimeout;
    }

    // Get session data
    getSession() {
        const sessionData = localStorage.getItem(this.sessionKey);
        return sessionData ? JSON.parse(sessionData) : null;
    }

    // Set session data
    setSession(sessionData) {
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        localStorage.setItem(this.activityKey, Date.now().toString());
    }

    // Clear session data
    clearSession() {
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.activityKey);
    }

    // Start monitoring user activity
    startActivityMonitoring() {
        this.intervalId = setInterval(() => {
            this.checkSessionTimeout();
        }, this.checkInterval);
    }

    // Stop monitoring user activity
    stopActivityMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.warningTimeoutId) {
            clearTimeout(this.warningTimeoutId);
            this.warningTimeoutId = null;
        }
    }

    // Check for session timeout
    checkSessionTimeout() {
        const session = this.getSession();
        if (!session) return;

        const timeSinceLastActivity = Date.now() - session.lastActivity;
        const timeUntilTimeout = this.sessionTimeout - timeSinceLastActivity;

        // Show warning before timeout
        if (timeUntilTimeout <= this.warningTime && !this.warningShown) {
            this.showSessionWarning(Math.ceil(timeUntilTimeout / 1000));
            this.warningShown = true;
        }

        // Session expired
        if (timeSinceLastActivity >= this.sessionTimeout) {
            this.handleSessionExpiry();
        }
    }

    // Handle session expiry
    handleSessionExpiry() {
        this.endSession();
        
        // Notify user
        this.showSessionExpiredMessage();
        
        // Redirect to login or trigger logout
        if (window.authManager) {
            window.authManager.logout();
        } else {
            window.location.href = '/login';
        }
    }

    // Show session warning modal
    showSessionWarning(secondsLeft) {
        // Remove existing warning if any
        this.hideSessionWarning();

        const modal = document.createElement('div');
        modal.id = 'sessionWarningModal';
        modal.className = 'session-warning-modal';
        modal.innerHTML = `
            <div class="session-warning-content">
                <h3>Session Expiring Soon</h3>
                <p>Your session will expire in <span id="countdown">${secondsLeft}</span> seconds due to inactivity.</p>
                <div class="session-warning-buttons">
                    <button id="extendSession" class="btn btn-primary">Stay Logged In</button>
                    <button id="logoutNow" class="btn btn-secondary">Logout Now</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Countdown timer
        const countdownElement = document.getElementById('countdown');
        const countdownInterval = setInterval(() => {
            secondsLeft--;
            if (countdownElement) {
                countdownElement.textContent = secondsLeft;
            }
            
            if (secondsLeft <= 0) {
                clearInterval(countdownInterval);
                this.handleSessionExpiry();
            }
        }, 1000);

        // Event listeners
        document.getElementById('extendSession').addEventListener('click', () => {
            clearInterval(countdownInterval);
            this.updateActivity();
            this.hideSessionWarning();
        });

        document.getElementById('logoutNow').addEventListener('click', () => {
            clearInterval(countdownInterval);
            this.handleSessionExpiry();
        });
    }

    // Hide session warning modal
    hideSessionWarning() {
        const modal = document.getElementById('sessionWarningModal');
        if (modal) {
            modal.remove();
        }
    }

    // Show session expired message
    showSessionExpiredMessage() {
        const message = document.createElement('div');
        message.className = 'session-expired-message';
        message.innerHTML = `
            <div class="alert alert-warning">
                <strong>Session Expired:</strong> You have been logged out due to inactivity.
            </div>
        `;

        document.body.prepend(message);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    // Bind activity events
    bindActivityEvents() {
        this.activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        this.activityHandler = () => this.updateActivity();

        this.activityEvents.forEach(event => {
            document.addEventListener(event, this.activityHandler, true);
        });
    }

    // Unbind activity events
    unbindActivityEvents() {
        if (this.activityEvents && this.activityHandler) {
            this.activityEvents.forEach(event => {
                document.removeEventListener(event, this.activityHandler, true);
            });
        }
    }

    // Extend session manually
    extendSession() {
        this.updateActivity();
        return this.isSessionValid();
    }

    // Get session duration
    getSessionDuration() {
        const session = this.getSession();
        if (!session) return 0;
        
        return Date.now() - session.startTime;
    }

    // Get time until session expires
    getTimeUntilExpiry() {
        const session = this.getSession();
        if (!session) return 0;

        const timeSinceLastActivity = Date.now() - session.lastActivity;
        return Math.max(0, this.sessionTimeout - timeSinceLastActivity);
    }

    // Save data to session
    saveToSession(key, data) {
        const session = this.getSession();
        if (session) {
            session[key] = data;
            this.setSession(session);
        }
    }

    // Get data from session
    getFromSession(key) {
        const session = this.getSession();
        return session ? session[key] : null;
    }

    // Handle browser tab visibility change
    handleVisibilityChange() {
        if (document.hidden) {
            // Tab became hidden - could pause some monitoring
            this.saveToSession('tabHiddenAt', Date.now());
        } else {
            // Tab became visible - update activity
            this.updateActivity();
            this.saveToSession('tabHiddenAt', null);
        }
    }

    // Initialize session manager
    init() {
        // Handle browser tab visibility
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle browser window focus
        window.addEventListener('focus', () => {
            this.updateActivity();
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            // Mark session as potentially ending
            this.saveToSession('pageUnloading', true);
        });
    }
}

// Create global session manager instance
window.sessionManager = new SessionManager();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.sessionManager.init();
});
