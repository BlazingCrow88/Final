/* ===================================
   SOCIAL MEDIA CONFIGURATION FOR NETLIFY
   File: assets/js/social-media-config.js
   =================================== */

/**
 * Simplified Social Media Configuration for Doraleous and Associates
 * 
 * This configuration is designed for static site deployment on Netlify
 * and focuses on client-side functionality including:
 * - Social sharing buttons
 * - ConvertKit email integration
 * - Manual posting workflow support
 * - Basic analytics tracking
 */

// Social Media Account Configuration (for manual posting reference)
const SOCIAL_ACCOUNTS = {
    twitter: {
        handle: '@doraleousadventures',
        url: 'https://twitter.com/doraleousadventures',
        name: 'Doraleous and Associates'
    },
    facebook: {
        handle: 'doraleousandassociates',
        url: 'https://facebook.com/doraleousandassociates',
        name: 'Doraleous and Associates'
    },
    instagram: {
        handle: '@doraleousadventures',
        url: 'https://instagram.com/doraleousadventures',
        name: 'Doraleous and Associates'
    },
    youtube: {
        handle: '@doraleousadventures',
        url: 'https://youtube.com/@doraleousadventures',
        name: 'Doraleous and Associates'
    },
    pinterest: {
        handle: 'doraleousadventures',
        url: 'https://pinterest.com/doraleousadventures',
        name: 'Doraleous and Associates'
    },
    tiktok: {
        handle: '@doraleousadventures',
        url: 'https://tiktok.com/@doraleousadventures',
        name: 'Doraleous and Associates'
    }
};

// ConvertKit Configuration
const CONVERTKIT_CONFIG = {
    formId: 'your-convertkit-form-id-here', // Replace with actual form ID
    apiKey: 'your-convertkit-api-key-here', // Replace with actual API key (public key only)
    tags: ['fantasy-reader', 'doraleous-fan', 'newsletter-subscriber'],
    successMessage: 'Welcome to the adventure! Check your email for your character guide.',
    errorMessage: 'Oops! Something went wrong. Please try again.'
};

// Content Categories for Social Sharing
const CONTENT_CATEGORIES = {
    'character-spotlight': {
        hashtags: ['#CharacterSpotlight', '#FantasyCharacters', '#DoraleousAndAssociates', '#EpicFantasy'],
        defaultText: 'Meet the heroes of Doraleous and Associates!'
    },
    'world-lore': {
        hashtags: ['#WorldBuilding', '#FantasyLore', '#EpicFantasy', '#DoraleousWorld'],
        defaultText: 'Discover the rich world of Doraleous and Associates!'
    },
    'adventure-tales': {
        hashtags: ['#AdventureTales', '#EpicQuests', '#FantasyAdventure', '#DoraleousAndAssociates'],
        defaultText: 'Epic adventures await in the world of Doraleous!'
    },
    'behind-scenes': {
        hashtags: ['#BehindTheScenes', '#WritingProcess', '#FantasyAuthor', '#BookCreation'],
        defaultText: 'Go behind the scenes of creating Doraleous and Associates!'
    },
    'book-update': {
        hashtags: ['#BookUpdate', '#FantasyBooks', '#NewRelease', '#DoraleousAndAssociates'],
        defaultText: 'New updates from the world of Doraleous and Associates!'
    }
};

/**
 * Social Media Sharing Class
 */
class SocialMediaSharing {
    constructor() {
        this.initializeSharingButtons();
        this.setupEventListeners();
    }

    /**
     * Initialize social sharing buttons on page load
     */
    initializeSharingButtons() {
        // Auto-generate sharing buttons for blog posts
        const blogPosts = document.querySelectorAll('.blog-post-card, .blog-post');
        blogPosts.forEach(post => {
            if (!post.querySelector('.share-buttons')) {
                this.addSharingButtons(post);
            }
        });

        // Initialize floating share buttons if they exist
        this.initializeFloatingShareBar();
    }

