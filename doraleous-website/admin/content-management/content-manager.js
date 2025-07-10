/* ===================================
   CONTENT MANAGEMENT SYSTEM
   File: admin/content-management/content-manager.js
   =================================== */

class ContentManager {
    constructor() {
        this.currentContent = null;
        this.contentType = null;
        this.isEditing = false;
        this.unsavedChanges = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadContentList();
        this.setupAutoSave();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.content-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const contentType = e.target.dataset.contentType;
                this.switchContentType(contentType);
            });
        });

        // Content actions
        document.getElementById('add-content-btn')?.addEventListener('click', () => this.addNewContent());
        document.getElementById('save-content-btn')?.addEventListener('click', () => this.saveContent());
        document.getElementById('delete-content-btn')?.addEventListener('click', () => this.deleteContent());
        document.getElementById('publish-content-btn')?.addEventListener('click', () => this.publishContent());
        document.getElementById('preview-content-btn')?.addEventListener('click', () => this.previewContent());

        // Search and filter
        document.getElementById('content-search')?.addEventListener('input', (e) => this.searchContent(e.target.value));
        document.getElementById('content-filter')?.addEventListener('change', (e) => this.filterContent(e.target.value));

        // Bulk actions
        document.getElementById('bulk-action-btn')?.addEventListener('click', () => this.executeBulkAction());
        document.getElementById('select-all-content')?.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));

        // Form change detection
        document.addEventListener('input', (e) => {
            if (e.target.closest('.content-form')) {
                this.markUnsavedChanges();
            }
        });

        // Prevent accidental navigation
        window.addEventListener('beforeunload', (e) => {
            if (this.unsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    switchContentType(contentType) {
        this.contentType = contentType;
        this.updateNavigation(contentType);
        this.loadContentList();
        this.showContentType(contentType);
    }

    updateNavigation(activeType) {
        document.querySelectorAll('.content-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.contentType === activeType);
        });
    }

    showContentType(contentType) {
        // Hide all content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show selected content section
        const activeSection = document.getElementById(`${contentType}-section`);
        if (activeSection) {
            activeSection.style.display = 'block';
        }

        // Update page title
        document.getElementById('content-title').textContent = this.getContentTypeTitle(contentType);
    }

    getContentTypeTitle(contentType) {
        const titles = {
            'books': 'Books Management',
            'blog': 'Blog Posts',
            'reviews': 'Reviews',
            'pages': 'Pages',
            'media': 'Media Library'
        };
        return titles[contentType] || 'Content Management';
    }

    async loadContentList() {
        if (!this.contentType) return;

        const contentList = document.getElementById('content-list');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        // Show loading
        loadingSpinner.style.display = 'block';
        contentList.innerHTML = '';

        try {
            const response = await fetch(`/api/admin/content/${this.contentType}`);
            const data = await response.json();

            if (response.ok) {
                this.renderContentList(data.items);
                this.updateContentStats(data.stats);
            } else {
                throw new Error(data.message || 'Failed to load content');
            }
        } catch (error) {
            console.error('Error loading content:', error);
            this.showError('Failed to load content. Please try again.');
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    renderContentList(items) {
        const contentList = document.getElementById('content-list');
        
        if (items.length === 0) {
            contentList.innerHTML = '<div class="no-content">No content found. <button onclick="contentManager.addNewContent()">Add New</button></div>';
            return;
        }

        const html = items.map(item => this.renderContentItem(item)).join('');
        contentList.innerHTML = html;

        // Attach event listeners
        this.attachItemListeners();
    }

    renderContentItem(item) {
        const statusClass = item.published ? 'published' : 'draft';
        const statusText = item.published ? 'Published' : 'Draft';
        
        return `
            <div class="content-item" data-id="${item.id}">
                <div class="content-item-checkbox">
                    <input type="checkbox" value="${item.id}" class="content-checkbox">
                </div>
                <div class="content-item-info">
                    <h3 class="content-title">${item.title}</h3>
                    <p class="content-meta">
                        <span class="content-author">By ${item.author}</span>
                        <span class="content-date">${this.formatDate(item.updatedAt)}</span>
                        <span class="content-status ${statusClass}">${statusText}</span>
                    </p>
                    ${item.excerpt ? `<p class="content-excerpt">${item.excerpt}</p>` : ''}
                </div>
                <div class="content-item-actions">
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${item.id}">Edit</button>
                    <button class="btn btn-sm btn-secondary duplicate-btn" data-id="${item.id}">Duplicate</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">Delete</button>
                    ${item.published ? `<button class="btn btn-sm btn-outline view-btn" data-id="${item.id}">View</button>` : ''}
                </div>
            </div>
        `;
    }

    attachItemListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.editContent(id);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.deleteContent(id);
            });
        });

        // Duplicate buttons
        document.querySelectorAll('.duplicate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.duplicateContent(id);
            });
        });

        // View buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.viewContent(id);
            });
        });

        // Checkbox listeners
        document.querySelectorAll('.content-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateBulkActions());
        });
    }

    async editContent(id) {
        if (this.unsavedChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to continue?')) {
                return;
            }
        }

        try {
            const response = await fetch(`/api/admin/content/${this.contentType}/${id}`);
            const data = await response.json();

            if (response.ok) {
                this.currentContent = data;
                this.isEditing = true;
                this.showContentEditor(data);
            } else {
                throw new Error(data.message || 'Failed to load content');
            }
        } catch (error) {
            console.error('Error loading content:', error);
            this.showError('Failed to load content for editing.');
        }
    }

    showContentEditor(content) {
        const editor = document.getElementById('content-editor');
        const listView = document.getElementById('content-list-view');
        
        // Hide list view, show editor
        listView.style.display = 'none';
        editor.style.display = 'block';

        // Populate form
        this.populateForm(content);

        // Update editor title
        document.getElementById('editor-title').textContent = content.id ? 'Edit Content' : 'New Content';

        // Reset unsaved changes flag
        this.unsavedChanges = false;
    }

    populateForm(content) {
        const form = document.getElementById('content-form');
        
        // Clear form first
        form.reset();

        // Populate fields based on content type
        if (this.contentType === 'books') {
            this.populateBookForm(content);
        } else if (this.contentType === 'blog') {
            this.populateBlogForm(content);
        } else if (this.contentType === 'reviews') {
            this.populateReviewForm(content);
        } else if (this.contentType === 'pages') {
            this.populatePageForm(content);
        }

        // Common fields
        if (content.id) {
            form.querySelector('#content-id').value = content.id;
        }
        form.querySelector('#content-title').value = content.title || '';
        form.querySelector('#content-slug').value = content.slug || '';
        form.querySelector('#content-status').value = content.published ? 'published' : 'draft';
        
        // Meta fields
        form.querySelector('#content-meta-title').value = content.metaTitle || '';
        form.querySelector('#content-meta-description').value = content.metaDescription || '';
        form.querySelector('#content-meta-keywords').value = content.metaKeywords || '';
    }

    populateBookForm(content) {
        const form = document.getElementById('content-form');
        
        form.querySelector('#book-author').value = content.author || '';
        form.querySelector('#book-isbn').value = content.isbn || '';
        form.querySelector('#book-genre').value = content.genre || '';
        form.querySelector('#book-pages').value = content.pages || '';
        form.querySelector('#book-price').value = content.price || '';
        form.querySelector('#book-description').value = content.description || '';
        form.querySelector('#book-excerpt').value = content.excerpt || '';
        form.querySelector('#book-cover-url').value = content.coverUrl || '';
        form.querySelector('#book-published-date').value = content.publishedDate || '';
        
        // Tags
        if (content.tags) {
            form.querySelector('#book-tags').value = content.tags.join(', ');
        }
    }

    populateBlogForm(content) {
        const form = document.getElementById('content-form');
        
        form.querySelector('#blog-author').value = content.author || '';
        form.querySelector('#blog-excerpt').value = content.excerpt || '';
        form.querySelector('#blog-content').value = content.content || '';
        form.querySelector('#blog-featured-image').value = content.featuredImage || '';
        form.querySelector('#blog-category').value = content.category || '';
        
        // Tags
        if (content.tags) {
            form.querySelector('#blog-tags').value = content.tags.join(', ');
        }
    }

    addNewContent() {
        const newContent = {
            id: null,
            title: '',
            slug: '',
            published: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.currentContent = newContent;
        this.isEditing = false;
        this.showContentEditor(newContent);
    }

    async saveContent() {
        const form = document.getElementById('content-form');
        const formData = new FormData(form);
        
        // Validate form
        if (!this.validateForm(form)) {
            return;
        }

        // Prepare data
        const contentData = this.prepareContentData(formData);

        try {
            const method = this.currentContent.id ? 'PUT' : 'POST';
            const url = this.currentContent.id ? 
                `/api/admin/content/${this.contentType}/${this.currentContent.id}` :
                `/api/admin/content/${this.contentType}`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contentData)
            });

            const data = await response.json();

            if (response.ok) {
                this.currentContent = data;
                this.unsavedChanges = false;
                this.showSuccess('Content saved successfully!');
                this.loadContentList();
            } else {
                throw new Error(data.message || 'Failed to save content');
            }
        } catch (error) {
            console.error('Error saving content:', error);
            this.showError('Failed to save content. Please try again.');
        }
    }

    prepareContentData(formData) {
        const data = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Convert tags to array
        if (data.tags) {
            data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }

        // Convert status to boolean
        data.published = data.status === 'published';

        // Add timestamps
        data.updatedAt = new Date().toISOString();
        if (!this.currentContent.id) {
            data.createdAt = new Date().toISOString();
        }

        return data;
    }

    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    async deleteContent(id) {
        if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/content/${this.contentType}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showSuccess('Content deleted successfully!');
                this.loadContentList();
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete content');
            }
        } catch (error) {
            console.error('Error deleting content:', error);
            this.showError('Failed to delete content. Please try again.');
        }
    }

    async duplicateContent(id) {
        try {
            const response = await fetch(`/api/admin/content/${this.contentType}/${id}/duplicate`, {
                method: 'POST'
            });

            if (response.ok) {
                this.showSuccess('Content duplicated successfully!');
                this.loadContentList();
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to duplicate content');
            }
        } catch (error) {
            console.error('Error duplicating content:', error);
            this.showError('Failed to duplicate content. Please try again.');
        }
    }

    publishContent() {
        if (!this.currentContent.id) {
            this.showError('Please save the content first before publishing.');
            return;
        }

        // Update form status
        document.getElementById('content-status').value = 'published';
        
        // Save with published status
        this.saveContent();
    }

    previewContent() {
        if (!this.currentContent.id) {
            this.showError('Please save the content first before previewing.');
            return;
        }

        // Open preview in new tab
        const previewUrl = `/preview/${this.contentType}/${this.currentContent.id}`;
        window.open(previewUrl, '_blank');
    }

    viewContent(id) {
        // Open published content in new tab
        const viewUrl = `/${this.contentType}/${id}`;
        window.open(viewUrl, '_blank');
    }

    searchContent(query) {
        const items = document.querySelectorAll('.content-item');
        
        items.forEach(item => {
            const title = item.querySelector('.content-title').textContent.toLowerCase();
            const excerpt = item.querySelector('.content-excerpt')?.textContent.toLowerCase() || '';
            const author = item.querySelector('.content-author').textContent.toLowerCase();
            
            const matches = title.includes(query.toLowerCase()) || 
                          excerpt.includes(query.toLowerCase()) || 
                          author.includes(query.toLowerCase());
            
            item.style.display = matches ? 'block' : 'none';
        });
    }

    filterContent(filter) {
        const items = document.querySelectorAll('.content-item');
        
        items.forEach(item => {
            const status = item.querySelector('.content-status').classList.contains('published') ? 'published' : 'draft';
            
            if (filter === 'all' || filter === status) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.content-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateBulkActions();
    }

    updateBulkActions() {
        const selectedItems = document.querySelectorAll('.content-checkbox:checked');
        const bulkActions = document.getElementById('bulk-actions');
        
        if (selectedItems.length > 0) {
            bulkActions.style.display = 'block';
            document.getElementById('selected-count').textContent = selectedItems.length;
        } else {
            bulkActions.style.display = 'none';
        }
    }

    async executeBulkAction() {
        const selectedItems = Array.from(document.querySelectorAll('.content-checkbox:checked'));
        const action = document.getElementById('bulk-action-select').value;
        
        if (selectedItems.length === 0) {
            this.showError('Please select items to perform bulk action.');
            return;
        }

        if (!action) {
            this.showError('Please select an action.');
            return;
        }

        if (!confirm(`Are you sure you want to ${action} ${selectedItems.length} items?`)) {
            return;
        }

        const ids = selectedItems.map(item => item.value);

        try {
            const response = await fetch(`/api/admin/content/${this.contentType}/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, ids })
            });

            if (response.ok) {
                this.showSuccess(`Bulk action completed successfully!`);
                this.loadContentList();
                this.updateBulkActions();
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to execute bulk action');
            }
        } catch (error) {
            console.error('Error executing bulk action:', error);
            this.showError('Failed to execute bulk action. Please try again.');
        }
    }

    markUnsavedChanges() {
        this.unsavedChanges = true;
        document.getElementById('save-indicator').style.display = 'inline';
    }

    setupAutoSave() {
        setInterval(() => {
            if (this.unsavedChanges && this.currentContent) {
                this.autoSave();
            }
        }, 30000); // Auto-save every 30 seconds
    }

    async autoSave() {
        if (!this.currentContent.id) return; // Don't auto-save new content

        const form = document.getElementById('content-form');
        const formData = new FormData(form);
        const contentData = this.prepareContentData(formData);

        try {
            const response = await fetch(`/api/admin/content/${this.contentType}/${this.currentContent.id}/autosave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contentData)
            });

            if (response.ok) {
                document.getElementById('autosave-indicator').style.display = 'inline';
                setTimeout(() => {
                    document.getElementById('autosave-indicator').style.display = 'none';
                }, 2000);
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    updateContentStats(stats) {
        document.getElementById('total-content').textContent = stats.total || 0;
        document.getElementById('published-content').textContent = stats.published || 0;
        document.getElementById('draft-content').textContent = stats.draft || 0;
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
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
}

// Initialize content manager
const contentManager = new ContentManager();

// Export for global use
window.ContentManager = contentManager;
