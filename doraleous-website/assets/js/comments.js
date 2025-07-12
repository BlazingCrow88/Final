/* ===================================
   COMMENTS SYSTEM
   File: assets/js/comments.js
   =================================== */

class CommentsSystem {
    constructor(options = {}) {
        this.postId = options.postId || this.getPostIdFromUrl();
        this.apiEndpoint = options.apiEndpoint || '/api/comments';
        this.maxDepth = options.maxDepth || 3;
        this.commentsPerLoad = options.commentsPerLoad || 10;
        this.enableModeration = options.enableModeration !== false;
        this.enableVoting = options.enableVoting !== false;
        this.enableReplies = options.enableReplies !== false;
        this.enableEdit = options.enableEdit !== false;
        this.enableDelete = options.enableDelete !== false;
        this.autoApprove = options.autoApprove === true;
        this.currentPage = 1;
        this.totalComments = 0;
        this.loadedComments = new Set();
        this.editingComment = null;
        this.replyingTo = null;
        
        this.init();
    }

    init() {
        this.bindFormEvents();
        this.bindCommentEvents();
        this.loadComments();
        this.setupRealTimeUpdates();
    }

    bindFormEvents() {
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Character counter for comment textarea
        const commentTextarea = document.getElementById('commentMessage');
        if (commentTextarea) {
            this.setupCharacterCounter(commentTextarea);
            this.setupAutoResize(commentTextarea);
        }

        // Email notification toggle
        const notifyCheckbox = document.querySelector('input[name="notify"]');
        if (notifyCheckbox) {
            this.bindNotificationToggle(notifyCheckbox);
        }
    }

