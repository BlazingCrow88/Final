// File Location: /assets/js/admin-guard.js

class AdminGuard {
    constructor() {
        this.roles = {
            GUEST: 'guest',
            USER: 'user',
            MODERATOR: 'moderator',
            ADMIN: 'admin',
            SUPER_ADMIN: 'super_admin'
        };

        this.permissions = {
            READ_USERS: 'read_users',
            WRITE_USERS: 'write_users',
            DELETE_USERS: 'delete_users',
            MANAGE_ORDERS: 'manage_orders',
            MANAGE_BOOKS: 'manage_books',
            MANAGE_BLOG: 'manage_blog',
            VIEW_ANALYTICS: 'view_analytics',
            SYSTEM_CONFIG: 'system_config',
            FULL_ACCESS: 'full_access'
        };

        this.rolePermissions = {
            [this.roles.GUEST]: [],
            [this.roles.USER]: [],
            [this.roles.MODERATOR]: [
                this.permissions.READ_USERS,
                this.permissions.MANAGE_BLOG
            ],
            [this.roles.ADMIN]: [
                this.permissions.READ_USERS,
                this.permissions.WRITE_USERS,
                this.permissions.MANAGE_ORDERS,
                this.permissions.MANAGE_BOOKS,
                this.permissions.MANAGE_BLOG,
                this.permissions.VIEW_ANALYTICS
            ],
            [this.roles.SUPER_ADMIN]: [
                this.permissions.FULL_ACCESS
            ]
        };

        this.restrictedPages = [
            '/admin',
            '/admin/',
            '/admin/dashboard',
            '/admin/users',
            '/admin/orders',
            '/admin/books',
            '/admin/analytics',
            '/admin/settings'
        ];

        this.init();
    }

    // Initialize admin guard
    init() {
        this.checkPageAccess();
        this.setupElementVisibility();
        this.monitorRouteChanges();
    }

    // Get current user from auth manager
    getCurrentUser() {
        if (window.authManager) {
            return window.authManager.getCurrentUser();
        }
        
        // Fallback to session manager
        if (window.sessionManager) {
            const session = window.sessionManager.getSession();
            return session ? session.user : null;
        }
        
        return null;
    }

