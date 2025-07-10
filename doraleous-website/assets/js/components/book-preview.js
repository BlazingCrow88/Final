/* ===================================
   BOOK PREVIEW COMPONENT
   File: assets/js/components/book-preview.js
   =================================== */

class BookPreview {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.isOpen = false;
        this.currentBook = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.previewData = null;
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
        this.initializePreviewTriggers();
    }

    createModal() {
        // Create modal overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'book-preview-overlay';
        
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.className = 'book-preview-modal';
        
        this.modal.innerHTML = `
            <div class="book-preview-content">
                <div class="book-preview-header">
                    <div class="book-preview-title">
                        <h2 class="preview-book-title"></h2>
                        <p class="preview-book-author"></p>
                    </div>
                    <div class="book-preview-controls">
                        <button class="preview-control-btn" id="preview-fullscreen" title="Toggle Fullscreen">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                            </svg>
                        </button>
                        <button class="preview-control-btn" id="preview-close" title="Close Preview">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="book-preview-body">
                    <div class="book-preview-viewer">
                        <div class="preview-loading">
                            <div class="loading-spinner"></div>
                            <p>Loading preview...</p>
                        </div>
                        
                        <div class="preview-content" style="display: none;">
                            <div class="preview-page-container">
                                <div class="preview-page-content"></div>
                            </div>
                            
                            <div class="preview-navigation">
                                <button class="nav-btn" id="prev-page" disabled>
                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                                    </svg>
                                    Previous
                                </button>
                                
                                <div class="page-indicator">
                                    <span class="current-page">1</span>
                                    <span class="page-separator">/</span>
                                    <span class="total-pages">1</span>
                                </div>
                                
                                <button class="nav-btn" id="next-page">
                                    Next
                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div class="preview-error" style="display: none;">
                            <div class="error-icon">⚠️</div>
                            <h3>Preview Not Available</h3>
                            <p>Sorry, the preview for this book is currently not available.</p>
                            <button class="btn btn-primary" id="buy-instead">Purchase Book</button>
                        </div>
                    </div>
                    
                    <div class="book-preview-sidebar">
                        <div class="book-cover-container">
                            <img class="preview-book-cover" src="" alt="">
                        </div>
                        
                        <div class="book-info-panel">
                            <h3>Book Details</h3>
                            <div class="book-meta">
                                <div class="meta-item">
                                    <span class="meta-label">Genre:</span>
                                    <span class="meta-value book-genre"></span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Pages:</span>
                                    <span class="meta-value book-pages"></span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Published:</span>
                                    <span class="meta-value book-published"></span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">ISBN:</span>
                                    <span class="meta-value book-isbn"></span>
                                </div>
                            </div>
                            
                            <div class="book-rating">
                                <div class="rating-stars"></div>
                                <span class="rating-text"></span>
                            </div>
                            
                            <div class="book-description">
                                <h4>Description</h4>
                                <p class="description-text"></p>
                            </div>
                        </div>
                        
                        <div class="preview-actions">
                            <button class="btn btn-primary btn-block" id="purchase-book">
                                Purchase Book
                            </button>
                            <button class="btn btn-secondary btn-block" id="add-to-wishlist">
                                Add to Wishlist
                            </button>
                            <button class="btn btn-outline btn-block" id="share-preview">
                                Share Preview
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="book-preview-footer">
                    <div class="preview-disclaimer">
                        <p>This is a limited preview. The full book contains additional content not shown here.</p>
                    </div>
                </div>
            </div>
        `;
        
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
    }

    bindEvents() {
        // Close modal events
        this.overlay.querySelector('#preview-close').addEventListener('click', () => this.close());
        
        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // Navigation events
        this.overlay.querySelector('#prev-page').addEventListener('click', () => this.previousPage());
        this.overlay.querySelector('#next-page').addEventListener('click', () => this.nextPage());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.isOpen) {
                if (e.key === 'ArrowLeft') this.previousPage();
                if (e.key === 'ArrowRight') this.nextPage();
            }
        });
        
        // Fullscreen toggle
        this.overlay.querySelector('#preview-fullscreen').addEventListener('click', () => this.toggleFullscreen());
        
        // Action buttons
        this.overlay.querySelector('#purchase-book').addEventListener('click', () => this.purchaseBook());
        this.overlay.querySelector('#add-to-wishlist').addEventListener('click', () => this.addToWishlist());
        this.overlay.querySelector('#share-preview').addEventListener('click', () => this.sharePreview());
        this.overlay.querySelector('#buy-instead').addEventListener('click', () => this.purchaseBook());
    }

    initializePreviewTriggers() {
        // Find all preview trigger buttons
        const previewButtons = document.querySelectorAll('.book-preview-btn, [data-action="preview"]');
        previewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const bookId = button.dataset.bookId || button.getAttribute('data-book-id');
                if (bookId) {
                    this.openPreview(bookId);
                }
            });
        });
    }

    async openPreview(bookId) {
        this.currentBook = bookId;
        this.showLoading();
        this.overlay.style.display = 'flex';
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
        
        try {
            // Fetch book data and preview content
            const [bookData, previewData] = await Promise.all([
                this.fetchBookData(bookId),
                this.fetchPreviewData(bookId)
            ]);
            
            this.populateBookInfo(bookData);
            this.loadPreviewContent(previewData);
            
        } catch (error) {
            console.error('Error loading book preview:', error);
            this.showError();
        }
    }

    async fetchBookData(bookId) {
        const response = await fetch(`/api/books/${bookId}`);
        if (!response.ok) throw new Error('Failed to fetch book data');
        return response.json();
    }

    async fetchPreviewData(bookId) {
        const response = await fetch(`/api/books/${bookId}/preview`);
        if (!response.ok) throw new Error('Failed to fetch preview data');
        return response.json();
    }

    populateBookInfo(bookData) {
        // Update header
        this.overlay.querySelector('.preview-book-title').textContent = bookData.title;
        this.overlay.querySelector('.preview-book-author').textContent = `by ${bookData.author}`;
        
        // Update sidebar
        this.overlay.querySelector('.preview-book-cover').src = bookData.cover;
        this.overlay.querySelector('.preview-book-cover').alt = bookData.title;
        
        // Update metadata
        this.overlay.querySelector('.book-genre').textContent = bookData.genre;
        this.overlay.querySelector('.book-pages').textContent = bookData.pages;
        this.overlay.querySelector('.book-published').textContent = bookData.publishedDate;
        this.overlay.querySelector('.book-isbn').textContent = bookData.isbn;
        
        // Update rating
        this.displayRating(bookData.rating, bookData.reviewCount);
        
        // Update description
        this.overlay.querySelector('.description-text').textContent = bookData.description;
        
        // Store book data for actions
        this.currentBookData = bookData;
    }

    loadPreviewContent(previewData) {
        this.previewData = previewData;
        this.totalPages = previewData.pages.length;
        this.currentPage = 1;
        
        if (this.totalPages > 0) {
            this.displayPage(1);
            this.hideLoading();
            this.showContent();
        } else {
            this.showError();
        }
    }

    displayPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.totalPages) return;
        
        this.currentPage = pageNumber;
        const pageContent = this.previewData.pages[pageNumber - 1];
        
        // Update page content
        const contentContainer = this.overlay.querySelector('.preview-page-content');
        contentContainer.innerHTML = this.formatPageContent(pageContent);
        
        // Update navigation
        this.updateNavigation();
        
        // Track page view
        this.trackPageView(pageNumber);
    }

    formatPageContent(pageContent) {
        // Format the page content based on type
        if (pageContent.type === 'text') {
            return `<div class="preview-text-page">${pageContent.content}</div>`;
        } else if (pageContent.type === 'image') {
            return `<div class="preview-image-page">
                <img src="${pageContent.src}" alt="${pageContent.alt || ''}">
                ${pageContent.caption ? `<p class="image-caption">${pageContent.caption}</p>` : ''}
            </div>`;
        } else if (pageContent.type === 'mixed') {
            return `<div class="preview-mixed-page">${pageContent.content}</div>`;
        }
        
        return `<div class="preview-page">${pageContent.content || pageContent}</div>`;
    }

    updateNavigation() {
        const prevBtn = this.overlay.querySelector('#prev-page');
        const nextBtn = this.overlay.querySelector('#next-page');
        const currentPageSpan = this.overlay.querySelector('.current-page');
        const totalPagesSpan = this.overlay.querySelector('.total-pages');
        
        // Update page indicator
        currentPageSpan.textContent = this.currentPage;
        totalPagesSpan.textContent = this.totalPages;
        
        // Update button states
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === this.totalPages;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.displayPage(this.currentPage - 1);
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.displayPage(this.currentPage + 1);
        }
    }

    displayRating(rating, reviewCount) {
        const starsContainer = this.overlay.querySelector('.rating-stars');
        const ratingText = this.overlay.querySelector('.rating-text');
        
        // Create star display
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<span class="star filled">★</span>';
        }
        if (hasHalfStar) {
            starsHTML += '<span class="star half">★</span>';
        }
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<span class="star empty">☆</span>';
        }
        
        starsContainer.innerHTML = starsHTML;
        ratingText.textContent = `${rating}/5 (${reviewCount} reviews)`;
    }

    toggleFullscreen() {
        this.modal.classList.toggle('fullscreen');
        const fullscreenBtn = this.overlay.querySelector('#preview-fullscreen');
        
        if (this.modal.classList.contains('fullscreen')) {
            fullscreenBtn.title = 'Exit Fullscreen';
        } else {
            fullscreenBtn.title = 'Toggle Fullscreen';
        }
    }

    showLoading() {
        this.overlay.querySelector('.preview-loading').style.display = 'flex';
        this.overlay.querySelector('.preview-content').style.display = 'none';
        this.overlay.querySelector('.preview-error').style.display = 'none';
    }

    hideLoading() {
        this.overlay.querySelector('.preview-loading').style.display = 'none';
    }

    showContent() {
        this.overlay.querySelector('.preview-content').style.display = 'block';
        this.overlay.querySelector('.preview-error').style.display = 'none';
    }

    showError() {
        this.overlay.querySelector('.preview-loading').style.display = 'none';
        this.overlay.querySelector('.preview-content').style.display = 'none';
        this.overlay.querySelector('.preview-error').style.display = 'flex';
    }

    close() {
        this.overlay.style.display = 'none';
        this.isOpen = false;
        document.body.style.overflow = '';
        this.currentBook = null;
        this.currentBookData = null;
        this.previewData = null;
        this.modal.classList.remove('fullscreen');
    }

    purchaseBook() {
        if (this.currentBookData) {
            // Redirect to purchase page or trigger purchase flow
            window.location.href = `/books/${this.currentBookData.id}/purchase`;
        }
    }

    addToWishlist() {
        if (this.currentBookData) {
            // Add to wishlist functionality
            this.trackEvent('add_to_wishlist', { bookId: this.currentBookData.id });
            
            // Show confirmation
            this.showNotification('Book added to wishlist!');
        }
    }

    sharePreview() {
        if (this.currentBookData) {
            const shareData = {
                title: `Preview: ${this.currentBookData.title}`,
                text: `Check out this preview of "${this.currentBookData.title}" by ${this.currentBookData.author}`,
                url: `${window.location.origin}/books/${this.currentBookData.id}/preview`
            };
            
            if (navigator.share) {
                navigator.share(shareData);
            } else {
                // Fallback to clipboard
                navigator.clipboard.writeText(shareData.url);
                this.showNotification('Preview link copied to clipboard!');
            }
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'preview-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    trackPageView(pageNumber) {
        this.trackEvent('preview_page_view', {
            bookId: this.currentBook,
            page: pageNumber,
            totalPages: this.totalPages
        });
    }

    trackEvent(eventName, data = {}) {
        // Integration with analytics
        if (window.gtag) {
            window.gtag('event', eventName, data);
        }
        
        if (window.analytics) {
            window.analytics.track(eventName, data);
        }
        
        console.log(`Book preview event: ${eventName}`, data);
    }
}

// Initialize book preview
const bookPreview = new BookPreview();

// Export for use in other modules
window.BookPreview = bookPreview;
