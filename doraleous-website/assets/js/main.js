// Main JavaScript - Brian M. Shoemaker Author Website
// Core functionality for navigation, mobile menu, and general interactions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all core functionality
    initializeNavigation();
    initializeMobileMenu();
    initializeScrollEffects();
    initializeFormHandling();
    initializeSmoothScrolling();
    initializeUtilities();
    
    console.log('Website initialized successfully');
});

// Navigation Management
function initializeNavigation() {
    const nav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (!nav) return;
    
    // Handle navigation scroll effects
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        
        if (scrollPosition > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
    
    // Handle dropdown menus
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        
        if (dropdownMenu) {
            dropdown.addEventListener('mouseenter', function() {
                dropdownMenu.style.display = 'block';
                setTimeout(() => {
                    dropdownMenu.style.opacity = '1';
                    dropdownMenu.style.transform = 'translateY(0)';
                }, 10);
            });
            
            dropdown.addEventListener('mouseleave', function() {
                dropdownMenu.style.opacity = '0';
                dropdownMenu.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    dropdownMenu.style.display = 'none';
                }, 300);
            });
        }
    });
    
    // Handle active navigation states
    updateActiveNavigation();
}

// Mobile Menu Management
function initializeMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (!navToggle || !navMenu) return;
    
    // Toggle mobile menu
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
        document.body.classList.toggle('menu-open');
        
        // Animate hamburger lines
        const lines = navToggle.querySelectorAll('.hamburger-line');
        lines.forEach((line, index) => {
            if (navToggle.classList.contains('active')) {
                if (index === 0) {
                    line.style.transform = 'rotate(45deg) translate(5px, 5px)';
                } else if (index === 1) {
                    line.style.opacity = '0';
                } else if (index === 2) {
                    line.style.transform = 'rotate(-45deg) translate(7px, -6px)';
                }
            } else {
                line.style.transform = 'none';
                line.style.opacity = '1';
            }
        });
    });
    
    // Close mobile menu when clicking nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            document.body.classList.remove('menu-open');
            
            // Reset hamburger lines
            const lines = navToggle.querySelectorAll('.hamburger-line');
            lines.forEach(line => {
                line.style.transform = 'none';
                line.style.opacity = '1';
            });
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
}

// Scroll Effects Management
function initializeScrollEffects() {
    // Parallax effect for hero section
    const heroSection = document.querySelector('.hero-section');
    
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const parallaxSpeed = 0.5;
            
            heroSection.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
        });
    }
    
    // Fade in elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    
    // Observe elements that should fade in
    const fadeElements = document.querySelectorAll('.fade-on-scroll');
    fadeElements.forEach(element => {
        observer.observe(element);
    });
}

// Form Handling
function initializeFormHandling() {
    // Newsletter signup form
    const newsletterForm = document.getElementById('newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleNewsletterSignup(this);
        });
    }
    
    // Contact form
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleContactForm(this);
        });
    }
    
    // General form validation
    const allForms = document.querySelectorAll('form');
    
    allForms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateInput(this);
            });
            
            input.addEventListener('input', function() {
                clearValidationError(this);
            });
        });
    });
}

// Newsletter Signup Handler
function handleNewsletterSignup(form) {
    const emailInput = form.querySelector('input[type="email"]');
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (!emailInput || !submitButton) return;
    
    const email = emailInput.value.trim();
    
    if (!isValidEmail(email)) {
        showError(emailInput, 'Please enter a valid email address');
        return;
    }
    
    // Show loading state
    submitButton.textContent = 'Subscribing...';
    submitButton.disabled = true;
    
    // Simulate API call (replace with actual implementation)
    setTimeout(() => {
        // Success state
        showSuccess(form, 'Thank you for subscribing! Check your email for a confirmation.');
        form.reset();
        
        // Reset button
        submitButton.textContent = 'Subscribe';
        submitButton.disabled = false;
        
        // Track event (replace with actual analytics)
        trackEvent('newsletter_signup', { email: email });
    }, 2000);
}