    // Get user role
    getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : this.roles.GUEST;
    }

    // Get user permissions
    getUserPermissions() {
        const role = this.getUserRole();
        
        // Super admin has all permissions
        if (role === this.roles.SUPER_ADMIN) {
            return Object.values(this.permissions);
        }
        
        return this.rolePermissions[role] || [];
    }

    // Check if user has specific permission
    hasPermission(permission) {
        const permissions = this.getUserPermissions();
        return permissions.includes(permission) || permissions.includes(this.permissions.FULL_ACCESS);
    }

    // Check if user has specific role
    hasRole(role) {
        const userRole = this.getUserRole();
        const roleHierarchy = [
            this.roles.GUEST,
            this.roles.USER,
            this.roles.MODERATOR,
            this.roles.ADMIN,
            this.roles.SUPER_ADMIN
        ];

        const userRoleIndex = roleHierarchy.indexOf(userRole);
        const requiredRoleIndex = roleHierarchy.indexOf(role);

        return userRoleIndex >= requiredRoleIndex;
    }

    // Check if user has any of the specified roles
    hasAnyRole(roles) {
        return roles.some(role => this.hasRole(role));
    }

    // Check if current page requires admin access
    isRestrictedPage(path = window.location.pathname) {
        return this.restrictedPages.some(restrictedPath => {
            if (restrictedPath.endsWith('/')) {
                return path.startsWith(restrictedPath);
            }
            return path === restrictedPath || path.startsWith(restrictedPath + '/');
        });
    }

    // Check page access and redirect if necessary
    checkPageAccess() {
        const currentPath = window.location.pathname;
        
        if (this.isRestrictedPage(currentPath)) {
            const user = this.getCurrentUser();
            
            if (!user) {
                this.redirectToLogin();
                return false;
            }

            if (!this.hasRole(this.roles.MODERATOR)) {
                this.redirectToUnauthorized();
                return false;
            }

            // Check specific page permissions
            const pagePermissions = this.getPagePermissions(currentPath);
            if (pagePermissions.length > 0) {
                const hasAccess = pagePermissions.some(permission => this.hasPermission(permission));
                if (!hasAccess) {
                    this.redirectToUnauthorized();
                    return false;
                }
            }
        }
        
        return true;
    }

    // Get required permissions for specific page
    getPagePermissions(path) {
        const permissionMap = {
            '/admin/users': [this.permissions.READ_USERS],
            '/admin/orders': [this.permissions.MANAGE_ORDERS],
            '/admin/books': [this.permissions.MANAGE_BOOKS],
            '/admin/analytics': [this.permissions.VIEW_ANALYTICS],
            '/admin/settings': [this.permissions.SYSTEM_CONFIG]
        };

        for (const [pagePath, permissions] of Object.entries(permissionMap)) {
            if (path.startsWith(pagePath)) {
                return permissions;
            }
        }

        return [];
    }

    // Setup element visibility based on permissions
    setupElementVisibility() {
        // Hide elements with data-role attribute
        document.querySelectorAll('[data-role]').forEach(element => {
            const requiredRoles = element.getAttribute('data-role').split(',').map(r => r.trim());
            if (!this.hasAnyRole(requiredRoles)) {
                element.style.display = 'none';
            }
        });

        // Hide elements with data-permission attribute
        document.querySelectorAll('[data-permission]').forEach(element => {
            const requiredPermissions = element.getAttribute('data-permission').split(',').map(p => p.trim());
            const hasAccess = requiredPermissions.some(permission => this.hasPermission(permission));
            if (!hasAccess) {
                element.style.display = 'none';
            }
        });

        // Show elements with data-show-for-role attribute
        document.querySelectorAll('[data-show-for-role]').forEach(element => {
            const requiredRoles = element.getAttribute('data-show-for-role').split(',').map(r => r.trim());
            if (this.hasAnyRole(requiredRoles)) {
                element.style.display = '';
            }
        });
    }

    // Monitor route changes for SPAs
    monitorRouteChanges() {
        // Monitor pushState and replaceState
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = (...args) => {
            originalPushState.apply(history, args);
            setTimeout(() => this.checkPageAccess(), 0);
        };

        history.replaceState = (...args) => {
            originalReplaceState.apply(history, args);
            setTimeout(() => this.checkPageAccess(), 0);
        };

        // Monitor popstate events
        window.addEventListener('popstate', () => {
            setTimeout(() => this.checkPageAccess(), 0);
        });
    }

    // Redirect to login page
    redirectToLogin() {
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `/login?redirect=${currentUrl}`;
    }

    // Redirect to unauthorized page
    redirectToUnauthorized() {
        window.location.href = '/unauthorized';
    }

    // Show access denied message
    showAccessDeniedMessage(message = 'Access denied. You do not have permission to perform this action.') {
        // Create and show modal or notification
        const modal = document.createElement('div');
        modal.className = 'access-denied-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Access Denied</h3>
                    <button class="close-btn" onclick="this.closest('.access-denied-modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.access-denied-modal').remove()">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 5000);
    }

    // Secure function wrapper
    secureFunction(requiredPermission, func) {
        return (...args) => {
            if (!this.hasPermission(requiredPermission)) {
                this.showAccessDeniedMessage();
                return false;
            }
            return func.apply(this, args);
        };
    }

    // Secure element click handler
    secureElementClick(element, requiredPermission, handler) {
        element.addEventListener('click', (event) => {
            if (!this.hasPermission(requiredPermission)) {
                event.preventDefault();
                event.stopPropagation();
                this.showAccessDeniedMessage();
                return false;
            }
            return handler(event);
        });
    }

    // Update user role (call when user role changes)
    updateUserRole() {
        this.setupElementVisibility();
        this.checkPageAccess();
    }

    // Get role display name
    getRoleDisplayName(role) {
        const displayNames = {
            [this.roles.GUEST]: 'Guest',
            [this.roles.USER]: 'User',
            [this.roles.MODERATOR]: 'Moderator',
            [this.roles.ADMIN]: 'Administrator',
            [this.roles.SUPER_ADMIN]: 'Super Administrator'
        };

        return displayNames[role] || 'Unknown';
    }

    // Log security event
    logSecurityEvent(event, details) {
        const logData = {
            event,
            details,
            user: this.getCurrentUser(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.log('Security Event:', logData);

        // Send to server if needed
        if (window.fetch) {
            fetch('/api/security/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.csrfToken
                },
                body: JSON.stringify(logData)
            }).catch(error => {
                console.error('Failed to log security event:', error);
            });
        }
    }

    // Check if user can access admin panel
    canAccessAdmin() {
        return this.hasRole(this.roles.MODERATOR);
    }

    // Get user capabilities for UI display
    getUserCapabilities() {
        return {
            canManageUsers: this.hasPermission(this.permissions.WRITE_USERS),
            canDeleteUsers: this.hasPermission(this.permissions.DELETE_USERS),
            canManageOrders: this.hasPermission(this.permissions.MANAGE_ORDERS),
            canManageBooks: this.hasPermission(this.permissions.MANAGE_BOOKS),
            canManageBlog: this.hasPermission(this.permissions.MANAGE_BLOG),
            canViewAnalytics: this.hasPermission(this.permissions.VIEW_ANALYTICS),
            canConfigureSystem: this.hasPermission(this.permissions.SYSTEM_CONFIG),
            isAdmin: this.hasRole(this.roles.ADMIN),
            isSuperAdmin: this.hasRole(this.roles.SUPER_ADMIN)
        };
    }
}

// Create global admin guard instance
window.adminGuard = new AdminGuard();

// Update when authentication state changes
document.addEventListener('authStateChanged', () => {
    window.adminGuard.updateUserRole();
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Re-run setup in case DOM has changed
    setTimeout(() => {
        window.adminGuard.setupElementVisibility();
    }, 100);
});