    /**
     * Add sharing buttons to a specific element
     */
    addSharingButtons(element) {
        const shareContainer = document.createElement('div');
        shareContainer.className = 'share-buttons';
        shareContainer.innerHTML = this.generateSharingHTML();
        
        // Find the best place to insert sharing buttons
        const footer = element.querySelector('.post-footer, .card-footer');
        if (footer) {
            footer.appendChild(shareContainer);
        } else {
            element.appendChild(shareContainer);
        }
    }

    /**
     * Generate HTML for sharing buttons
     */
    generateSharingHTML() {
        const currentUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(document.title || 'Doraleous and Associates');
        const pageDescription = encodeURIComponent(
            document.querySelector('meta[name="description"]')?.content || 
            'Epic fantasy adventures with Doraleous and his legendary companions!'
        );

        return `
            <div class="share-buttons-wrapper">
                <h4 class="share-title">Share this adventure:</h4>
                <div class="share-button-list">
                    <a href="https://twitter.com/intent/tweet?url=${currentUrl}&text=${pageTitle}&via=doraleousadventures" 
                       target="_blank" rel="noopener" class="share-btn twitter" data-platform="twitter">
                        <i class="fab fa-twitter"></i>
                        <span>Twitter</span>
                    </a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${currentUrl}" 
                       target="_blank" rel="noopener" class="share-btn facebook" data-platform="facebook">
                        <i class="fab fa-facebook-f"></i>
                        <span>Facebook</span>
                    </a>
                    <a href="https://www.pinterest.com/pin/create/button/?url=${currentUrl}&description=${pageDescription}" 
                       target="_blank" rel="noopener" class="share-btn pinterest" data-platform="pinterest">
                        <i class="fab fa-pinterest"></i>
                        <span>Pinterest</span>
                    </a>
                    <a href="https://www.reddit.com/submit?url=${currentUrl}&title=${pageTitle}" 
                       target="_blank" rel="noopener" class="share-btn reddit" data-platform="reddit">
                        <i class="fab fa-reddit-alien"></i>
                        <span>Reddit</span>
                    </a>
                    <a href="mailto:?subject=${pageTitle}&body=Check out this epic fantasy content: ${currentUrl}" 
                       class="share-btn email" data-platform="email">
                        <i class="fas fa-envelope"></i>
                        <span>Email</span>
                    </a>
                    <button class="share-btn copy-link" onclick="SocialMediaManager.copyToClipboard('${decodeURIComponent(currentUrl)}')" data-platform="copy">
                        <i class="fas fa-link"></i>
                        <span>Copy Link</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Initialize floating share bar for blog posts
     */
    initializeFloatingShareBar() {
        if (document.querySelector('.blog-post-page')) {
            const floatingBar = document.createElement('div');
            floatingBar.className = 'floating-share-bar';
            floatingBar.innerHTML = `
                <div class="floating-share-content">
                    <span class="share-text">Share:</span>
                    ${this.generateFloatingSharingHTML()}
                </div>
            `;
            
            document.body.appendChild(floatingBar);
            
            // Show/hide based on scroll position
            this.setupFloatingBarScrollBehavior(floatingBar);
        }
    }

    /**
     * Generate HTML for floating sharing buttons
     */
    generateFloatingSharingHTML() {
        const currentUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(document.title || 'Doraleous and Associates');

        return `
            <a href="https://twitter.com/intent/tweet?url=${currentUrl}&text=${pageTitle}&via=doraleousadventures" 
               target="_blank" rel="noopener" class="floating-share-btn twitter" data-platform="twitter">
                <i class="fab fa-twitter"></i>
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${currentUrl}" 
               target="_blank" rel="noopener" class="floating-share-btn facebook" data-platform="facebook">
                <i class="fab fa-facebook-f"></i>
            </a>
            <a href="https://www.pinterest.com/pin/create/button/?url=${currentUrl}&description=${pageTitle}" 
               target="_blank" rel="noopener" class="floating-share-btn pinterest" data-platform="pinterest">
                <i class="fab fa-pinterest"></i>
            </a>
        `;
    }

    /**
     * Setup scroll behavior for floating share bar
     */
    setupFloatingBarScrollBehavior(floatingBar) {
        let lastScrollTop = 0;
        const showThreshold = 300; // Show after scrolling 300px

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > showThreshold && scrollTop > lastScrollTop) {
                // Scrolling down and past threshold
                floatingBar.classList.add('visible');
            } else if (scrollTop < 100) {
                // Near top of page
                floatingBar.classList.remove('visible');
            }
            
            lastScrollTop = scrollTop;
        });
    }

    /**
     * Setup event listeners for tracking
     */
    setupEventListeners() {
        // Track social sharing clicks
        document.addEventListener('click', (e) => {
            const shareBtn = e.target.closest('[data-platform]');
            if (shareBtn) {
                const platform = shareBtn.getAttribute('data-platform');
                this.trackSocialShare(platform);
            }
        });
    }

    /**
     * Track social sharing for analytics
     */
    trackSocialShare(platform) {
        // Google Analytics 4 tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'share', {
                method: platform,
                content_type: this.getContentType(),
                item_id: window.location.pathname
            });
        }

        // Console log for debugging
        console.log(`Social share tracked: ${platform} from ${window.location.pathname}`);
    }

    /**
     * Get content type for analytics
     */
    getContentType() {
        const path = window.location.pathname;
        if (path.includes('/blog/')) {
            return 'blog_post';
        } else if (path.includes('/characters/')) {
            return 'character_page';
        } else if (path.includes('/world/')) {
            return 'world_page';
        } else if (path.includes('/adventures/')) {
            return 'adventure_page';
        }
        return 'general_page';
    }
}

/**
 * ConvertKit Email Integration Class
 */
class ConvertKitIntegration {
    constructor() {
        this.setupNewsletterForms();
        this.setupEventListeners();
    }

    /**
     * Setup newsletter signup forms
     */
    setupNewsletterForms() {
        const forms = document.querySelectorAll('.newsletter-form');
        forms.forEach(form => {
            // Replace form action with ConvertKit endpoint
            form.setAttribute('action', `https://app.convertkit.com/forms/${CONVERTKIT_CONFIG.formId}/subscriptions`);
            form.setAttribute('method', 'post');
            form.setAttribute('data-remote', 'true');
            
            // Add hidden fields for ConvertKit
            this.addConvertKitFields(form);
        });
    }

    /**
     * Add hidden fields required by ConvertKit
     */
    addConvertKitFields(form) {
        // Add UTF-8 field
        const utf8Field = document.createElement('input');
        utf8Field.type = 'hidden';
        utf8Field.name = 'utf8';
        utf8Field.value = '✓';
        form.appendChild(utf8Field);

        // Add tags field
        const tagsField = document.createElement('input');
        tagsField.type = 'hidden';
        tagsField.name = 'tags';
        tagsField.value = CONVERTKIT_CONFIG.tags.join(',');
        form.appendChild(tagsField);

        // Add source tracking
        const sourceField = document.createElement('input');
        sourceField.type = 'hidden';
        sourceField.name = 'source';
        sourceField.value = window.location.pathname;
        form.appendChild(sourceField);
    }

    /**
     * Setup event listeners for form submissions
     */
    setupEventListeners() {
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('newsletter-form')) {
                this.handleFormSubmission(e);
            }
        });
    }

    /**
     * Handle newsletter form submission
     */
    handleFormSubmission(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        // Show loading state
        this.showLoadingState(form);
        
        // Submit to ConvertKit
        fetch(form.action, {
            method: 'POST',
            body: formData,
            mode: 'no-cors' // Required for ConvertKit
        })
        .then(() => {
            this.showSuccessMessage(form);
            this.trackNewsletterSignup();
        })
        .catch(() => {
            this.showErrorMessage(form);
        });
    }

    /**
     * Show loading state
     */
    showLoadingState(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage(form) {
        const messageDiv = this.createMessageElement('success', CONVERTKIT_CONFIG.successMessage);
        form.parentNode.replaceChild(messageDiv, form);
    }

    /**
     * Show error message
     */
    showErrorMessage(form) {
        const messageDiv = this.createMessageElement('error', CONVERTKIT_CONFIG.errorMessage);
        form.appendChild(messageDiv);
        
        // Reset form
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Join the Adventure';
        }
    }

    /**
     * Create message element
     */
    createMessageElement(type, message) {
        const div = document.createElement('div');
        div.className = `newsletter-message ${type}`;
        div.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <p>${message}</p>
            </div>
        `;
        return div;
    }

    /**
     * Track newsletter signup for analytics
     */
    trackNewsletterSignup() {
        // Google Analytics 4 tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'newsletter_signup', {
                method: 'website_form',
                source: window.location.pathname
            });
        }

        console.log('Newsletter signup tracked from:', window.location.pathname);
    }
}

/**
 * Social Media Content Helper Class
 */
class SocialContentHelper {
    /**
     * Generate optimized content for social platforms
     */
    static generateSocialContent(contentType, customText = '') {
        const category = CONTENT_CATEGORIES[contentType] || CONTENT_CATEGORIES['book-update'];
        const hashtags = category.hashtags.join(' ');
        const baseText = customText || category.defaultText;
        
        return {
            twitter: this.optimizeForTwitter(baseText, hashtags),
            facebook: this.optimizeForFacebook(baseText, hashtags),
            instagram: this.optimizeForInstagram(baseText, hashtags),
            general: `${baseText} ${hashtags}`
        };
    }

    /**
     * Optimize content for Twitter
     */
    static optimizeForTwitter(text, hashtags) {
        const maxLength = 280;
        const hashtagLength = hashtags.length + 1; // +1 for space
        const availableLength = maxLength - hashtagLength;
        
        let optimizedText = text;
        if (text.length > availableLength) {
            optimizedText = text.substring(0, availableLength - 3) + '...';
        }
        
        return `${optimizedText} ${hashtags}`;
    }

    /**
     * Optimize content for Facebook
     */
    static optimizeForFacebook(text, hashtags) {
        // Facebook allows longer content
        return `${text}\n\n${hashtags}`;
    }

    /**
     * Optimize content for Instagram
     */
    static optimizeForInstagram(text, hashtags) {
        // Instagram allows long captions
        return `${text}\n\n${hashtags}\n\n#bookstagram #fantasy #epicfantasy #booklovers #reading`;
    }
}