// Contact Form Handler
function handleContactForm(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    
    if (!submitButton) return;
    
    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showError(field, 'This field is required');
            isValid = false;
        }
    });
    
    if (!isValid) return;
    
    // Show loading state
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    // Simulate API call (replace with actual implementation)
    setTimeout(() => {
        // Success state
        showSuccess(form, 'Thank you for your message! We\'ll get back to you soon.');
        form.reset();
        
        // Reset button
        submitButton.textContent = 'Send Message';
        submitButton.disabled = false;
        
        // Track event
        trackEvent('contact_form_submit', { 
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject')
        });
    }, 2000);
}

// Smooth Scrolling
function initializeSmoothScrolling() {
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.offsetTop;
                const offsetPosition = elementPosition - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Utility Functions
function initializeUtilities() {
    // Lazy loading for images
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if (lazyImages.length > 0) {
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Back to top button
    const backToTopButton = document.getElementById('back-to-top');
    
    if (backToTopButton) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });
        
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Active Navigation State Management
function updateActiveNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        const linkPath = link.getAttribute('href');
        
        if (linkPath === currentPath || 
            (currentPath.includes(linkPath) && linkPath !== '/')) {
            link.classList.add('active');
        }
    });
}

// Input Validation
function validateInput(input) {
    const value = input.value.trim();
    const type = input.type;
    const required = input.hasAttribute('required');
    
    clearValidationError(input);
    
    if (required && !value) {
        showError(input, 'This field is required');
        return false;
    }
    
    if (type === 'email' && value && !isValidEmail(value)) {
        showError(input, 'Please enter a valid email address');
        return false;
    }
    
    if (input.hasAttribute('minlength')) {
        const minLength = parseInt(input.getAttribute('minlength'));
        if (value.length < minLength) {
            showError(input, `Minimum ${minLength} characters required`);
            return false;
        }
    }
    
    return true;
}

// Error Display Functions
function showError(input, message) {
    clearValidationError(input);
    
    input.classList.add('error');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    input.parentNode.appendChild(errorElement);
}

function clearValidationError(input) {
    input.classList.remove('error');
    
    const errorMessage = input.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function showSuccess(form, message) {
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.textContent = message;
    
    form.appendChild(successElement);
    
    setTimeout(() => {
        successElement.remove();
    }, 5000);
}

// Utility Helper Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Analytics and Tracking
function trackEvent(eventName, properties = {}) {
    // Google Analytics 4 event tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
    }
    
    // Console log for development
    console.log('Event tracked:', eventName, properties);
}

// Page Load Performance Monitoring
function trackPageLoad() {
    window.addEventListener('load', function() {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        
        trackEvent('page_load_time', {
            load_time: loadTime,
            page_url: window.location.href
        });
    });
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    
    // Track errors (optional)
    trackEvent('javascript_error', {
        error_message: e.message,
        error_source: e.filename,
        error_line: e.lineno
    });
});

// Responsive Image Loading
function handleResponsiveImages() {
    const images = document.querySelectorAll('img[data-sizes]');
    
    images.forEach(img => {
        const sizes = JSON.parse(img.dataset.sizes);
        const currentWidth = window.innerWidth;
        
        let selectedSrc = img.src;
        
        for (const breakpoint in sizes) {
            if (currentWidth >= parseInt(breakpoint)) {
                selectedSrc = sizes[breakpoint];
            }
        }
        
        if (selectedSrc !== img.src) {
            img.src = selectedSrc;
        }
    });
}

// Initialize responsive images on load and resize
window.addEventListener('load', handleResponsiveImages);
window.addEventListener('resize', debounce(handleResponsiveImages, 250));

// Initialize page load tracking
trackPageLoad();

// Export functions for use in other scripts
window.AuthorWebsite = {
    trackEvent: trackEvent,
    validateInput: validateInput,
    showError: showError,
    clearValidationError: clearValidationError,
    showSuccess: showSuccess,
    isValidEmail: isValidEmail,
    debounce: debounce,
    throttle: throttle
};
