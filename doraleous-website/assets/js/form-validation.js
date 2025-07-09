/* ===================================
   FORM VALIDATION FUNCTIONALITY
   File: assets/js/form-validation.js
   =================================== */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        showErrors: true,
        showSuccess: true,
        validateOnInput: true,
        validateOnBlur: true,
        scrollToError: true,
        errorClass: 'has-error',
        successClass: 'has-success',
        debounceDelay: 300
    };

    // Validation rules
    const VALIDATION_RULES = {
        required: {
            test: (value) => value && value.trim().length > 0,
            message: 'This field is required'
        },
        email: {
            test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: 'Please enter a valid email address'
        },
        phone: {
            test: (value) => /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, '')),
            message: 'Please enter a valid phone number'
        },
        minLength: {
            test: (value, min) => value && value.length >= min,
            message: (min) => `Must be at least ${min} characters long`
        },
        maxLength: {
            test: (value, max) => !value || value.length <= max,
            message: (max) => `Must be no more than ${max} characters long`
        },
        minWords: {
            test: (value, min) => value && value.trim().split(/\s+/).length >= min,
            message: (min) => `Must contain at least ${min} words`
        },
        url: {
            test: (value) => /^https?:\/\/.+\..+/.test(value),
            message: 'Please enter a valid URL (including http:// or https://)'
        },
        pattern: {
            test: (value, pattern) => new RegExp(pattern).test(value),
            message: (pattern) => 'Please match the required format'
        },
        confirm: {
            test: (value, confirmFieldId) => {
                const confirmField = document.getElementById(confirmFieldId);
                return confirmField && value === confirmField.value;
            },
            message: 'Fields do not match'
        }
    };

    // Error messages container
    const ERROR_MESSAGES = {
        generic: 'Please check your input',
        network: 'Network error. Please try again.',
        server: 'Server error. Please try again later.',
        timeout: 'Request timed out. Please try again.'
    };

    // State
    let validatedForms = new Map();
    let submitButtons = new Map();

    // Initialize form validation
    function init() {
        setupFormValidation();
        setupRealTimeValidation();
        setupSubmissionHandling();
        setupAccessibility();
    }

    // Setup form validation for all forms
    function setupFormValidation() {
        const forms = document.querySelectorAll('form[data-validate]');
        
        forms.forEach(form => {
            const formValidator = new FormValidator(form);
            validatedForms.set(form, formValidator);
            
            // Setup form submission
            form.addEventListener('submit', (e) => {
                handleFormSubmission(e, formValidator);
            });
        });
    }

    // Setup real-time validation
    function setupRealTimeValidation() {
        if (CONFIG.validateOnInput || CONFIG.validateOnBlur) {
            document.addEventListener('input', debounce(handleInputValidation, CONFIG.debounceDelay));
            document.addEventListener('blur', handleBlurValidation, true);
        }
    }

    // Setup form submission handling
    function setupSubmissionHandling() {
        // Track submit buttons
        const submitBtns = document.querySelectorAll('button[type="submit"], input[type="submit"]');
        submitBtns.forEach(btn => {
            const form = btn.closest('form');
            if (form) {
                submitButtons.set(btn, form);
            }
        });
    }

    // Setup accessibility features
    function setupAccessibility() {
        // Add ARIA attributes to form fields
        const formFields = document.querySelectorAll('[data-validate]');
        formFields.forEach(field => {
            if (!field.getAttribute('aria-describedby')) {
                const errorId = `${field.id || 'field'}-error`;
                field.setAttribute('aria-describedby', errorId);
            }
        });
    }

    // FormValidator class
    class FormValidator {
        constructor(form) {
            this.form = form;
            this.fields = this.form.querySelectorAll('[data-validate]');
            this.errors = new Map();
            this.isValid = false;
            
            this.setupFields();
        }

        setupFields() {
            this.fields.forEach(field => {
                this.createErrorElement(field);
            });
        }

        createErrorElement(field) {
            const errorId = field.getAttribute('aria-describedby') || `${field.id || 'field'}-error`;
            let errorElement = document.getElementById(errorId);
            
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = errorId;
                errorElement.className = 'form-error-message';
                errorElement.setAttribute('role', 'alert');
                errorElement.setAttribute('aria-live', 'polite');
                
                // Insert after the field or its wrapper
                const wrapper = field.closest('.form-group') || field.closest('.form-field');
                if (wrapper) {
                    wrapper.appendChild(errorElement);
                } else {
                    field.parentNode.insertBefore(errorElement, field.nextSibling);
                }
            }
        }

        validateField(field) {
            const rules = this.parseValidationRules(field);
            const value = this.getFieldValue(field);
            const errors = [];

            rules.forEach(rule => {
                if (!this.testRule(rule, value, field)) {
                    errors.push(this.getRuleMessage(rule, field));
                }
            });

            this.setFieldErrors(field, errors);
            return errors.length === 0;
        }

        parseValidationRules(field) {
            const rulesString = field.getAttribute('data-validate');
            const rules = [];

            if (!rulesString) return rules;

            // Parse rules like "required|email|minLength:5"
            const ruleParts = rulesString.split('|');
            
            ruleParts.forEach(rulePart => {
                const [ruleName, ruleValue] = rulePart.split(':');
                rules.push({
                    name: ruleName.trim(),
                    value: ruleValue ? ruleValue.trim() : null
                });
            });

            return rules;
        }

        getFieldValue(field) {
            if (field.type === 'checkbox') {
                return field.checked;
            } else if (field.type === 'radio') {
                const radioGroup = this.form.querySelectorAll(`input[name="${field.name}"]`);
                const checked = Array.from(radioGroup).find(radio => radio.checked);
                return checked ? checked.value : '';
            } else {
                return field.value || '';
            }
        }

        testRule(rule, value, field) {
            const validator = VALIDATION_RULES[rule.name];
            if (!validator) return true;

            if (rule.name === 'required') {
                if (field.type === 'checkbox') {
                    return field.checked;
                } else {
                    return validator.test(value);
                }
            }

            // Skip validation for empty non-required fields
            if (!value && rule.name !== 'required') {
                return true;
            }

            if (rule.value) {
                return validator.test(value, rule.value);
            } else {
                return validator.test(value);
            }
        }

        getRuleMessage(rule, field) {
            const validator = VALIDATION_RULES[rule.name];
            if (!validator) return ERROR_MESSAGES.generic;

            // Check for custom message on field
            const customMessage = field.getAttribute(`data-${rule.name}-message`);
            if (customMessage) return customMessage;

            // Use validator message
            if (typeof validator.message === 'function') {
                return validator.message(rule.value);
            } else {
                return validator.message;
            }
        }

        setFieldErrors(field, errors) {
            const fieldGroup = field.closest('.form-group') || field.closest('.form-field');
            const errorElement = document.getElementById(field.getAttribute('aria-describedby'));

            if (errors.length > 0) {
                this.errors.set(field, errors);
                
                if (CONFIG.showErrors) {
                    if (fieldGroup) {
                        fieldGroup.classList.remove(CONFIG.successClass);
                        fieldGroup.classList.add(CONFIG.errorClass);
                    }
                    
                    if (errorElement) {
                        errorElement.textContent = errors[0]; // Show first error
                        errorElement.style.display = 'block';
                    }
                    
                    field.setAttribute('aria-invalid', 'true');
                }
            } else {
                this.errors.delete(field);
                
                if (fieldGroup) {
                    fieldGroup.classList.remove(CONFIG.errorClass);
                    if (CONFIG.showSuccess && field.value) {
                        fieldGroup.classList.add(CONFIG.successClass);
                    }
                }
                
                if (errorElement) {
                    errorElement.textContent = '';
                    errorElement.style.display = 'none';
                }
                
                field.setAttribute('aria-invalid', 'false');
            }
        }

        validateForm() {
            let isValid = true;
            const firstErrorField = null;

            this.fields.forEach(field => {
                const fieldValid = this.validateField(field);
                if (!fieldValid && isValid) {
                    // Track first error for scrolling
                    if (CONFIG.scrollToError) {
                        this.scrollToField(field);
                    }
                }
                isValid = isValid && fieldValid;
            });

            this.isValid = isValid;
            return isValid;
        }

        scrollToField(field) {
            const headerHeight = document.querySelector('.main-navigation')?.offsetHeight || 80;
            const fieldPosition = field.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: fieldPosition,
                behavior: 'smooth'
            });
            
            // Focus the field after scrolling
            setTimeout(() => {
                field.focus();
            }, 500);
        }

        getFormData() {
            const formData = new FormData(this.form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                if (data[key]) {
                    // Handle multiple values (checkboxes, etc.)
                    if (Array.isArray(data[key])) {
                        data[key].push(value);
                    } else {
                        data[key] = [data[key], value];
                    }
                } else {
                    data[key] = value;
                }
            }
            
            return data;
        }

        showFormMessage(message, type = 'success') {
            let messageElement = this.form.querySelector('.form-message');
            
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.className = 'form-message';
                messageElement.setAttribute('role', 'status');
                messageElement.setAttribute('aria-live', 'polite');
                this.form.insertBefore(messageElement, this.form.firstChild);
            }
            
            messageElement.className = `form-message form-message-${type}`;
            messageElement.textContent = message;
            messageElement.style.display = 'block';
            
            // Auto-hide success messages
            if (type === 'success') {
                setTimeout(() => {
                    messageElement.style.display = 'none';
                }, 5000);
            }
        }

        clearFormErrors() {
            this.errors.clear();
            
            this.fields.forEach(field => {
                const fieldGroup = field.closest('.form-group') || field.closest('.form-field');
                const errorElement = document.getElementById(field.getAttribute('aria-describedby'));
                
                if (fieldGroup) {
                    fieldGroup.classList.remove(CONFIG.errorClass, CONFIG.successClass);
                }
                
                if (errorElement) {
                    errorElement.textContent = '';
                    errorElement.style.display = 'none';
                }
                
                field.setAttribute('aria-invalid', 'false');
            });
        }

        reset() {
            this.clearFormErrors();
            this.form.reset();
            
            // Hide form message
            const messageElement = this.form.querySelector('.form-message');
            if (messageElement) {
                messageElement.style.display = 'none';
            }
        }
    }

    // Event handlers
    function handleInputValidation(e) {
        if (!CONFIG.validateOnInput) return;
        
        const field = e.target;
        if (field.hasAttribute('data-validate')) {
            const form = field.closest('form');
            const validator = validatedForms.get(form);
            
            if (validator) {
                validator.validateField(field);
            }
        }
    }

    function handleBlurValidation(e) {
        if (!CONFIG.validateOnBlur) return;
        
        const field = e.target;
        if (field.hasAttribute('data-validate')) {
            const form = field.closest('form');
            const validator = validatedForms.get(form);
            
            if (validator) {
                validator.validateField(field);
            }
        }
    }

    function handleFormSubmission(e, validator) {
        e.preventDefault();
        
        const form = validator.form;
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        
        // Show loading state
        if (submitButton) {
            setSubmitButtonState(submitButton, 'loading');
        }
        
        // Validate form
        const isValid = validator.validateForm();
        
        if (isValid) {
            // Submit form
            submitForm(validator);
        } else {
            // Reset submit button
            if (submitButton) {
                setSubmitButtonState(submitButton, 'error');
                setTimeout(() => {
                    setSubmitButtonState(submitButton, 'default');
                }, 2000);
            }
        }
    }

    function setSubmitButtonState(button, state) {
        const originalText = button.getAttribute('data-original-text') || button.textContent;
        
        if (!button.hasAttribute('data-original-text')) {
            button.setAttribute('data-original-text', originalText);
        }
        
        switch (state) {
            case 'loading':
                button.textContent = 'Sending...';
                button.disabled = true;
                button.classList.add('btn-loading');
                break;
            case 'success':
                button.textContent = 'Sent!';
                button.disabled = true;
                button.classList.remove('btn-loading');
                button.classList.add('btn-success');
                break;
            case 'error':
                button.textContent = 'Error - Try Again';
                button.disabled = false;
                button.classList.remove('btn-loading');
                button.classList.add('btn-error');
                break;
            default:
                button.textContent = originalText;
                button.disabled = false;
                button.classList.remove('btn-loading', 'btn-success', 'btn-error');
        }
    }

    async function submitForm(validator) {
        const form = validator.form;
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        const action = form.getAttribute('action') || '/submit-form';
        const method = form.getAttribute('method') || 'POST';
        
        try {
            const formData = validator.getFormData();
            
            // For demo purposes - replace with actual form submission
            const response = await fetch(action, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                // Success
                if (submitButton) {
                    setSubmitButtonState(submitButton, 'success');
                }
                
                validator.showFormMessage('Thank you! Your message has been sent successfully.', 'success');
                
                // Reset form after delay
                setTimeout(() => {
                    validator.reset();
                    if (submitButton) {
                        setSubmitButtonState(submitButton, 'default');
                    }
                }, 3000);
                
                // Track form submission
                trackFormSubmission(form.id || 'unknown', 'success');
                
            } else {
                throw new Error('Server error');
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            
            if (submitButton) {
                setSubmitButtonState(submitButton, 'error');
                setTimeout(() => {
                    setSubmitButtonState(submitButton, 'default');
                }, 3000);
            }
            
            validator.showFormMessage('Sorry, there was an error sending your message. Please try again.', 'error');
            
            // Track form submission error
            trackFormSubmission(form.id || 'unknown', 'error');
        }
    }

    function trackFormSubmission(formId, status) {
        // Integrate with analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submission', {
                form_id: formId,
                status: status,
                event_category: 'engagement'
            });
        }
        
        console.log('Form submission tracked:', formId, status);
    }

    // Utility functions
    function debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Public API
    window.FormValidation = {
        init: init,
        validate: (formSelector) => {
            const form = document.querySelector(formSelector);
            const validator = validatedForms.get(form);
            return validator ? validator.validateForm() : false;
        },
        addRule: (name, rule) => {
            VALIDATION_RULES[name] = rule;
        },
        getValidator: (formSelector) => {
            const form = document.querySelector(formSelector);
            return validatedForms.get(form);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