    bindCommentEvents() {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        // Event delegation for comment actions
        commentsList.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const commentId = this.getCommentId(button);
            const action = this.getButtonAction(button);

            switch (action) {
                case 'reply':
                    this.showReplyForm(commentId);
                    break;
                case 'like':
                    this.toggleLike(commentId);
                    break;
                case 'edit':
                    this.editComment(commentId);
                    break;
                case 'delete':
                    this.deleteComment(commentId);
                    break;
                case 'report':
                    this.reportComment(commentId);
                    break;
                case 'load-replies':
                    this.loadReplies(commentId);
                    break;
            }
        });

        // Load more comments button
        const loadMoreBtn = document.getElementById('loadMoreComments');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreComments());
        }
    }

    setupCharacterCounter(textarea) {
        const maxLength = 1000;
        const counter = document.createElement('div');
        counter.className = 'character-counter';
        counter.innerHTML = `<span class="current">0</span> / <span class="max">${maxLength}</span>`;
        
        textarea.parentNode.appendChild(counter);

        textarea.addEventListener('input', () => {
            const current = textarea.value.length;
            counter.querySelector('.current').textContent = current;
            
            if (current > maxLength * 0.9) {
                counter.classList.add('warning');
            } else {
                counter.classList.remove('warning');
            }
        });
    }

    setupAutoResize(textarea) {
        const resize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };

        textarea.addEventListener('input', resize);
        textarea.addEventListener('focus', resize);
        
        // Initial resize
        resize();
    }

    bindNotificationToggle(checkbox) {
        checkbox.addEventListener('change', (e) => {
            // Store preference
            localStorage.setItem('commentNotifications', e.target.checked);
        });

        // Load saved preference
        const saved = localStorage.getItem('commentNotifications');
        if (saved !== null) {
            checkbox.checked = saved === 'true';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);

        try {
            this.setLoadingState(submitBtn, true);
            
            // Validate form
            this.validateCommentForm(formData);

            // Prepare comment data
            const commentData = {
                postId: this.postId,
                parentId: this.replyingTo,
                name: formData.get('name'),
                email: formData.get('email'),
                website: formData.get('website') || null,
                message: formData.get('message'),
                notify: formData.get('notify') === '1',
                timestamp: new Date().toISOString()
            };

            // Submit comment
            const result = await this.submitComment(commentData);
            
            if (result.success) {
                this.handleSuccessfulSubmission(result, form);
            } else {
                throw new Error(result.message || 'Failed to submit comment');
            }

        } catch (error) {
            this.showError(form, error.message);
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    validateCommentForm(formData) {
        const name = formData.get('name')?.trim();
        const email = formData.get('email')?.trim();
        const message = formData.get('message')?.trim();

        if (!name) throw new Error('Name is required');
        if (!email) throw new Error('Email is required');
        if (!message) throw new Error('Message is required');
        
        if (!this.isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        if (message.length < 10) {
            throw new Error('Comment must be at least 10 characters long');
        }
        
        if (message.length > 1000) {
            throw new Error('Comment is too long (maximum 1000 characters)');
        }

        // Check for spam
        if (this.containsSpam(message)) {
            throw new Error('Comment appears to be spam');
        }
    }

    async submitComment(commentData) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    handleSuccessfulSubmission(result, form) {
        // Show success message
        if (this.autoApprove) {
            this.showSuccess(form, 'Comment posted successfully!');
            this.addCommentToDOM(result.comment);
        } else {
            this.showSuccess(form, 'Comment submitted and awaiting moderation.');
        }

        // Reset form
        form.reset();
        this.hideReplyForm();
        
        // Update comment count
        this.updateCommentCount(1);
        
        // Track comment submission
        this.trackEvent('comment_submitted', {
            postId: this.postId,
            hasReply: !!this.replyingTo
        });
    }

    async loadComments() {
        try {
            const response = await fetch(`${this.apiEndpoint}?postId=${this.postId}&page=${this.currentPage}&limit=${this.commentsPerLoad}`);
            
            if (!response.ok) {
                throw new Error('Failed to load comments');
            }

            const data = await response.json();
            this.totalComments = data.total;
            
            if (this.currentPage === 1) {
                this.renderComments(data.comments);
            } else {
                this.appendComments(data.comments);
            }

            this.updateLoadMoreButton(data);

        } catch (error) {
            console.error('Error loading comments:', error);
            this.showCommentsError('Failed to load comments');
        }
    }

    async loadMoreComments() {
        this.currentPage++;
        await this.loadComments();
    }

    renderComments(comments) {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => this.renderComment(comment)).join('');
        this.bindCommentInteractions();
    }

    appendComments(comments) {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        const commentsHTML = comments.map(comment => this.renderComment(comment)).join('');
        commentsList.insertAdjacentHTML('beforeend', commentsHTML);
        this.bindCommentInteractions();
    }

    renderComment(comment, depth = 0) {
        const isOwn = this.isOwnComment(comment);
        const canEdit = isOwn && this.enableEdit;
        const canDelete = isOwn && this.enableDelete;
        const canReply = this.enableReplies && depth < this.maxDepth;

        return `
            <article class="comment" data-comment-id="${comment.id}" data-depth="${depth}">
                <div class="comment-avatar">
                    <img src="${this.getAvatarUrl(comment.email)}" alt="${comment.name}" loading="lazy">
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <h4 class="comment-author">
                            ${comment.website ? `<a href="${comment.website}" target="_blank" rel="noopener">${comment.name}</a>` : comment.name}
                            ${comment.isAuthor ? '<span class="author-badge">Author</span>' : ''}
                        </h4>
                        <time datetime="${comment.createdAt}" class="comment-date" title="${comment.formattedDate}">
                            ${comment.timeAgo}
                        </time>
                        ${comment.status === 'pending' ? '<span class="comment-status pending">Pending Moderation</span>' : ''}
                        ${comment.edited ? '<span class="comment-edited" title="This comment has been edited">Edited</span>' : ''}
                    </div>
                    
                    <div class="comment-text" ${canEdit ? 'data-editable="true"' : ''}>
                        ${this.formatCommentText(comment.message)}
                    </div>
                    
                    <div class="comment-actions">
                        ${canReply ? `<button class="reply-btn" data-action="reply">Reply</button>` : ''}
                        ${this.enableVoting ? `
                            <button class="like-btn ${comment.userLiked ? 'liked' : ''}" data-action="like">
                                <i class="fas fa-heart"></i>
                                <span class="like-count">${comment.likes}</span>
                            </button>
                        ` : ''}
                        ${canEdit ? `<button class="edit-btn" data-action="edit">Edit</button>` : ''}
                        ${canDelete ? `<button class="delete-btn" data-action="delete">Delete</button>` : ''}
                        <button class="report-btn" data-action="report">Report</button>
                    </div>
                    
                    ${comment.replies && comment.replies.length > 0 ? `
                        <div class="comment-replies">
                            ${comment.replies.map(reply => this.renderComment(reply, depth + 1)).join('')}
                        </div>
                    ` : ''}
                    
                    ${comment.hasMoreReplies ? `
                        <button class="load-replies-btn" data-action="load-replies">
                            Load ${comment.remainingReplies} more replies
                        </button>
                    ` : ''}
                </div>
            </article>
        `;
    }

    addCommentToDOM(comment) {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        // Remove "no comments" message if present
        const noComments = commentsList.querySelector('.no-comments');
        if (noComments) {
            noComments.remove();
        }

        if (comment.parentId) {
            // Add as reply
            const parentComment = commentsList.querySelector(`[data-comment-id="${comment.parentId}"]`);
            if (parentComment) {
                let repliesContainer = parentComment.querySelector('.comment-replies');
                if (!repliesContainer) {
                    repliesContainer = document.createElement('div');
                    repliesContainer.className = 'comment-replies';
                    parentComment.querySelector('.comment-content').appendChild(repliesContainer);
                }
                
                const depth = parseInt(parentComment.dataset.depth) + 1;
                repliesContainer.insertAdjacentHTML('beforeend', this.renderComment(comment, depth));
            }
        } else {
            // Add as top-level comment
            commentsList.insertAdjacentHTML('afterbegin', this.renderComment(comment));
        }

        this.bindCommentInteractions();
    }

    showReplyForm(commentId) {
        // Hide any existing reply forms
        this.hideReplyForm();
        
        this.replyingTo = commentId;
        const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!comment) return;

        const replyForm = this.createReplyForm();
        comment.querySelector('.comment-content').appendChild(replyForm);
        
        // Focus on textarea
        const textarea = replyForm.querySelector('textarea');
        if (textarea) {
            textarea.focus();
        }
    }

    createReplyForm() {
        const form = document.createElement('form');
        form.className = 'reply-form';
        form.innerHTML = `
            <div class="form-group">
                <textarea name="message" placeholder="Write your reply..." required rows="3"></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-sm">Post Reply</button>
                <button type="button" class="btn btn-secondary btn-sm cancel-reply">Cancel</button>
            </div>
        `;

        // Bind events
        form.addEventListener('submit', (e) => this.handleReplySubmit(e));
        form.querySelector('.cancel-reply').addEventListener('click', () => this.hideReplyForm());

        return form;
    }

    async handleReplySubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const message = form.querySelector('textarea').value.trim();
        
        if (!message) {
            this.showFormError(form, 'Reply cannot be empty');
            return;
        }

        try {
            // Get user info from main form
            const mainForm = document.getElementById('commentForm');
            const name = mainForm.querySelector('input[name="name"]').value;
            const email = mainForm.querySelector('input[name="email"]').value;
            
            if (!name || !email) {
                this.showFormError(form, 'Please fill out your name and email in the main form first');
                return;
            }

            const replyData = {
                postId: this.postId,
                parentId: this.replyingTo,
                name: name,
                email: email,
                message: message,
                timestamp: new Date().toISOString()
            };

            const result = await this.submitComment(replyData);
            
            if (result.success) {
                if (this.autoApprove) {
                    this.addCommentToDOM(result.comment);
                }
                this.hideReplyForm();
                this.showToast('Reply posted successfully!');
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            this.showFormError(form, error.message);
        }
    }

    hideReplyForm() {
        const replyForm = document.querySelector('.reply-form');
        if (replyForm) {
            replyForm.remove();
        }
        this.replyingTo = null;
    }

    async toggleLike(commentId) {
        if (!this.enableVoting) return;

        try {
            const response = await fetch(`${this.apiEndpoint}/${commentId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to update like');
            }

            const result = await response.json();
            this.updateLikeButton(commentId, result.likes, result.liked);

        } catch (error) {
            console.error('Error toggling like:', error);
            this.showToast('Failed to update like', 'error');
        }
    }

    updateLikeButton(commentId, likeCount, isLiked) {
        const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!comment) return;

        const likeBtn = comment.querySelector('.like-btn');
        const likeCountSpan = likeBtn?.querySelector('.like-count');

        if (likeBtn) {
            likeBtn.classList.toggle('liked', isLiked);
        }
        
        if (likeCountSpan) {
            likeCountSpan.textContent = likeCount;
        }
    }

    async deleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/${commentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete comment');
            }

            const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (comment) {
                comment.remove();
                this.updateCommentCount(-1);
                this.showToast('Comment deleted successfully');
            }

        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showToast('Failed to delete comment', 'error');
        }
    }

    updateLoadMoreButton(data) {
        const loadMoreBtn = document.getElementById('loadMoreComments');
        if (!loadMoreBtn) return;

        const hasMore = data.hasMore || (this.currentPage * this.commentsPerLoad) < this.totalComments;
        loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    }

    updateCommentCount(change) {
        this.totalComments += change;
        const countElements = document.querySelectorAll('.comment-count');
        countElements.forEach(el => {
            el.textContent = this.totalComments;
        });
    }

    getPostIdFromUrl() {
        const path = window.location.pathname;
        const matches = path.match(/\/blog\/(.+)/);
        return matches ? matches[1] : null;
    }

    getCommentId(element) {
        const comment = element.closest('[data-comment-id]');
        return comment ? comment.dataset.commentId : null;
    }

    getButtonAction(button) {
        return button.dataset.action || button.className.split('-')[0];
    }

    isOwnComment(comment) {
        const userEmail = localStorage.getItem('userEmail');
        return userEmail && userEmail === comment.email;
    }

    getAvatarUrl(email) {
        // Use Gravatar or return default avatar
        if (email) {
            const hash = this.md5(email.toLowerCase().trim());
            return `https://www.gravatar.com/avatar/${hash}?d=mp&s=40`;
        }
        return '/assets/images/default-avatar.png';
    }

    formatCommentText(text) {
        // Basic formatting: convert URLs to links, preserve line breaks
        return text
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    containsSpam(text) {
        const spamPatterns = [
            /viagra|cialis|casino|poker/i,
            /(http[s]?:\/\/[^\s]+.*){3,}/g, // Multiple URLs
            /(.)\1{10,}/g, // Repeated characters
            /\b[A-Z]{20,}\b/g // Long uppercase words
        ];

        return spamPatterns.some(pattern => pattern.test(text));
    }

    md5(string) {
        // Simple MD5 implementation for Gravatar
        // In production, use a proper crypto library
        return string; // Placeholder
    }

    setLoadingState(button, loading) {
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Post Comment';
        }
    }

    showSuccess(form, message) {
        this.showFormMessage(form, message, 'success');
    }

    showError(form, message) {
        this.showFormMessage(form, message, 'error');
    }

    showFormError(form, message) {
        this.showFormMessage(form, message, 'error');
    }

    showFormMessage(form, message, type) {
        const existingMessage = form.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageEl = document.createElement('div');
        messageEl.className = `form-message ${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        form.insertBefore(messageEl, form.firstElementChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 5000);
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showCommentsError(message) {
        const commentsList = document.getElementById('commentsList');
        if (commentsList) {
            commentsList.innerHTML = `
                <div class="comments-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <button onclick="window.commentsSystem.loadComments()" class="btn btn-primary">Retry</button>
                </div>
            `;
        }
    }

    bindCommentInteractions() {
        // This method is called after comments are rendered
        // Can be used to bind additional interactions
    }

    setupRealTimeUpdates() {
        // WebSocket or polling for real-time comment updates
        // Implementation depends on your backend setup
    }

    trackEvent(eventName, data = {}) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'comments',
                ...data
            });
        }
    }
}

// Initialize comments system
document.addEventListener('DOMContentLoaded', () => {
    const commentsContainer = document.getElementById('commentsList');
    if (commentsContainer) {
        window.commentsSystem = new CommentsSystem();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommentsSystem;
}
