/* ===================================
   MAIN JAVASCRIPT ENTRY POINT
   File: assets/js/main.js
   =================================== */

(function() {
    'use strict';

    // Global configuration
    const SITE_CONFIG = {
        // Site information
        siteName: 'Brian M. Shoemaker',
        siteURL: 'https://brianmshoemaker.com',
        
        // Feature flags
        features: {
            analytics: true,
            smoothScroll: true,
            animations: true,
            lazyLoading: true,
            serviceWorker: false,
            darkMode: false,
            searchFunctionality: true
        },
        
        // Performance settings
        performance: {
            imageOptimization: true,
            cssMinification: true,
            jsMinification: true,
            preloadCriticalResources: true
        },
        
        // Third-party integrations
        integrations: {
            googleAnalytics: 'GA_MEASUREMENT_ID',
            mailchimp: 'MAILCHIMP_API_KEY',
            socialMedia: {
                facebook: 'brianmshoemaker',
                twitter: 'brianmshoemaker',
                instagram: 'brianmshoemaker',
                goodreads: 'brianmshoemaker'
            }
        }
    };

    // Module loading states
    const moduleStates = {
        navigation: false,
        animations: false,
        smoothScroll: false,
        formValidation: false,
        characterCarousel: false,
        lazyLoading: false,
        analytics: false
    };

    // Performance monitoring
    const performanceMetrics = {
        startTime: performance.now(),
        domContentLoaded: null,
        fullyLoaded: null,
        firstPaint: null,
        firstContentfulPaint: null
    };

    // Initialize the website
    function init() {
        // Record performance metrics
        recordPerformanceMetrics();
        
        // Setup error handling
        setupErrorHandling();
        
        // Initialize core functionality
        initializeCore();
        
        // Initialize modules based on page type
        initializeModules();
        
        // Setup third-party integrations
        setupIntegrations();
        
        // Setup accessibility features
        setupAccessibility();
        
        // Setup SEO enhancements
        setupSEO();
        
        // Setup performance optimizations
        setupPerformanceOptimizations();
        
        // Final initialization tasks
        finalizeInitialization();
    }

    // Record performance metrics
    function recordPerformanceMetrics() {
        // Record DOM content loaded time
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                performanceMetrics.domContentLoaded = performance.now() - performanceMetrics.startTime;
                console.log('DOM Content Loaded:', performanceMetrics.domContentLoaded + 'ms');
            });
        }

        // Record fully loaded time
        window.addEventListener('load', () => {
            performanceMetrics.fullyLoaded = performance.now() - performanceMetrics.startTime;
            console.log('Fully Loaded:', performanceMetrics.fullyLoaded + 'ms');
            
            // Report performance metrics
            reportPerformanceMetrics();
        });

        // Record paint metrics
        if ('PerformanceObserver' in window) {
            const paintObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (entry.name === 'first-paint') {
                        performanceMetrics.firstPaint = entry.startTime;
                    } else if (entry.name === 'first-contentful-paint') {
                        performanceMetrics.firstContentfulPaint = entry.startTime;
                    }
                });
            });
            
            paintObserver.observe({ entryTypes: ['paint'] });
        }
    }

    // Setup global error handling
    function setupErrorHandling() {
        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('JavaScript Error:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
            
            // Report to analytics if available
            if (SITE_CONFIG.features.analytics && typeof gtag !== 'undefined') {
                gtag('event', 'exception', {
                    description: event.message,
                    fatal: false
                });
            }
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            
            // Report to analytics if available
            if (SITE_CONFIG.features.analytics && typeof gtag !== 'undefined') {
                gtag('event', 'exception', {
                    description: 'Unhandled Promise Rejection: ' + event.reason,
                    fatal: false
                });
            }
        });
    }

    // Initialize core functionality
    function initializeCore() {
        // Set up viewport meta tag for mobile
        setupViewport();
        
        // Initialize theme system
        initializeTheme();
        
        // Setup browser detection
        detectBrowser();
        
        // Setup device detection
        detectDevice();
        
        // Initialize cache management
        initializeCacheManagement();
    }

    // Initialize modules based on what's needed
    function initializeModules() {
        const pageType = detectPageType();
        
        // Always load navigation
        initializeNavigation();
        
        // Load animations if enabled
        if (SITE_CONFIG.features.animations) {
            initializeAnimations();
        }
        
        // Load smooth scroll if enabled
        if (SITE_CONFIG.features.smoothScroll) {
            initializeSmoothScroll();
        }
        
        // Load form validation for pages with forms
        if (document.querySelector('form[data-validate]')) {
            initializeFormValidation();
        }
        
        // Load character carousel for relevant pages
        if (document.querySelector('.character-carousel')) {
            initializeCharacterCarousel();
        }
        
        // Load lazy loading if enabled
        if (SITE_CONFIG.features.lazyLoading) {
            initializeLazyLoading();
        }
        
        // Page-specific initializations
        switch (pageType) {
            case 'home':
                initializeHomePage();
                break;
            case 'book':
                initializeBookPage();
                break;
            case 'character':
                initializeCharacterPage();
                break;
            case 'contact':
                initializeContactPage();
                break;
            case 'blog':
                initializeBlogPage();
                break;
        }
    }

    // Initialize individual modules
    function initializeNavigation() {
        if (typeof window.Navigation !== 'undefined') {
            moduleStates.navigation = true;
            console.log('✓ Navigation module loaded');
        } else {
            console.warn('Navigation module not available');
        }
    }

    function initializeAnimations() {
        if (typeof window.Animations !== 'undefined') {
            moduleStates.animations = true;
            console.log('✓ Animations module loaded');
        } else {
            console.warn('Animations module not available');
        }
    }

    function initializeSmoothScroll() {
        if (typeof window.SmoothScroll !== 'undefined') {
            moduleStates.smoothScroll = true;
            console.log('✓ Smooth scroll module loaded');
        } else {
            console.warn('Smooth scroll module not available');
        }
    }

    function initializeFormValidation() {
        if (typeof window.FormValidation !== 'undefined') {
            moduleStates.formValidation = true;
            console.log('✓ Form validation module loaded');
        } else {
            console.warn('Form validation module not available');
        }
    }

    function initializeCharacterCarousel() {
        if (typeof window.CharacterCarousel !== 'undefined') {
            moduleStates.characterCarousel = true;
            console.log('✓ Character carousel module loaded');
        } else {
            console.warn('Character carousel module not available');
        }
    }

    function initializeLazyLoading() {
        if ('IntersectionObserver' in window) {
            setupLazyImageLoading();
            moduleStates.lazyLoading = true;
            console.log('✓ Lazy loading initialized');
        } else {
            console.warn('Lazy loading not supported');
        }
    }

    // Page-specific initializations
    function initializeHomePage() {
        console.log('Initializing home page...');
        
        // Initialize hero video if present
        initializeHeroVideo();
        
        // Initialize testimonials carousel
        initializeTestimonialsCarousel();
        
        // Initialize newsletter signup
        initializeNewsletterSignup();
        
        // Initialize book preview
        initializeBookPreview();
    }

    function initializeBookPage() {
        console.log('Initializing book page...');
        
        // Initialize book gallery
        initializeBookGallery();
        
        // Initialize purchase tracking
        initializePurchaseTracking();
        
        // Initialize reading progress
        initializeReadingProgress();
    }

    function initializeCharacterPage() {
        console.log('Initializing character page...');
        
        // Initialize character interactions
        initializeCharacterInteractions();
        
        // Initialize character comparison tool
        initializeCharacterComparison();
    }

    function initializeContactPage() {
        console.log('Initializing contact page...');
        
        // Initialize contact form enhancements
        initializeContactFormEnhancements();
        
        // Initialize map if present
        initializeContactMap();
    }

    function initializeBlogPage() {
        console.log('Initializing blog page...');
        
        // Initialize blog search
        initializeBlogSearch();
        
        // Initialize reading time calculator
        initializeReadingTime();
        
        // Initialize social sharing
        initializeSocialSharing();
    }

    // Setup third-party integrations
    function setupIntegrations() {
        // Google Analytics
        if (SITE_CONFIG.features.analytics) {
            setupGoogleAnalytics();
        }
        
        // Social media integration
        setupSocialMediaIntegration();
        
        // Email marketing integration
        setupEmailMarketing();
    }

    // Setup accessibility features
    function setupAccessibility() {
        // Skip navigation link
        createSkipNavigation();
        
        // Focus management
        setupFocusManagement();
        
        // ARIA enhancements
        enhanceARIA();
        
        // Keyboard navigation enhancements
        setupKeyboardNavigation();
        
        // Screen reader announcements
        setupScreenReaderAnnouncements();
    }

    // Setup SEO enhancements
    function setupSEO() {
        // Dynamic meta tags
        updateMetaTags();
        
        // Structured data
        addStructuredData();
        
        // Canonical URLs
        setCanonicalURL();
        
        // Open Graph tags
        updateOpenGraphTags();
    }

    // Setup performance optimizations
    function setupPerformanceOptimizations() {
        // Preload critical resources
        if (SITE_CONFIG.performance.preloadCriticalResources) {
            preloadCriticalResources();
        }
        
        // Optimize images
        if (SITE_CONFIG.performance.imageOptimization) {
            optimizeImages();
        }
        
        // Setup service worker
        if (SITE_CONFIG.features.serviceWorker) {
            setupServiceWorker();
        }
    }

    // Utility functions
    function detectPageType() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('/books/')) return 'book';
        if (path.includes('/characters')) return 'character';
        if (path.includes('/contact')) return 'contact';
        if (path.includes('/blog/')) return 'blog';
        if (path.includes('/about')) return 'about';
        
        return 'general';
    }

    function setupViewport() {
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0';
            document.head.appendChild(viewport);
        }
    }

    function initializeTheme() {
        // Check for saved theme preference or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        if (SITE_CONFIG.features.darkMode) {
            setupThemeToggle();
        }
    }

    function detectBrowser() {
        const userAgent = navigator.userAgent;
        let browserClass = '';
        
        if (userAgent.includes('Chrome')) {
            browserClass = 'browser-chrome';
        } else if (userAgent.includes('Firefox')) {
            browserClass = 'browser-firefox';
        } else if (userAgent.includes('Safari')) {
            browserClass = 'browser-safari';
        } else if (userAgent.includes('Edge')) {
            browserClass = 'browser-edge';
        }
        
        if (browserClass) {
            document.documentElement.classList.add(browserClass);
        }
    }

    function detectDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
        
        if (isMobile) {
            document.documentElement.classList.add('device-mobile');
        } else if (isTablet) {
            document.documentElement.classList.add('device-tablet');
        } else {
            document.documentElement.classList.add('device-desktop');
        }
    }

    function setupLazyImageLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }

    function setupGoogleAnalytics() {
        if (SITE_CONFIG.integrations.googleAnalytics && SITE_CONFIG.integrations.googleAnalytics !== 'GA_MEASUREMENT_ID') {
            // Load Google Analytics
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${SITE_CONFIG.integrations.googleAnalytics}`;
            document.head.appendChild(script);
            
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', SITE_CONFIG.integrations.googleAnalytics);
            
            // Make gtag globally available
            window.gtag = gtag;
            
            moduleStates.analytics = true;
            console.log('✓ Google Analytics loaded');
        }
    }

    function createSkipNavigation() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-navigation sr-only';
        skipLink.textContent = 'Skip to main content';
        
        skipLink.addEventListener('focus', () => {
            skipLink.classList.remove('sr-only');
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.classList.add('sr-only');
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    function reportPerformanceMetrics() {
        // Report to analytics if available
        if (moduleStates.analytics && typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', {
                name: 'page_load',
                value: Math.round(performanceMetrics.fullyLoaded)
            });
            
            if (performanceMetrics.firstContentfulPaint) {
                gtag('event', 'timing_complete', {
                    name: 'first_contentful_paint',
                    value: Math.round(performanceMetrics.firstContentfulPaint)
                });
            }
        }
        
        console.log('Performance Metrics:', performanceMetrics);
    }

    function finalizeInitialization() {
        // Mark site as fully initialized
        document.documentElement.classList.add('site-initialized');
        
        // Emit site ready event
        const siteReadyEvent = new CustomEvent('siteReady', {
            detail: {
                modules: moduleStates,
                performance: performanceMetrics,
                config: SITE_CONFIG
            }
        });
        document.dispatchEvent(siteReadyEvent);
        
        console.log('🎉 Site initialization complete!');
        console.log('Loaded modules:', Object.keys(moduleStates).filter(key => moduleStates[key]));
    }

    // Placeholder functions for features to be implemented
    function initializeCacheManagement() { /* Implementation needed */ }
    function initializeHeroVideo() { /* Implementation needed */ }
    function initializeTestimonialsCarousel() { /* Implementation needed */ }
    function initializeNewsletterSignup() { /* Implementation needed */ }
    function initializeBookPreview() { /* Implementation needed */ }
    function initializeBookGallery() { /* Implementation needed */ }
    function initializePurchaseTracking() { /* Implementation needed */ }
    function initializeReadingProgress() { /* Implementation needed */ }
    function initializeCharacterInteractions() { /* Implementation needed */ }
    function initializeCharacterComparison() { /* Implementation needed */ }
    function initializeContactFormEnhancements() { /* Implementation needed */ }
    function initializeContactMap() { /* Implementation needed */ }
    function initializeBlogSearch() { /* Implementation needed */ }
    function initializeReadingTime() { /* Implementation needed */ }
    function initializeSocialSharing() { /* Implementation needed */ }
    function setupSocialMediaIntegration() { /* Implementation needed */ }
    function setupEmailMarketing() { /* Implementation needed */ }
    function setupFocusManagement() { /* Implementation needed */ }
    function enhanceARIA() { /* Implementation needed */ }
    function setupKeyboardNavigation() { /* Implementation needed */ }
    function setupScreenReaderAnnouncements() { /* Implementation needed */ }
    function updateMetaTags() { /* Implementation needed */ }
    function addStructuredData() { /* Implementation needed */ }
    function setCanonicalURL() { /* Implementation needed */ }
    function updateOpenGraphTags() { /* Implementation needed */ }
    function preloadCriticalResources() { /* Implementation needed */ }
    function optimizeImages() { /* Implementation needed */ }
    function setupServiceWorker() { /* Implementation needed */ }
    function setupThemeToggle() { /* Implementation needed */ }

    // Public API
    window.Site = {
        config: SITE_CONFIG,
        modules: moduleStates,
        performance: performanceMetrics,
        init: init
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
