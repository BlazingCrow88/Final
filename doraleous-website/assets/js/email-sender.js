/* ===================================
   EMAIL SENDER FUNCTIONALITY
   File: assets/js/email-sender.js
   =================================== */

class EmailSender {
    constructor() {
        this.apiEndpoint = '/api/contact-handler.php';
        this.emailTemplates = {
            contact: 'contact-response',
            newsletter: 'newsletter-welcome',
            order: 'order-confirmation'
        };
        this.init();
    }

    init() {
        this.bindContactForm();
        this.bindNewsletterForm();
    }

    bindContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmission(e));
        }
    }

    bindNewsletterForm() {
        const newsletterForms = document.querySelectorAll('.newsletter-form');
        newsletterForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleNewsletterSignup(e));
        });
    }

    async handleContactSubmission(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);
        
        // Convert FormData to object
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        try {
            this.setLoadingState(submitBtn, true);
            this.clearMessages(form);

            // Validate form data
            this.validateContactForm(data);

            // Send email
            const response = await this.sendEmail(data, 'contact');

            if (response.success) {
                this.showSuccess(form, response.message);
                form.reset();
                
                // Track form submission
                this.trackEvent('contact_form_submit', {
                    subject: data.subject
                });
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            this.showError(form, error.message);
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async handleNewsletterSignup(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const email = form.querySelector('input[type="email"]').value;

        try {
            this.setLoadingState(submitBtn, true);
            this.clearMessages(form);

            // Validate email
            if (!this.isValidEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            // Send to newsletter service
            const response = await this.subscribeToNewsletter(email);

            if (response.success) {
                this.showSuccess(form, 'Thank you for subscribing to our newsletter!');
                form.reset();
                
                // Track newsletter signup
                this.trackEvent('newsletter_signup', {
                    email: email
                });
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            this.showError(form, error.message);
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async sendEmail(data, type = 'contact') {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to send email');
            }

            return result;

        } catch (error) {
            console.error('Email sending error:', error);
            throw new Error('Unable to send email. Please try again later.');
        }
    }

    async subscribeToNewsletter(email) {
        try {
            const response = await fetch('/api/newsletter-signup.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to subscribe');
            }

            return result;

        } catch (error) {
            console.error('Newsletter signup error:', error);
            throw new Error('Unable to subscribe. Please try again later.');
        }
    }

    validateContactForm(data) {
        const required = ['name', 'email', 'message'];
        
        for (const field of required) {
            if (!data[field] || data[field].trim() === '') {
                throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
            }
        }

        if (!this.isValidEmail(data.email)) {
            throw new Error('Please enter a valid email address');
        }

        if (data.message.length < 10) {
            throw new Error('Message must be at least 10 characters long');
        }

        if (data.message.length > 5000) {
            throw new Error('Message is too long (maximum 5000 characters)');
        }

        // Check for spam indicators
        if (this.containsSpam(data.message)) {
            throw new Error('Message contains prohibited content');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    containsSpam(text) {
        const spamKeywords = [
            'viagra', 'cialis', 'casino', 'poker', 'loan', 
            'mortgage', 'bitcoin', 'crypto', 'investment'
        ];
        
        const lowerText = text.toLowerCase();
        return spamKeywords.some(keyword => lowerText.includes(keyword));
    }

    setLoadingState(button, loading) {
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Send Message';
        }
    }

    showSuccess(form, message) {
        this.showMessage(form, message, 'success');
    }

    showError(form, message) {
        this.showMessage(form, message, 'error');
    }

    showMessage(form, message, type) {
        this.clearMessages(form);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        form.insertBefore(messageDiv, form.firstChild);
        
        // Auto-remove success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    clearMessages(form) {
        const existingMessages = form.querySelectorAll('.form-message');
        existingMessages.forEach(msg => msg.remove());
    }

    // Email template functionality
    async loadEmailTemplate(templateName) {
        try {
            const response = await fetch(`/email-templates/${templateName}.html`);
            if (!response.ok) {
                throw new Error('Template not found');
            }
            return await response.text();
        } catch (error) {
            console.error('Error loading email template:', error);
            return null;
        }
    }

    replaceTemplatePlaceholders(template, data) {
        let processedTemplate = template;
        
        // Replace common placeholders
        const placeholders = {
            '{{name}}': data.name || '',
            '{{email}}': data.email || '',
            '{{subject}}': data.subject || '',
            '{{message}}': data.message || '',
            '{{date}}': new Date().toLocaleDateString(),
            '{{year}}': new Date().getFullYear(),
            '{{site_name}}': 'Author Name',
            '{{site_url}}': window.location.origin
        };

        Object.entries(placeholders).forEach(([placeholder, value]) => {
            processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
        });

        return processedTemplate;
    }

    // Analytics tracking
    trackEvent(eventName, data = {}) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }

        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', eventName, data);
        }

        // Custom analytics
        if (window.customAnalytics) {
            window.customAnalytics.track(eventName, data);
        }
    }

    // Retry mechanism for failed emails
    async retryFailedEmail(data, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.sendEmail(data);
                return response;
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        
        throw lastError;
    }

    // Email queue for offline support
    queueEmail(data) {
        if (!navigator.onLine) {
            const emailQueue = JSON.parse(localStorage.getItem('emailQueue') || '[]');
            emailQueue.push({
                ...data,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('emailQueue', JSON.stringify(emailQueue));
            return true;
        }
        return false;
    }

    async processEmailQueue() {
        if (!navigator.onLine) return;

        const emailQueue = JSON.parse(localStorage.getItem('emailQueue') || '[]');
        
        for (const emailData of emailQueue) {
            try {
                await this.sendEmail(emailData);
                console.log('Queued email sent successfully');
            } catch (error) {
                console.error('Failed to send queued email:', error);
                // Keep in queue for next attempt
                continue;
            }
        }

        // Clear processed emails
        localStorage.removeItem('emailQueue');
    }
}

// Initialize email sender
document.addEventListener('DOMContentLoaded', () => {
    window.emailSender = new EmailSender();
    
    // Process queued emails when online
    window.addEventListener('online', () => {
        window.emailSender.processEmailQueue();
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailSender;
}
