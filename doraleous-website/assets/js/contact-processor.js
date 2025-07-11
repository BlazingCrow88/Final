/* ===================================
   CONTACT FORM PROCESSOR
   File: assets/js/contact-processor.js
   =================================== */

class ContactProcessor {
    constructor() {
        this.endpoint = '/api/contact-handler.php';
        this.reCaptchaKey = 'your-recaptcha-site-key';
        this.initialized = false;
        this.init();
    }

    init() {
        this.loadReCaptcha();
        this.bindContactForms();
        this.setupFormEnhancements();
    }

    loadReCaptcha() {
        if (this.reCaptchaKey && this.reCaptchaKey !== 'your-recaptcha-site-key') {
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${this.reCaptchaKey}`;
            script.onload = () => {
                this.initialized = true;
            };
            document.head.appendChild(script);
        }
    }

    bindContactForms() {
        const forms = document.querySelectorAll('.contact-form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        });
    }

    setupFormEnhancements() {
        // Auto-resize textareas
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.addEventListener('input', this.autoResize);
            // Initial resize
            this.autoResize.call(textarea);
        });

        // Character counter for message field
        const messageFields = document.querySelectorAll('textarea[name="message"]');
        messageFields.forEach(field => {
            this.setupCharacterCounter(field);
        });

        // Smart form suggestions
        this.setupSmartSuggestions();
    }

    autoResize() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    }

    setupCharacterCounter(field) {
        const maxLength = field.getAttribute('maxlength') || 5000;
        const counter = document.createElement('div');
        counter.className = 'character-counter';
        counter.innerHTML = `<span class="current">0</span> / <span class="max">${maxLength}</span>`;
        
        field.parentNode.appendChild(counter);

        field.addEventListener('input', () => {
            const current = field.value.length;
            counter.querySelector('.current').textContent = current;
            
            // Change color based on usage
            if (current > maxLength * 0.9) {
                counter.classList.add('warning');
            } else {
                counter.classList.remove('warning');
            }
        });
    }

    setupSmartSuggestions() {
        // Subject line suggestions
        const subjectField = document.querySelector('input[name="subject"]');
        if (subjectField) {
            this.setupSubjectSuggestions(subjectField);
        }

        // Email domain suggestions
        const emailFields = document.querySelectorAll('input[type="email"]');
        emailFields.forEach(field => {
            this.setupEmailSuggestions(field);
        });
    }

    setupSubjectSuggestions(field) {
        const suggestions = [
            'General Inquiry',
            'Book Information',
            'Speaking Engagement',
            'Media Interview',
            'Collaboration Proposal',
            'Book Review Request',
            'Technical Support'
        ];

        const datalist = document.createElement('datalist');
        datalist.id = 'subject-suggestions';
        
        suggestions.forEach(suggestion => {
            const option = document.createElement('option');
            option.value = suggestion;
            datalist.appendChild(option);
        });

        field.setAttribute('list', 'subject-suggestions');
        field.parentNode.appendChild(datalist);
    }

    setupEmailSuggestions(field) {
        const commonDomains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'aol.com', 'icloud.com', 'me.com', 'live.com'
        ];

        field.addEventListener('blur', () => {
            const email = field.value;
            const atIndex = email.indexOf('@');
            
            if (atIndex > 0) {
                const domain = email.substring(atIndex + 1);
                const suggestion = this.suggestDomain(domain, commonDomains);
                
                if (suggestion && suggestion !== domain) {
                    this.showEmailSuggestion(field, email.substring(0, atIndex + 1) + suggestion);
                }
            }
        });
    }

    suggestDomain(input, domains) {
        const threshold = 2; // Levenshtein distance threshold
        
        for (const domain of domains) {
            if (this.levenshteinDistance(input.toLowerCase(), domain) <= threshold) {
                return domain;
            }
        }
        
        return null;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    showEmailSuggestion(field, suggestion) {
        const existingSuggestion = field.parentNode.querySelector('.email-suggestion');
        if (existingSuggestion) {
            existingSuggestion.remove();
        }

        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'email-suggestion';
        suggestionElement.innerHTML = `
            Did you mean <strong>${suggestion}</strong>?
            <button type="button" class="suggestion-accept">Yes</button>
            <button type="button" class="suggestion-dismiss">No</button>
        `;

        field.parentNode.appendChild(suggestionElement);

        // Handle suggestion buttons
        suggestionElement.querySelector('.suggestion-accept').addEventListener('click', () => {
            field.value = suggestion;
            suggestionElement.remove();
            // Trigger validation
            field.dispatchEvent(new Event('blur'));
        });

        suggestionElement.querySelector('.suggestion-dismiss').addEventListener('click', () => {
            suggestionElement.remove();
        });

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (suggestionElement.parentNode) {
                suggestionElement.remove();
            }
        }, 10000);
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);

        try {
            // Set loading state
            this.setSubmissionState(form, 'loading');

            // Convert FormData to object
            const data = this.formDataToObject(formData);

            // Pre-submission validation
            await this.validateSubmission(data, form);

            // Get reCaptcha token if available
            if (this.initialized && window.grecaptcha) {
                data.recaptcha_token = await this.getReCaptchaToken();
            }

            // Submit form
            const response = await this.submitForm(data);

            if (response.success) {
                this.setSubmissionState(form, 'success');
                this.showSuccessMessage(form, response.message);
                this.resetForm(form);
                this.trackSubmission('success', data);
            } else {
                throw new Error(response.message || 'Submission failed');
            }

        } catch (error) {
            this.setSubmissionState(form, 'error');
            this.showErrorMessage(form, error.message);
            this.trackSubmission('error', { error: error.message });
        }
    }

    formDataToObject(formData) {
        const obj = {};
        for (const [key, value] of formData.entries()) {
            obj[key] = value;
        }
        return obj;
    }

    async validateSubmission(data, form) {
        // Client-side validation
        if (!window.formValidator || !window.formValidator.validate(form)) {
            throw new Error('Please fix the form errors before submitting');
        }

        // Spam detection
        if (this.detectSpam(data)) {
            throw new Error('Message appears to be spam');
        }

        // Rate limiting check
        if (!this.checkClientRateLimit()) {
            throw new Error('Please wait before submitting another message');
        }
    }

    detectSpam(data) {
        const spamIndicators = [
            // Multiple URLs
            (data.message.match(/http[s]?:\/\//g) || []).length > 2,
            
            // Excessive capital letters
            (data.message.match(/[A-Z]/g) || []).length > data.message.length * 0.5,
            
            // Suspicious keywords
            /viagra|cialis|casino|poker|loan|mortgage|bitcoin/i.test(data.message),
            
            // Very short or very long messages
            data.message.length < 10 || data.message.length > 5000,
            
            // Repeated characters
            /(.)\1{5,}/.test(data.message),
            
            // Non-Latin characters (adjust based on your audience)
            /[^\u0000-\u007F\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/.test(data.message)
        ];

        return spamIndicators.filter(Boolean).length >= 2;
    }

    checkClientRateLimit() {
        const lastSubmission = localStorage.getItem('lastContactSubmission');
        const now = Date.now();
        const minInterval = 60000; // 1 minute

        if (lastSubmission && (now - parseInt(lastSubmission)) < minInterval) {
            return false;
        }

        localStorage.setItem('lastContactSubmission', now.toString());
        return true;
    }

    async getReCaptchaToken() {
        return new Promise((resolve, reject) => {
            grecaptcha.ready(() => {
                grecaptcha.execute(this.reCaptchaKey, { action: 'contact_form' })
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    async submitForm(data) {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        return response.json();
    }

    setSubmissionState(form, state) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const states = {
            loading: {
                text: 'Sending...',
                disabled: true,
                className: 'loading'
            },
            success: {
                text: 'Message Sent!',
                disabled: true,
                className: 'success'
            },
            error: {
                text: 'Try Again',
                disabled: false,
                className: 'error'
            },
            default: {
                text: 'Send Message',
                disabled: false,
                className: ''
            }
        };

        const config = states[state] || states.default;
        
        if (submitBtn) {
            submitBtn.textContent = config.text;
            submitBtn.disabled = config.disabled;
            submitBtn.className = `btn btn-primary ${config.className}`;
        }

        // Reset to default after success/error
        if (state === 'success' || state === 'error') {
            setTimeout(() => {
                this.setSubmissionState(form, 'default');
            }, 3000);
        }
    }

    showSuccessMessage(form, message) {
        this.showMessage(form, message, 'success');
    }

    showErrorMessage(form, message) {
        this.showMessage(form, message, 'error');
    }

    showMessage(form, message, type) {
        // Remove existing messages
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

    resetForm(form) {
        form.reset();
        
        // Reset textareas
        const textareas = form.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.style.height = 'auto';
        });

        // Reset character counters
        const counters = form.querySelectorAll('.character-counter .current');
        counters.forEach(counter => {
            counter.textContent = '0';
        });

        // Clear validation states
        if (window.formValidator) {
            window.formValidator.resetForm(form);
        }
    }

    trackSubmission(status, data) {
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'contact_form_submit', {
                event_category: 'engagement',
                event_label: status,
                value: status === 'success' ? 1 : 0
            });
        }

        // Custom analytics
        if (window.analytics) {
            window.analytics.track('Contact Form Submission', {
                status: status,
                subject: data.subject || 'No subject',
                timestamp: new Date().toISOString()
            });
        }
    }
}

// Initialize contact processor
document.addEventListener('DOMContentLoaded', () => {
    window.contactProcessor = new ContactProcessor();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContactProcessor;
}
