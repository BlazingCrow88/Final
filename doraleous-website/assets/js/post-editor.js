/* ===================================
   POST EDITOR
   File: assets/js/post-editor.js
   =================================== */

class PostEditor {
    constructor(options = {}) {
        this.postId = options.postId || this.getPostIdFromUrl();
        this.apiEndpoint = options.apiEndpoint || '/api/blog/posts';
        this.mediaEndpoint = options.mediaEndpoint || '/api/media';
        this.autoSaveInterval = options.autoSaveInterval || 30000; // 30 seconds
        this.enableAutoSave = options.enableAutoSave !== false;
        this.enablePreview = options.enablePreview !== false;
        this.enableWordCount = options.enableWordCount !== false;
        
        this.editor = null;
        this.currentPost = null;
        this.lastSavedContent = '';
        this.autoSaveTimer = null;
        this.unsavedChanges = false;
        this.isFullscreen = false;
        this.editMode = 'visual'; // 'visual' or 'markdown'
        this.wordCount = 0;
        this.readingTime = 0;
        
        this.init();
    }

    async init() {
        await this.setupEditor();
        await this.loadPost();
        this.bindEvents();
        this.setupAutoSave();
        this.setupKeyboardShortcuts();
        this.updateInterface();
    }

    setupEditor() {
        const editorContainer = document.getElementById('postContent');
        if (!editorContainer) {
            throw new Error('Editor container not found');
        }

        // Initialize TinyMCE or similar rich text editor
        return new Promise((resolve) => {
            if (typeof tinymce !== 'undefined') {
                tinymce.init({
                    selector: '#postContent',
                    height: 500,
                    menubar: false,
                    plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                        'bold italic backcolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help | fullscreen | code',
                    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 16px; }',
                    setup: (editor) => {
                        this.editor = editor;
                        editor.on('change keyup', () => {
                            this.markUnsaved();
                            this.updateWordCount();
                        });
                        editor.on('init', resolve);
                    },
                    image_upload_handler: (blobInfo, success, failure) => {
                        this.uploadImage(blobInfo, success, failure);
                    }
                });
            } else {
                // Fallback to plain textarea
                this.setupFallbackEditor();
                resolve();
            }
        });
    }

    setupFallbackEditor() {
        const textarea = document.getElementById('postContent');
        if (textarea) {
            textarea.addEventListener('input', () => {
                this.markUnsaved();
                this.updateWordCount();
            });
            
            // Add basic formatting toolbar
            this.createFallbackToolbar(textarea);
        }
    }

    createFallbackToolbar(textarea) {
        const toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';
        toolbar.innerHTML = `
            <button type="button" class="toolbar-btn" data-action="bold">
                <i class="fas fa-bold"></i>
            </button>
            <button type="button" class="toolbar-btn" data-action="italic">
                <i class="fas fa-italic"></i>
            </button>
            <button type="button" class="toolbar-btn" data-action="link">
                <i class="fas fa-link"></i>
            </button>
            <button type="button" class="toolbar-btn" data-action="image">
                <i class="fas fa-image"></i>
            </button>
            <button type="button" class="toolbar-btn" data-action="fullscreen">
                <i class="fas fa-expand"></i>
            </button>
        `;

        textarea.parentNode.insertBefore(toolbar, textarea);

        // Bind toolbar events
        toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('.toolbar-btn');
            if (btn) {
                e.preventDefault();
                this.handleToolbarAction(btn.dataset.action, textarea);
            }
        });
    }

    handleToolbarAction(action, textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        switch (action) {
            case 'bold':
                this.wrapText(textarea, '**', '**', selectedText || 'bold text');
                break;
            case 'italic':
                this.wrapText(textarea, '*', '*', selectedText || 'italic text');
                break;
            case 'link':
                const url = prompt('Enter URL:');
                if (url) {
                    this.wrapText(textarea, `[${selectedText || 'link text'}](`, ')', url);
                }
                break;
            case 'image':
                this.openImageDialog();
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
        }
    }

    wrapText(textarea, prefix, suffix, defaultText) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end) || defaultText;
        
        const newText = prefix + selectedText + suffix;
        const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        
        textarea.value = newValue;
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
        
        this.markUnsaved();
    }

    bindEvents() {
        // Form submission
        const saveBtn = document.getElementById('savePost');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePost());
        }

        const publishBtn = document.getElementById('publishPost');
        if (publishBtn) {
            publishBtn.addEventListener('click', () => this.publishPost());
        }

        const previewBtn = document.getElementById('previewPost');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewPost());
        }

        // Meta fields
        const titleField = document.getElementById('postTitle');
        if (titleField) {
            titleField.addEventListener('input', () => {
                this.markUnsaved();
                this.generateSlug();
            });
        }

        const slugField = document.getElementById('postSlug');
        if (slugField) {
            slugField.addEventListener('input', () => this.markUnsaved());
        }

        // Category and tags
        const categorySelect = document.getElementById('postCategory');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => this.markUnsaved());
        }

        const tagsInput = document.getElementById('postTags');
        if (tagsInput) {
            this.setupTagsInput(tagsInput);
        }

        // Featured image
        const featuredImageBtn = document.getElementById('setFeaturedImage');
        if (featuredImageBtn) {
            featuredImageBtn.addEventListener('click', () => this.openMediaLibrary());
        }

        // SEO fields
        const metaFields = document.querySelectorAll('.meta-field');
        metaFields.forEach(field => {
            field.addEventListener('input', () => this.markUnsaved());
        });

        // Before unload warning
        window.addEventListener('beforeunload', (e) => {
            if (this.unsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });

        // Editor mode toggle
        const modeToggle = document.getElementById('editorModeToggle');
        if (modeToggle) {
            modeToggle.addEventListener('click', () => this.toggleEditorMode());
        }
    }

    setupTagsInput(input) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';
        input.parentNode.insertBefore(tagsContainer, input);

        let tags = [];

        const updateTags = () => {
            tagsContainer.innerHTML = tags.map(tag => `
                <span class="tag-item">
                    ${tag}
                    <button type="button" class="remove-tag" data-tag="${tag}">×</button>
                </span>
            `).join('') + `<input type="text" class="tag-input" placeholder="Add tag...">`;

            const tagInput = tagsContainer.querySelector('.tag-input');
            tagInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const value = tagInput.value.trim();
                    if (value && !tags.includes(value)) {
                        tags.push(value);
                        input.value = tags.join(', ');
                        updateTags();
                        this.markUnsaved();
                    }
                }
            });

            // Remove tag buttons
            tagsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-tag')) {
                    const tagToRemove = e.target.dataset.tag;
                    tags = tags.filter(tag => tag !== tagToRemove);
                    input.value = tags.join(', ');
                    updateTags();
                    this.markUnsaved();
                }
            });
        };

        // Initialize with existing tags
        if (input.value) {
            tags = input.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        }

        updateTags();
        input.style.display = 'none';
    }

    setupAutoSave() {
        if (!this.enableAutoSave) return;

        this.autoSaveTimer = setInterval(() => {
            if (this.unsavedChanges && this.currentPost) {
                this.autoSave();
            }
        }, this.autoSaveInterval);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.savePost();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        this.publishPost();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.previewPost();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.toggleFullscreen();
                        break;
                }
            }
        });
    }

    async loadPost() {
        if (!this.postId) {
            // Creating new post
            this.currentPost = {
                title: '',
                slug: '',
                content: '',
                excerpt: '',
                status: 'draft',
                category: '',
                tags: '',
                featured_image: '',
                meta_title: '',
                meta_description: '',
                featured: false
            };
            return;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/${this.postId}`);
            if (!response.ok) {
                throw new Error('Failed to load post');
            }

            this.currentPost = await response.json();
            this.populateForm();
            this.lastSavedContent = this.getFormData();

        } catch (error) {
            console.error('Error loading post:', error);
            this.showError('Failed to load post: ' + error.message);
        }
    }

    populateForm() {
        const fields = [
            'title', 'slug', 'content', 'excerpt', 'category', 
            'tags', 'meta_title', 'meta_description'
        ];

        fields.forEach(field => {
            const element = document.getElementById(`post${field.charAt(0).toUpperCase() + field.slice(1)}`);
            if (element) {
                element.value = this.currentPost[field] || '';
            }
        });

        // Set editor content
        if (this.editor) {
            this.editor.setContent(this.currentPost.content || '');
        }

        // Featured image
        this.updateFeaturedImage(this.currentPost.featured_image);

        // Status
        const statusSelect = document.getElementById('postStatus');
        if (statusSelect) {
            statusSelect.value = this.currentPost.status;
        }

        // Featured checkbox
        const featuredCheck = document.getElementById('postFeatured');
        if (featuredCheck) {
            featuredCheck.checked = this.currentPost.featured;
        }

        this.updateWordCount();
        this.updateInterface();
    }

    getFormData() {
        const formData = {
            title: document.getElementById('postTitle')?.value || '',
            slug: document.getElementById('postSlug')?.value || '',
            content: this.editor ? this.editor.getContent() : document.getElementById('postContent')?.value || '',
            excerpt: document.getElementById('postExcerpt')?.value || '',
            category: document.getElementById('postCategory')?.value || '',
            tags: document.getElementById('postTags')?.value || '',
            status: document.getElementById('postStatus')?.value || 'draft',
            featured_image: this.currentPost?.featured_image || '',
            meta_title: document.getElementById('postMetaTitle')?.value || '',
            meta_description: document.getElementById('postMetaDescription')?.value || '',
            featured: document.getElementById('postFeatured')?.checked || false
        };

        return formData;
    }

    async savePost() {
        const formData = this.getFormData();
        
        try {
            this.showSaving();
            
            const url = this.postId ? 
                `${this.apiEndpoint}/${this.postId}` : 
                this.apiEndpoint;
            
            const method = this.postId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to save post');
            }

            const result = await response.json();
            
            if (!this.postId) {
                this.postId = result.id;
                // Update URL without page reload
                history.replaceState(null, '', `?id=${this.postId}`);
            }

            this.currentPost = { ...this.currentPost, ...formData };
            this.lastSavedContent = JSON.stringify(formData);
            this.markSaved();
            this.showSuccess('Post saved successfully');

        } catch (error) {
            console.error('Error saving post:', error);
            this.showError('Failed to save post: ' + error.message);
        }
    }

    async publishPost() {
        const formData = this.getFormData();
        formData.status = 'published';

        if (!formData.title.trim()) {
            this.showError('Please enter a title before publishing');
            return;
        }

        if (!formData.content.trim()) {
            this.showError('Please enter content before publishing');
            return;
        }

        try {
            await this.savePost();
            
            // Update status in form
            const statusSelect = document.getElementById('postStatus');
            if (statusSelect) {
                statusSelect.value = 'published';
            }

            this.showSuccess('Post published successfully!');

        } catch (error) {
            this.showError('Failed to publish post: ' + error.message);
        }
    }

    async autoSave() {
        const formData = this.getFormData();
        const currentContent = JSON.stringify(formData);

        if (currentContent === this.lastSavedContent) {
            return; // No changes to save
        }

        try {
            const url = this.postId ? 
                `${this.apiEndpoint}/${this.postId}` : 
                this.apiEndpoint;
            
            const method = this.postId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...formData, auto_save: true })
            });

            if (response.ok) {
                const result = await response.json();
                
                if (!this.postId) {
                    this.postId = result.id;
                    history.replaceState(null, '', `?id=${this.postId}`);
                }

                this.lastSavedContent = currentContent;
                this.showAutoSaved();
            }

        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    previewPost() {
        const formData = this.getFormData();
        
        // Open preview in new window/tab
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(`
            <html>
                <head>
                    <title>Preview: ${formData.title}</title>
                    <link rel="stylesheet" href="/styles.css">
                    <style>
                        body { max-width: 800px; margin: 0 auto; padding: 20px; }
                        .preview-header { background: #f0f0f0; padding: 10px; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="preview-header">
                        <strong>Preview Mode</strong> - Changes are not saved
                    </div>
                    <article>
                        <h1>${formData.title}</h1>
                        <div class="post-meta">
                            Category: ${formData.category} | Tags: ${formData.tags}
                        </div>
                        <div class="post-content">
                            ${formData.content}
                        </div>
                    </article>
                </body>
            </html>
        `);
    }

    generateSlug() {
        const title = document.getElementById('postTitle')?.value || '';
        const slug = title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
        
        const slugField = document.getElementById('postSlug');
        if (slugField && !slugField.value) {
            slugField.value = slug;
        }
    }

    updateWordCount() {
        if (!this.enableWordCount) return;

        const content = this.editor ? 
            this.editor.getContent({ format: 'text' }) : 
            document.getElementById('postContent')?.value || '';

        this.wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
        this.readingTime = Math.ceil(this.wordCount / 200); // Assume 200 WPM

        const wordCountElement = document.getElementById('wordCount');
        if (wordCountElement) {
            wordCountElement.innerHTML = `
                ${this.wordCount} words | 
                ${this.readingTime} min read
            `;
        }
    }

    toggleEditorMode() {
        this.editMode = this.editMode === 'visual' ? 'markdown' : 'visual';
        
        // Implementation would depend on having both editors available
        // This is a simplified version
        const modeToggle = document.getElementById('editorModeToggle');
        if (modeToggle) {
            modeToggle.textContent = this.editMode === 'visual' ? 'Markdown' : 'Visual';
        }
    }

    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        const editorContainer = document.querySelector('.editor-container');
        
        if (editorContainer) {
            editorContainer.classList.toggle('fullscreen', this.isFullscreen);
        }

        if (this.editor) {
            this.editor.execCommand('mceFullScreen');
        }
    }

    async uploadImage(blobInfo, success, failure) {
        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());

        try {
            const response = await fetch(this.mediaEndpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            success(result.url);

        } catch (error) {
            failure('Image upload failed: ' + error.message);
        }
    }

    openImageDialog() {
        // Create image upload dialog
        const dialog = document.createElement('div');
        dialog.className = 'image-dialog-overlay';
        dialog.innerHTML = `
            <div class="image-dialog">
                <div class="dialog-header">
                    <h3>Insert Image</h3>
                    <button class="close-dialog">&times;</button>
                </div>
                <div class="dialog-content">
                    <div class="upload-area" id="imageUploadArea">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Click or drag image here</p>
                        <input type="file" id="imageFileInput" accept="image/*" style="display: none;">
                    </div>
                    <div class="url-input">
                        <label>Or enter image URL:</label>
                        <input type="url" id="imageUrlInput" placeholder="https://example.com/image.jpg">
                    </div>
                </div>
                <div class="dialog-actions">
                    <button class="btn btn-secondary" id="cancelImageDialog">Cancel</button>
                    <button class="btn btn-primary" id="insertImageBtn">Insert</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Bind dialog events
        this.bindImageDialogEvents(dialog);
    }

    openMediaLibrary() {
        // Implementation for media library
        // This would show a modal with existing media files
        console.log('Opening media library...');
    }

    updateFeaturedImage(imageUrl) {
        const preview = document.getElementById('featuredImagePreview');
        const placeholder = document.getElementById('featuredImagePlaceholder');
        const removeBtn = document.getElementById('removeFeaturedImage');

        if (imageUrl) {
            if (preview) {
                preview.src = imageUrl;
                preview.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'block';
        } else {
            if (preview) preview.style.display = 'none';
            if (placeholder) placeholder.style.display = 'block';
            if (removeBtn) removeBtn.style.display = 'none';
        }
    }

    markUnsaved() {
        this.unsavedChanges = true;
        this.updateInterface();
    }

    markSaved() {
        this.unsavedChanges = false;
        this.updateInterface();
    }

    updateInterface() {
        const saveBtn = document.getElementById('savePost');
        const title = document.querySelector('.editor-title');

        if (saveBtn) {
            saveBtn.disabled = !this.unsavedChanges;
        }

        if (title && this.unsavedChanges) {
            title.textContent = title.textContent.replace('*', '') + '*';
        }
    }

    showSaving() {
        this.showStatus('Saving...', 'info');
    }

    showAutoSaved() {
        this.showStatus('Auto-saved', 'success', 2000);
    }

    showSuccess(message) {
        this.showStatus(message, 'success');
    }

    showError(message) {
        this.showStatus(message, 'error');
    }

    showStatus(message, type, duration = 5000) {
        const statusBar = document.getElementById('editorStatusBar');
        if (!statusBar) return;

        statusBar.className = `editor-status ${type}`;
        statusBar.textContent = message;
        statusBar.style.display = 'block';

        if (duration > 0) {
            setTimeout(() => {
                statusBar.style.display = 'none';
            }, duration);
        }
    }

    getPostIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    destroy() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        if (this.editor && typeof tinymce !== 'undefined') {
            tinymce.remove(this.editor);
        }
    }
}

// Initialize post editor
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('postContent')) {
        window.postEditor = new PostEditor();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PostEditor;
}