/**
 * Main Social Media Manager Class
 */
class SocialMediaManager {
    constructor() {
        this.sharing = new SocialMediaSharing();
        this.convertkit = new ConvertKitIntegration();
        this.setupUtilityFunctions();
    }

    /**
     * Setup utility functions
     */
    setupUtilityFunctions() {
        // Make copy function globally available
        window.SocialMediaManager = {
            copyToClipboard: this.copyToClipboard,
            generateContent: SocialContentHelper.generateSocialContent,
            getAccounts: () => SOCIAL_ACCOUNTS
        };
    }

    /**
     * Copy URL to clipboard
     */
    copyToClipboard(url) {
        navigator.clipboard.writeText(url).then(() => {
            // Show success feedback
            const event = new CustomEvent('linkCopied', { detail: { url } });
            document.dispatchEvent(event);
            
            // Temporary visual feedback
            const copyButtons = document.querySelectorAll('.copy-link');
            copyButtons.forEach(btn => {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
                btn.classList.add('copied');
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('copied');
                }, 2000);
            });
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            // Fallback for older browsers
            this.fallbackCopyToClipboard(url);
        });
    }

    /**
     * Fallback copy method for older browsers
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            console.log('URL copied to clipboard (fallback method)');
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SocialMediaManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SocialMediaManager,
        SocialMediaSharing,
        ConvertKitIntegration,
        SocialContentHelper,
        SOCIAL_ACCOUNTS,
        CONVERTKIT_CONFIG,
        CONTENT_CATEGORIES
    };
}
