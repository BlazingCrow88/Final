// Newsletter Signup Component
// Handles newsletter subscription forms with validation and integration

document.addEventListener('DOMContentLoaded', function() {
    initializeNewsletterSignup();
    initializeExitIntentPopup();
});

function initializeNewsletterSignup() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    if (newsletterForms.length === 0) return;
    
    newsletterForms.forEach(form => {
        setupNewsletterForm(form);
    });
    
    console.log('Newsletter signup initialized');
}

function setupNewsletterForm(form) {
    const emailInput = form.querySelector('input[type="email"]');
    const submitButton = form.querySelector('button[type="submit"]');
    const nameInput = form.querySelector('input[name="name"]');
    
    if (!emailInput || !submitButton) return;
    
    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleNewsletterSubmission(form);
    });
    
    // Real-time email validation
    emailInput.addEventListener('input', function() {
        validateEmailInput(this);
    });
    
    // Enhanced form interactions
    emailInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    emailInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
        validateEmailInput(this);
    });
    
    // Name input validation (if present)
    if (nameInput) {
        nameInput.addEventListener('blur', function() {
            validateNameInput(this);
        });
    }
    
    // Prevent multiple submissions
    form.addEventListener('submit', function() {
        submitButton.disabled = true;
        setTimeout(() => {
            submitButton.disabled = false;
        }, 3000);
    });
}

function handleNewsletterSubmission(form) {
    const emailInput = form.querySelector('input[type="email"]');
    const nameInput = form.querySelector('input[name="name"]');
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    
    const email = emailInput.value.trim();
    const name = nameInput ? nameInput.value.trim() : '';
    
    // Validation
    if (!validateEmailInput(emailInput)) {
        emailInput.focus();
        return;
    }
    
    if (nameInput && !validateNameInput(nameInput)) {
        nameInput.focus();
        return;
    }
    
    // Show loading state
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Subscribing...';
    submitButton.disabled = true;
    
    // Clear previous messages
    clearFormMessages(form);
    
    // Prepare subscription data
    const subscriptionData = {
        email: email,
        name: name,
        source: 'website',
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        referrer: document.referrer
    };
    
    // Submit to newsletter service
    submitToNewsletterService(subscriptionData)
        .then(response => {
            handleSubscriptionSuccess(form, response);
            trackNewsletterSignup(subscriptionData);
        })
        .catch(error => {
            handleSubscriptionError(form, error);
        })
        .finally(() => {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        });
}

function submitToNewsletterService(data) {
    return new Promise((resolve, reject) => {
        // This is a placeholder for actual newsletter service integration
        // Replace with actual API endpoint (ConvertKit, Mailchimp, etc.)
        
        // Simulate API call
        setTimeout(() => {
            // Simulate success/failure based on email format
            if (data.email.includes('test@example.com')) {
                reject(new Error('This email is already subscribed'));
            } else {
                resolve({
                    success: true,
                    message: 'Successfully subscribed to newsletter',
                    subscriber_id: Math.random().toString(36).substring(7)
                });
            }
        }, 2000);
        
        // Example ConvertKit integration:
        /*
        const convertKitApiKey = 'your-convertkit-api-key';
        const convertKitFormId = 'your-form-id';
        
        fetch(`https://api.convertkit.com/v3/forms/${convertKitFormId}/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: convertKitApiKey,
                email: data.email,
                first_name: data.name,
                tags: ['website-signup']
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.subscription) {
                resolve(data);
            } else {
                reject(new Error(data.error || 'Subscription failed'));
            }
        })
        .catch(error => reject(error));
        */
    });
}

function handleSubscriptionSuccess(form, response) {
    const successMessage = createSuccessMessage(
        'Thank you for subscribing! Please check your email to confirm your subscription.'
    );
    
    showFormMessage(form, successMessage, 'success');
    
    // Reset form
    form.reset();
    
    // Show additional success actions
    showSuccessActions(form);
    
    // Track successful signup
    if (typeof AuthorWebsite !== 'undefined') {
        AuthorWebsite.trackEvent('newsletter_signup_success', {
            email: form.querySelector('input[type="email"]').value,
            form_location: getFormLocation(form)
        });
    }
}

function handleSubscriptionError(form, error) {
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error.message.includes('already subscribed')) {
        errorMessage = 'This email is already subscribed to our newsletter.';
    } else if (error.message.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.';
    }
    
    const errorElement = createErrorMessage(errorMessage);
    showFormMessage(form, errorElement, 'error');
    
    // Track error
    if (typeof AuthorWebsite !== 'undefined') {
        AuthorWebsite.trackEvent('newsletter_signup_error', {
            error_message: error.message,
            form_location: getFormLocation(form)
        });
    }
}

function validateEmailInput(input) {
    const email = input.value.trim();
    const isValid = isValidEmail(email);
    
    if (typeof AuthorWebsite !== 'undefined') {
        clearValidationError(input);
    }
    
    if (!email) {
        return true; // Empty is valid until submission
    }
    
    if (!isValid) {
        if (typeof AuthorWebsite !== 'undefined') {
            AuthorWebsite.showError(input, 'Please enter a valid email address');
        }
        return false;
    }
    
    return true;
}

