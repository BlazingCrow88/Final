/* ===================================
   BLOG ADMIN FUNCTIONALITY
   File: assets/js/blog-admin.js
   =================================== */

class BlogAdmin {
    constructor() {
        this.apiEndpoint = '/api/blog';
        this.currentUser = null;
        this.currentView = 'posts';
        this.selectedItems = new Set();
        this.sortOrder = 'desc';
        this.sortBy = 'created_at';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.filters = {
            status: '',
            category: '',
            author: '',
            dateRange: ''
        };
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupInterface();
        this.bindEvents();
        this.loadInitialData();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                this.currentUser = await response.json();
                if (!this.currentUser.permissions.includes('manage_blog')) {
                    throw new Error('Insufficient permissions');
                }
            } else {
                throw new Error('Not authenticated');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            window.location.href = '/admin/login.html';
        }
    }

    setupInterface() {
        this.createAdminInterface();
        this.initializeComponents();
    }

    createAdminInterface() {
        const adminContainer = document.getElementById('adminContainer');
        if (!adminContainer) return;

        adminContainer.innerHTML = `
            <div class="admin-header">
                <h1>Blog Administration</h1>
                <div class="admin-actions">
                    <button class="btn btn-primary" id="newPostBtn">
                        <i class="fas fa-plus"></i> New Post
                    </button>
                    <button class="btn btn-secondary" id="previewSiteBtn">
                        <i class="fas fa-external-link-alt"></i> Preview Site
                    </button>
                    <div class="user-menu">
                        <span class="user-name">${this.currentUser.name}</span>
                        <button class="btn btn-outline" id="logoutBtn">Logout</button>
                    </div>
                </div>
            </div>

            <div class="admin-sidebar">
                <nav class="admin-nav">
                    <a href="#posts" class="nav-item active" data-view="posts">
                        <i class="fas fa-file-alt"></i> Posts
                    </a>
                    <a href="#comments" class="nav-item" data-view="comments">
                        <i class="fas fa-comments"></i> Comments
                        <span class="badge" id="pendingCommentsCount">0</span>
                    </a>
                    <a href="#categories" class="nav-item" data-view="categories">
                        <i class="fas fa-tags"></i> Categories
                    </a>
                    <a href="#media" class="nav-item" data-view="media">
                        <i class="fas fa-images"></i> Media
                    </a>
                    <a href="#analytics" class="nav-item" data-view="analytics">
                        <i class="fas fa-chart-bar"></i> Analytics
                    </a>
                    <a href="#settings" class="nav-item" data-view="settings">
                        <i class="fas fa-cog"></i> Settings
                    </a>
                </nav>
            </div>

            <div class="admin-main">
                <div class="admin-content" id="adminContent">
                    <!-- Dynamic content will be loaded here -->
                </div>
            </div>

            <div class="admin-footer">
                <div class="auto-save-status" id="autoSaveStatus">
                    <i class="fas fa-check-circle"></i> All changes saved
                </div>
            </div>
        `;
    }

    initializeComponents() {
        // Initialize rich text editor
        this.initializeEditor();
        
        // Initialize drag and drop for media
        this.initializeDragDrop();
        
        // Initialize keyboard shortcuts
        this.initializeKeyboardShortcuts();
    }

    bindEvents() {
        // Navigation
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                const view = navItem.dataset.view;
                this.switchView(view);
            }
        });

        // Main action buttons
        const newPostBtn = document.getElementById('newPostBtn');
        if (newPostBtn) {
            newPostBtn.addEventListener('click', () => this.createNewPost());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Bulk actions
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('select-item')) {
                this.handleItemSelection(e.target);
            }
        });

        // Search and filters
        document.addEventListener('input', (e) => {
            if (e.target.id === 'searchInput') {
                this.debounce(() => this.performSearch(e.target.value), 300)();
            }
        });

        // Auto-save
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('auto-save')) {
                this.debounce(() => this.autoSave(e.target), 2000)();
            }
        });
    }

    async loadInitialData() {
        await this.switchView('posts');
        await this.loadPendingCommentsCount();
    }

    async switchView(view) {
        this.currentView = view;
        this.updateNavigation(view);
        
        const content = await this.loadViewContent(view);
        const adminContent = document.getElementById('adminContent');
        if (adminContent) {
            adminContent.innerHTML = content;
        }

        // Bind view-specific events
        this.bindViewEvents(view);
    }

    updateNavigation(activeView) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.view === activeView);
        });
    }

    async loadViewContent(view) {
        switch (view) {
            case 'posts':
                return await this.loadPostsView();
            case 'comments':
                return await this.loadCommentsView();
            case 'categories':
                return await this.loadCategoriesView();
            case 'media':
                return await this.loadMediaView();
            case 'analytics':
                return await this.loadAnalyticsView();
            case 'settings':
                return await this.loadSettingsView();
            default:
                return '<div class="error">Unknown view</div>';
        }
    }

    async loadPostsView() {
        try {
            const posts = await this.fetchPosts();
            
            return `
                <div class="view-header">
                    <h2>Posts</h2>
                    <div class="view-actions">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="searchInput" placeholder="Search posts...">
                        </div>
                        <select id="statusFilter" class="filter-select">
                            <option value="">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="pending">Pending</option>
                        </select>
                        <select id="categoryFilter" class="filter-select">
                            <option value="">All Categories</option>
                            ${await this.getCategoryOptions()}
                        </select>
                    </div>
                </div>

                <div class="bulk-actions" id="bulkActions" style="display: none;">
                    <select id="bulkActionSelect">
                        <option value="">Bulk Actions</option>
                        <option value="publish">Publish</option>
                        <option value="draft">Move to Draft</option>
                        <option value="delete">Delete</option>
                    </select>
                    <button class="btn btn-secondary" id="applyBulkAction">Apply</button>
                </div>

                <div class="posts-table">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th class="select-column">
                                    <input type="checkbox" id="selectAll">
                                </th>
                                <th class="sortable" data-sort="title">Title</th>
                                <th class="sortable" data-sort="author">Author</th>
                                <th class="sortable" data-sort="category">Category</th>
                                <th class="sortable" data-sort="status">Status</th>
                                <th class="sortable" data-sort="created_at">Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${posts.map(post => this.renderPostRow(post)).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="pagination-container">
                    ${this.renderPagination()}
                </div>
            `;
        } catch (error) {
            return `<div class="error">Error loading posts: ${error.message}</div>`;
        }
    }

    renderPostRow(post) {
        return `
            <tr data-post-id="${post.id}">
                <td>
                    <input type="checkbox" class="select-item" value="${post.id}">
                </td>
                <td>
                    <div class="post-title">
                        <a href="/blog/${post.slug}" target="_blank">${post.title}</a>
                        ${post.featured ? '<span class="badge featured">Featured</span>' : ''}
                    </div>
                </td>
                <td>${post.author}</td>
                <td>
                    <span class="category-tag">${post.category}</span>
                </td>
                <td>
                    <span class="status-badge ${post.status}">${post.status}</span>
                </td>
                <td>
                    <div class="date-info">
                        <div>${post.formatted_date}</div>
                        <small>${post.time_ago}</small>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="blogAdmin.editPost('${post.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="blogAdmin.duplicatePost('${post.id}')">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="blogAdmin.deletePost('${post.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    async loadCommentsView() {
        try {
            const comments = await this.fetchComments();
            
            return `
                <div class="view-header">
                    <h2>Comments</h2>
                    <div class="view-actions">
                        <select id="commentStatusFilter" class="filter-select">
                            <option value="">All Comments</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="spam">Spam</option>
                        </select>
                    </div>
                </div>

                <div class="comments-list">
                    ${comments.map(comment => this.renderCommentItem(comment)).join('')}
                </div>
            `;
        } catch (error) {
            return `<div class="error">Error loading comments: ${error.message}</div>`;
        }
    }

    renderCommentItem(comment) {
        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="${comment.avatar}" alt="${comment.name}" class="avatar">
                        <div class="author-info">
                            <strong>${comment.name}</strong>
                            <span class="email">${comment.email}</span>
                        </div>
                    </div>
                    <div class="comment-meta">
                        <span class="status-badge ${comment.status}">${comment.status}</span>
                        <span class="date">${comment.formatted_date}</span>
                    </div>
                </div>
                <div class="comment-content">
                    <p>${comment.message}</p>
                    <div class="comment-post">
                        On: <a href="/blog/${comment.post_slug}">${comment.post_title}</a>
                    </div>
                </div>
                <div class="comment-actions">
                    <button class="btn btn-sm btn-success" onclick="blogAdmin.approveComment('${comment.id}')">
                        Approve
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="blogAdmin.markSpam('${comment.id}')">
                        Spam
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="blogAdmin.deleteComment('${comment.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    bindViewEvents(view) {
        switch (view) {
            case 'posts':
                this.bindPostsEvents();
                break;
            case 'comments':
                this.bindCommentsEvents();
                break;
            case 'categories':
                this.bindCategoriesEvents();
                break;
        }
    }

    bindPostsEvents() {
        // Sort headers
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const sortBy = header.dataset.sort;
                this.toggleSort(sortBy);
            });
        });

        // Select all checkbox
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Bulk actions
        const applyBulkAction = document.getElementById('applyBulkAction');
        if (applyBulkAction) {
            applyBulkAction.addEventListener('click', () => this.applyBulkAction());
        }

        // Filters
        document.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', () => this.applyFilters());
        });
    }

    async fetchPosts() {
        const params = new URLSearchParams({
            page: this.currentPage,
            limit: this.itemsPerPage,
            sort: this.sortBy,
            order: this.sortOrder,
            ...this.filters
        });

        const response = await fetch(`${this.apiEndpoint}/posts?${params}`);
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        return data.posts;
    }

    async fetchComments() {
        const response = await fetch(`${this.apiEndpoint}/comments?status=pending&limit=50`);
        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }

        const data = await response.json();
        return data.comments;
    }

    async createNewPost() {
        const postData = {
            title: 'New Post',
            content: '',
            status: 'draft',
            author_id: this.currentUser.id
        };

        try {
            const response = await fetch(`${this.apiEndpoint}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            if (!response.ok) {
                throw new Error('Failed to create post');
            }

            const result = await response.json();
            this.editPost(result.post.id);

        } catch (error) {
            this.showError('Failed to create new post: ' + error.message);
        }
    }

    async editPost(postId) {
        // Load post editor
        window.location.href = `/admin/edit-post.html?id=${postId}`;
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/posts/${postId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete post');
            }

            // Remove from UI
            const row = document.querySelector(`tr[data-post-id="${postId}"]`);
            if (row) {
                row.remove();
            }

            this.showSuccess('Post deleted successfully');

        } catch (error) {
            this.showError('Failed to delete post: ' + error.message);
        }
    }

    async duplicatePost(postId) {
        try {
            const response = await fetch(`${this.apiEndpoint}/posts/${postId}/duplicate`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to duplicate post');
            }

            const result = await response.json();
            this.showSuccess('Post duplicated successfully');
            this.switchView('posts'); // Reload posts view

        } catch (error) {
            this.showError('Failed to duplicate post: ' + error.message);
        }
    }

    async approveComment(commentId) {
        await this.updateCommentStatus(commentId, 'approved');
    }

    async markSpam(commentId) {
        await this.updateCommentStatus(commentId, 'spam');
    }

    async deleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/comments/${commentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete comment');
            }

            const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentItem) {
                commentItem.remove();
            }

            this.showSuccess('Comment deleted successfully');

        } catch (error) {
            this.showError('Failed to delete comment: ' + error.message);
        }
    }

    async updateCommentStatus(commentId, status) {
        try {
            const response = await fetch(`${this.apiEndpoint}/comments/${commentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error('Failed to update comment');
            }

            // Update UI
            const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentItem) {
                const statusBadge = commentItem.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.className = `status-badge ${status}`;
                    statusBadge.textContent = status;
                }
            }

            this.showSuccess(`Comment ${status} successfully`);

        } catch (error) {
            this.showError('Failed to update comment: ' + error.message);
        }
    }

    handleItemSelection(checkbox) {
        const itemId = checkbox.value;
        
        if (checkbox.checked) {
            this.selectedItems.add(itemId);
        } else {
            this.selectedItems.delete(itemId);
        }

        this.updateBulkActionsVisibility();
    }

    updateBulkActionsVisibility() {
        const bulkActions = document.getElementById('bulkActions');
        if (bulkActions) {
            bulkActions.style.display = this.selectedItems.size > 0 ? 'block' : 'none';
        }
    }

    toggleSelectAll(checked) {
        const itemCheckboxes = document.querySelectorAll('.select-item');
        itemCheckboxes.forEach(checkbox => {
            checkbox.checked = checked;
            this.handleItemSelection(checkbox);
        });
    }

    async applyBulkAction() {
        const action = document.getElementById('bulkActionSelect').value;
        if (!action || this.selectedItems.size === 0) {
            return;
        }

        if (!confirm(`Are you sure you want to ${action} ${this.selectedItems.size} items?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/posts/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: action,
                    ids: Array.from(this.selectedItems)
                })
            });

            if (!response.ok) {
                throw new Error('Bulk action failed');
            }

            this.showSuccess(`Bulk ${action} completed successfully`);
            this.switchView(this.currentView); // Reload current view

        } catch (error) {
            this.showError('Bulk action failed: ' + error.message);
        }
    }

    initializeEditor() {
        // Initialize rich text editor (e.g., TinyMCE, Quill)
        // This would be implemented based on your chosen editor
    }

    initializeDragDrop() {
        // Initialize drag and drop for file uploads
        // Implementation would depend on your file upload strategy
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.createNewPost();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveCurrentPost();
                        break;
                }
            }
        });
    }

    async loadPendingCommentsCount() {
        try {
            const response = await fetch(`${this.apiEndpoint}/comments/count?status=pending`);
            if (response.ok) {
                const data = await response.json();
                const badge = document.getElementById('pendingCommentsCount');
                if (badge) {
                    badge.textContent = data.count;
                    badge.style.display = data.count > 0 ? 'inline' : 'none';
                }
            }
        } catch (error) {
            console.error('Error loading pending comments count:', error);
        }
    }

    performSearch(query) {
        this.filters.search = query;
        this.currentPage = 1;
        this.switchView(this.currentView);
    }

    applyFilters() {
        // Collect filter values
        const statusFilter = document.getElementById('statusFilter');
        const categoryFilter = document.getElementById('categoryFilter');

        if (statusFilter) this.filters.status = statusFilter.value;
        if (categoryFilter) this.filters.category = categoryFilter.value;

        this.currentPage = 1;
        this.switchView(this.currentView);
    }

    toggleSort(sortBy) {
        if (this.sortBy === sortBy) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = sortBy;
            this.sortOrder = 'desc';
        }

        this.switchView(this.currentView);
    }

    async autoSave(element) {
        // Implement auto-save functionality
        this.showAutoSaveStatus('Saving...');
        
        try {
            // Save logic here
            this.showAutoSaveStatus('Saved');
        } catch (error) {
            this.showAutoSaveStatus('Error saving');
        }
    }

    showAutoSaveStatus(message) {
        const status = document.getElementById('autoSaveStatus');
        if (status) {
            status.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Close button
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/admin/login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize blog admin
document.addEventListener('DOMContentLoaded', () => {
    window.blogAdmin = new BlogAdmin();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogAdmin;
}
