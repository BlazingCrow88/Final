/* ===================================
   NEWSLETTER SIGNUP FUNCTIONALITY
   File: assets/js/newsletter-signup.js
   =================================== */

class NewsletterSignup {
    constructor() {
        this.endpoint = '/api/newsletter.php';
        this.mailchimpApiKey = 'your-mailchimp-api-key';
        this.listId = 'your-mailchimp-list-id';
        this.subscribers = new Set();
        this.init();
    }

    init() {
        this.loadExistingSubscribers();
        this.bindNewsletterForms();
        this.setupPopupTriggers();
        this.setupExitIntent();
        this.bindUnsubscribeLinks();
    }

    loadExistingSubscribers() {
        const stored = localStorage.getItem('newsletterSubscribers');
        if (stored) {
            try {
                const emails = JSON.parse(stored);
                this.subscribers = new Set(emails);
            } catch (error) {
                console.error('Error loading subscribers:', error);
            }
        }
    }

    bindNewsletterForms() {
        const forms = document.querySelectorAll('.newsletter-form, .newsletter-signup');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSignup(e));
        });

        // Bind individual newsletter inputs
        const inputs = document.querySelectorAll('.newsletter-input');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleDirectSignup(input);
                }
            });
        });
    }

    setupPopupTriggers() {
        // Time-based popup
        setTimeout(() => {
            this.maybeShowPopup('time_delay');
        }, 30000); // 30 seconds

        // Scroll-based popup
        let scrollTriggered = false;
        window.addEventListener('scroll', () => {
            if (!scrollTriggered && this.getScrollPercentage() > 50) {
                scrollTriggered = true;
                this.maybeShowPopup('scroll_50');
            }
        });

        // Page visit count
        const visitCount = this.incrementVisitCount();
        if (visitCount >= 3) {
            setTimeout(() => {
                this.maybeShowPopup('visit_count');
            }, 5000);
        }
    }

    setupExitIntent() {
        let exitIntentTriggered = false;
        
        document.addEventListener('mouseleave', (e) => {
            if (!exitIntentTriggered && e.clientY <= 0) {
                exitIntentTriggered = true;
                this.maybeShowPopup('exit_intent');
            }
        });
    }

    bindUnsubscribeLinks() {
        const unsubscribeLinks = document.querySelectorAll('.unsubscribe-link');
        unsubscribeLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleUnsubscribe(e));
        });
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const form = e.target;
        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (!emailInput) return;

        const email = emailInput.value.trim();
        const additionalData = this.extractFormData(form);

        try {
            this.setLoadingState(submitBtn, true);
            
            // Validate email
            if (!this.isValidEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            // Check if already subscribed
            if (this.subscribers.has(email)) {
                throw new Error('This email is already subscribed');
            }

            // Subscribe
            const result = await this.subscribeEmail(email, additionalData);
            
            if (result.success) {
                this.handleSuccessfulSignup(form, email, result);
            } else {
                throw new Error(result.message || 'Subscription failed');
            }

        } catch (error) {
            this.showError(form, error.message);
            this.trackEvent('newsletter_signup_error', { email, error: error.message });
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async handleDirectSignup(input) {
        const email = input.value.trim();
        
        if (!email) return;

        try {
            if (!this.isValidEmail(email)) {
                this.showInputError(input, 'Please enter a valid email');
                return;
            }

            if (this.subscribers.has(email)) {
                this.showInputError(input, 'Already subscribed');
                return;
            }

            const result = await this.subscribeEmail(email);
            
            if (result.success) {
                this.showInputSuccess(input, 'Subscribed!');
                this.addSubscriber(email);
                input.value = '';
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            this.showInputError(input, error.message);
        }
    }

    async subscribeEmail(email, additionalData = {}) {
        const subscriptionData = {
            email: email,
            timestamp: new Date().toISOString(),
            source: this.getSignupSource(),
            ...additionalData
        };

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscriptionData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Network error');
            }

            return await response.json();

        } catch (error) {
            console.error('Newsletter subscription error:', error);
            throw error;
        }
    }

    async subscribeToMailchimp(email, additionalData = {}) {
        if (!this.mailchimpApiKey || !this.listId) {
            throw new Error('Mailchimp not configured');
        }

        const data = {
            email_address: email,
            status: 'subscribed',
            merge_fields: {
                FNAME: additionalData.firstName || '',
                LNAME: additionalData.lastName || '',
                ...additionalData.mergeFields
            },
            tags: additionalData.tags || []
        };

        try {
            const response = await fetch(`/api/mailchimp-subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey: this.mailchimpApiKey,
                    listId: this.listId,
                    data: data
                })
            });

            return await response.json();

        } catch (error) {
            console.error('Mailchimp subscription error:', error);
            throw error;
        }
    }

    extractFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (key !== 'email') {
                data[key] = value;
            }
        }

        return data;
    }

    handleSuccessfulSignup(form, email, result) {
        this.addSubscriber(email);
        this.showSuccess(form, result.message || 'Successfully subscribed!');
        this.clearForm(form);
        this.trackEvent('newsletter_signup_success', { email });
        
        // Hide popup if signup was from popup
        this.hidePopup();
        
        // Show thank you message or redirect
        if (result.redirectUrl) {
            setTimeout(() => {
                window.location.href = result.redirectUrl;
            }, 2000);
        }
    }

    addSubscriber(email) {
        this.subscribers.add(email);
        this.saveSubscribers();
    }

    saveSubscribers() {
        try {
            localStorage.setItem('newsletterSubscribers', JSON.stringify(Array.from(this.subscribers)));
        } catch (error) {
            console.error('Error saving subscribers:', error);
        }
    }

    maybeShowPopup(trigger) {
        // Check if popup should be shown
        if (this.shouldSkipPopup()) {
            return;
        }

        // Check if already shown for this trigger
        const shownTriggers = JSON.parse(localStorage.getItem('newsletterPopupShown') || '[]');
        if (shownTriggers.includes(trigger)) {
            return;
        }

        // Show popup
        this.showPopup(trigger);
        
        // Mark as shown
        shownTriggers.push(trigger);
        localStorage.setItem('newsletterPopupShown', JSON.stringify(shownTriggers));
    }

    shouldSkipPopup() {
        // Skip if user already subscribed
        if (this.subscribers.size > 0) {
            return true;
        }

        // Skip if dismissed recently
        const lastDismissal = localStorage.getItem('newsletterPopupDismissed');
        if (lastDismissal) {
            const dismissedTime = new Date(lastDismissal);
            const daysSinceDismissal = (Date.now() - dismissedTime.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissal < 7) { // Don't show for 7 days after dismissal
                return true;
            }
        }

        // Skip if on certain pages
        const skipPages = ['/unsubscribe', '/privacy', '/terms'];
        if (skipPages.some(page => window.location.pathname.includes(page))) {
            return true;
        }

        return false;
    }

    showPopup(trigger) {
        const popup = document.getElementById('newsletterPopup') || this.createPopup();
        popup.dataset.trigger = trigger;
        popup.classList.add('show');
        document.body.classList.add('popup-open');

        // Close button
        const closeBtn = popup.querySelector('.popup-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hidePopup());
        }

        // Close on background click
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                this.hidePopup();
            }
        });

        // Track popup display
        this.trackEvent('newsletter_popup_shown', { trigger });
    }

    createPopup() {
        const popup = document.createElement('div');
        popup.id = 'newsletterPopup';
        popup.className = 'newsletter-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <button class="popup-close">&times;</button>
                <div class="popup-header">
                    <h3>Stay Updated!</h3>
                    <p>Get the latest updates on new books and exclusive content.</p>
                </div>
                <form class="newsletter-form popup-form">
                    <div class="form-group">
                        <input type="email" name="email" placeholder="Enter your email" required>
                        <button type="submit">Subscribe</button>
                    </div>
                    <p class="privacy-note">We respect your privacy. Unsubscribe at any time.</p>
                </form>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Bind form
        const form = popup.querySelector('.newsletter-form');
        form.addEventListener('submit', (e) => this.handleSignup(e));
        
        return popup;
    }

    hidePopup() {
        const popup = document.getElementById('newsletterPopup');
        if (popup) {
            popup.classList.remove('show');
            document.body.classList.remove('popup-open');
            
            // Track dismissal
            localStorage.setItem('newsletterPopupDismissed', new Date().toISOString());
            this.trackEvent('newsletter_popup_dismissed');
        }
    }

    async handleUnsubscribe(e) {
        e.preventDefault();
        
        const link = e.target;
        const email = link.dataset.email || prompt('Enter your email to unsubscribe:');
        
        if (!email) return;

        try {
            const result = await this.unsubscribeEmail(email);
            
            if (result.success) {
                this.subscribers.delete(email);
                this.saveSubscribers();
                alert('Successfully unsubscribed');
                this.trackEvent('newsletter_unsubscribe', { email });
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async unsubscribeEmail(email) {
        const response = await fetch('/api/newsletter-unsubscribe.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        return await response.json();
    }

    getScrollPercentage() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        return (scrollTop / scrollHeight) * 100;
    }

    incrementVisitCount() {
        const count = parseInt(localStorage.getItem('visitCount') || '0') + 1;
        localStorage.setItem('visitCount', count.toString());
        return count;
    }

    getSignupSource() {
        const referrer = document.referrer;
        const utm = new URLSearchParams(window.location.search);
        
        return {
            page: window.location.pathname,
            referrer: referrer,
            utm_source: utm.get('utm_source'),
            utm_medium: utm.get('utm_medium'),
            utm_campaign: utm.get('utm_campaign')
        };
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    setLoadingState(button, loading) {
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Subscribe';
        }
    }

    showSuccess(form, message) {
        this.showMessage(form, message, 'success');
    }

    showError(form, message) {
        this.showMessage(form, message, 'error');
    }

    showMessage(form, message, type) {
        const existingMessage = form.querySelector('.newsletter-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageEl = document.createElement('div');
        messageEl.className = `newsletter-message ${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        form.appendChild(messageEl);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 5000);
    }

    showInputSuccess(input, message) {
        this.showInputMessage(input, message, 'success');
    }

    showInputError(input, message) {
        this.showInputMessage(input, message, 'error');
    }

    showInputMessage(input, message, type) {
        input.classList.add(type);
        input.placeholder = message;
        
        setTimeout(() => {
            input.classList.remove(type);
            input.placeholder = 'Enter your email';
        }, 3000);
    }

    clearForm(form) {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.type !== 'submit') {
                input.value = '';
            }
        });
    }

    trackEvent(eventName, data = {}) {
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'newsletter',
                ...data
            });
        }

        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', data);
        }

        // Custom analytics
        if (window.analytics) {
            window.analytics.track(eventName, data);
        }
    }

    // Public API methods
    subscribe(email, additionalData) {
        return this.subscribeEmail(email, additionalData);
    }

    unsubscribe(email) {
        return this.unsubscribeEmail(email);
    }

    isSubscribed(email) {
        return this.subscribers.has(email);
    }

    getSubscriberCount() {
        return this.subscribers.size;
    }
}

// Initialize newsletter signup
document.addEventListener('DOMContentLoaded', () => {
    window.newsletterSignup = new NewsletterSignup();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsletterSignup;
}
