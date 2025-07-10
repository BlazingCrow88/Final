/* ===================================
   REVIEW MODAL COMPONENT
   File: assets/js/components/review-modal.js
   =================================== */

class ReviewModal {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.isOpen = false;
        this.currentBook = null;
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        // Create modal overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'review-modal-overlay';
        
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.className = 'review-modal';
        
        this.modal.innerHTML = `
            <div class="review-modal-content">
                <div class="review-modal-header">
                    <h2>Write a Review</h2>
                    <button class="review-modal-close" aria-label="Close modal">&times;</button>
                </div>
                <div class="review-modal-body">
                    <div class="book-info">
                        <img src="" alt="" class="book-cover">
                        <div class="book-details">
                            <h3 class="book-title"></h3>
                            <p class="book-author"></p>
                        </div>
                    </div>
                    <form class="review-form">
                        <div class="rating-section">
                            <label>Your Rating:</label>
                            <div class="star-rating">
                                <span class="star" data-rating="1">★</span>
                                <span class="star" data-rating="2">★</span>
                                <span class="star" data-rating="3">★</span>
                                <span class="star" data-rating="4">★</span>
                                <span class="star" data-rating="5">★</span>
                            </div>
                        </div>
                        <div class="review-text-section">
                            <label for="review-title">Review Title:</label>
                            <input type="text" id="review-title" name="title" placeholder="Give your review a title">
                            
                            <label for="review-text">Your Review:</label>
                            <textarea id="review-text" name="review" rows="6" placeholder="Share your thoughts about this book..."></textarea>
                        </div>
                        <div class="reviewer-info">
                            <label for="reviewer-name">Your Name:</label>
                            <input type="text" id="reviewer-name" name="name" placeholder="Enter your name">
                            
                            <label for="reviewer-email">Email (optional):</label>
                            <input type="email" id="reviewer-email" name="email" placeholder="your.email@example.com">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary cancel-review">Cancel</button>
                            <button type="submit" class="btn btn-primary submit-review">Submit Review</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
    }

    bindEvents() {
        // Close modal events
        this.overlay.querySelector('.review-modal-close').addEventListener('click', () => this.close());
        this.overlay.querySelector('.cancel-review').addEventListener('click', () => this.close());
        
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
        
        // Star rating
        const stars = this.overlay.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.setRating(rating);
            });
            
            star.addEventListener('mouseenter', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.highlightStars(rating);
            });
        });
        
        // Reset star highlight on mouse leave
        this.overlay.querySelector('.star-rating').addEventListener('mouseleave', () => {
            this.highlightStars(this.currentRating || 0);
        });
        
        // Form submission
        this.overlay.querySelector('.review-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReview();
        });
    }

    open(bookData) {
        this.currentBook = bookData;
        this.populateBookInfo(bookData);
        this.resetForm();
        this.overlay.style.display = 'flex';
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        setTimeout(() => {
            this.overlay.querySelector('#review-title').focus();
        }, 100);
    }

    close() {
        this.overlay.style.display = 'none';
        this.isOpen = false;
        document.body.style.overflow = '';
        this.currentBook = null;
        this.resetForm();
    }

    populateBookInfo(bookData) {
        const bookCover = this.overlay.querySelector('.book-cover');
        const bookTitle = this.overlay.querySelector('.book-title');
        const bookAuthor = this.overlay.querySelector('.book-author');
        
        bookCover.src = bookData.cover || 'assets/images/books/placeholder.jpg';
        bookCover.alt = bookData.title;
        bookTitle.textContent = bookData.title;
        bookAuthor.textContent = `by ${bookData.author}`;
    }

    setRating(rating) {
        this.currentRating = rating;
        this.highlightStars(rating);
        
        // Store rating in form
        const form = this.overlay.querySelector('.review-form');
        let ratingInput = form.querySelector('input[name="rating"]');
        if (!ratingInput) {
            ratingInput = document.createElement('input');
            ratingInput.type = 'hidden';
            ratingInput.name = 'rating';
            form.appendChild(ratingInput);
        }
        ratingInput.value = rating;
    }

    highlightStars(rating) {
        const stars = this.overlay.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    resetForm() {
        const form = this.overlay.querySelector('.review-form');
        form.reset();
        this.currentRating = 0;
        this.highlightStars(0);
    }

    async submitReview() {
        const form = this.overlay.querySelector('.review-form');
        const formData = new FormData(form);
        
        // Validate required fields
        const rating = formData.get('rating');
        const title = formData.get('title');
        const review = formData.get('review');
        const name = formData.get('name');
        
        if (!rating || !title || !review || !name) {
            this.showError('Please fill in all required fields and provide a rating.');
            return;
        }
        
        // Prepare review data
        const reviewData = {
            bookId: this.currentBook.id,
            rating: parseInt(rating),
            title: title.trim(),
            review: review.trim(),
            reviewerName: name.trim(),
            reviewerEmail: formData.get('email')?.trim() || '',
            date: new Date().toISOString(),
            approved: false // Reviews need approval
        };
        
        try {
            this.showLoading(true);
            
            // Submit review (replace with actual API call)
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData)
            });
            
            if (response.ok) {
                this.showSuccess('Thank you for your review! It will be published after approval.');
                setTimeout(() => this.close(), 2000);
            } else {
                throw new Error('Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            this.showError('Sorry, there was an error submitting your review. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = this.overlay.querySelector('.review-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `review-message ${type}`;
        messageEl.textContent = message;
        
        const modalContent = this.overlay.querySelector('.review-modal-content');
        modalContent.insertBefore(messageEl, modalContent.firstChild);
        
        // Auto-hide error messages
        if (type === 'error') {
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, 5000);
        }
    }

    showLoading(show) {
        const submitBtn = this.overlay.querySelector('.submit-review');
        if (show) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
        }
    }
}

// Initialize review modal
const reviewModal = new ReviewModal();

// Export for use in other modules
window.ReviewModal = reviewModal;