function validateNameInput(input) {
    const name = input.value.trim();
    
    if (typeof AuthorWebsite !== 'undefined') {
        clearValidationError(input);
    }
    
    if (name.length > 0 && name.length < 2) {
        if (typeof AuthorWebsite !== 'undefined') {
            AuthorWebsite.showError(input, 'Please enter a valid name');
        }
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function createSuccessMessage(text) {
    const message = document.createElement('div');
    message.className = 'form-success-message';
    message.innerHTML = `
        <svg class="success-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22,4 12,14.01 9,11.01"></polyline>
        </svg>
        <span>${text}</span>
    `;
    return message;
}

function createErrorMessage(text) {
    const message = document.createElement('div');
    message.className = 'form-error-message';
    message.innerHTML = `
        <svg class="error-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <span>${text}</span>
    `;
    return message;
}

function showFormMessage(form, messageElement, type) {
    clearFormMessages(form);
    
    messageElement.classList.add('fade-in');
    form.appendChild(messageElement);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                messageElement.remove();
            }, 300);
        }
    }, 5000);
}

function clearFormMessages(form) {
    const existingMessages = form.querySelectorAll('.form-success-message, .form-error-message');
    existingMessages.forEach(message => message.remove());
}

function showSuccessActions(form) {
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'newsletter-success-actions';
    actionsContainer.innerHTML = `
        <p class="success-actions-text">While you're here:</p>
        <div class="success-actions-buttons">
            <a href="books/doraleous-associates/excerpt.html" class="btn btn-outline btn-sm">Read Free Excerpt</a>
            <a href="books/doraleous-associates/characters.html" class="btn btn-outline btn-sm">Meet the Characters</a>
        </div>
    `;
    
    form.appendChild(actionsContainer);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        actionsContainer.classList.add('fade-out');
        setTimeout(() => {
            actionsContainer.remove();
        }, 300);
    }, 10000);
}

function getFormLocation(form) {
    const formContainer = form.closest('section');
    if (formContainer) {
        return formContainer.className || formContainer.id || 'unknown';
    }
    return 'unknown';
}

function trackNewsletterSignup(data) {
    // Google Analytics event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'newsletter_signup', {
            event_category: 'engagement',
            event_label: data.source,
            value: 1
        });
    }
    
    // Facebook Pixel event
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            content_category: 'newsletter'
        });
    }
    
    // Custom tracking
    if (typeof AuthorWebsite !== 'undefined') {
        AuthorWebsite.trackEvent('newsletter_signup', {
            email: data.email,
            source: data.source,
            page_url: data.page_url
        });
    }
}

// Exit Intent Popup
function initializeExitIntentPopup() {
    if (hasVisitedBefore() || hasAlreadySubscribed()) {
        return;
    }
    
    let exitIntentTriggered = false;
    
    document.addEventListener('mouseleave', function(e) {
        if (e.clientY <= 0 && !exitIntentTriggered) {
            exitIntentTriggered = true;
            showExitIntentPopup();
        }
    });
    
    // Also trigger on scroll for mobile
    let scrollTriggered = false;
    window.addEventListener('scroll', function() {
        if (!scrollTriggered && window.scrollY > document.body.scrollHeight * 0.5) {
            scrollTriggered = true;
            setTimeout(() => {
                if (!exitIntentTriggered) {
                    exitIntentTriggered = true;
                    showExitIntentPopup();
                }
            }, 5000);
        }
    });
}

function showExitIntentPopup() {
    const popup = createExitIntentPopup();
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.classList.add('active');
    }, 100);
    
    // Track popup display
    if (typeof AuthorWebsite !== 'undefined') {
        AuthorWebsite.trackEvent('exit_intent_popup_shown', {
            page_url: window.location.href
        });
    }
}

function createExitIntentPopup() {
    const popup = document.createElement('div');
    popup.className = 'exit-intent-popup';
    popup.innerHTML = `
        <div class="exit-popup-overlay"></div>
        <div class="exit-popup-content">
            <button class="exit-popup-close" aria-label="Close popup">×</button>
            <div class="exit-popup-header">
                <h3>Wait! Don't Miss Out</h3>
                <p>Get the complete Character Guide and exclusive updates from the world of Doraleous!</p>
            </div>
            <form class="exit-popup-form newsletter-form">
                <div class="form-group">
                    <input type="email" name="email" placeholder="Enter your email" required>
                    <button type="submit" class="btn btn-primary">Get Free Guide</button>
                </div>
                <p class="exit-popup-privacy">Your email is safe with us. Unsubscribe anytime.</p>
            </form>
        </div>
    `;
    
    // Add event listeners
    const closeBtn = popup.querySelector('.exit-popup-close');
    const overlay = popup.querySelector('.exit-popup-overlay');
    
    [closeBtn, overlay].forEach(element => {
        element.addEventListener('click', function() {
            hideExitIntentPopup(popup);
        });
    });
    
    // Setup form
    const form = popup.querySelector('.newsletter-form');
    setupNewsletterForm(form);
    
    // Keyboard navigation
    popup.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideExitIntentPopup(popup);
        }
    });
    
    return popup;
}

function hideExitIntentPopup(popup) {
    popup.classList.remove('active');
    setTimeout(() => {
        popup.remove();
    }, 300);
    
    // Remember that user closed popup
    localStorage.setItem('exitIntentClosed', 'true');
}

function hasVisitedBefore() {
    return localStorage.getItem('hasVisited') === 'true';
}

function hasAlreadySubscribed() {
    return localStorage.getItem('newsletterSubscribed') === 'true';
}

// Mark as visited
localStorage.setItem('hasVisited', 'true');

// Export for use in other components
window.NewsletterSignup = {
    initialize: initializeNewsletterSignup,
    validateEmail: validateEmailInput,
    trackSignup: trackNewsletterSignup
};
