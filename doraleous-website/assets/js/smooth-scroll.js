/* ===================================
   SMOOTH SCROLL FUNCTIONALITY
   File: assets/js/smooth-scroll.js
   =================================== */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        offset: 80,              // Offset from top (accounting for fixed header)
        duration: 800,           // Animation duration in milliseconds
        easing: 'ease-in-out'    // CSS easing function
    };

    // Initialize smooth scroll functionality
    function init() {
        setupEventListeners();
        handleInitialHash();
    }

    // Setup event listeners for anchor links
    function setupEventListeners() {
        // Handle all anchor link clicks
        document.addEventListener('click', handleAnchorClick);
        
        // Handle hash changes (browser back/forward)
        window.addEventListener('hashchange', handleHashChange);
    }

    // Handle anchor link clicks
    function handleAnchorClick(e) {
        // Check if clicked element is an anchor link
        const link = e.target.closest('a[href^="#"]');
        
        if (!link) return;

        const href = link.getAttribute('href');
        
        // Skip empty or just "#" links
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        
        if (!target) return;

        // Prevent default link behavior
        e.preventDefault();
        
        // Perform smooth scroll
        smoothScrollTo(target);
        
        // Update URL hash
        updateURLHash(href);
    }

    // Handle browser back/forward navigation
    function handleHashChange() {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            const target = document.querySelector(hash);
            if (target) {
                smoothScrollTo(target, false); // Don't update URL again
            }
        }
    }

    // Handle initial page load with hash
    function handleInitialHash() {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                const target = document.querySelector(hash);
                if (target) {
                    smoothScrollTo(target, false);
                }
            }, 100);
        }
    }

    // Main smooth scroll function
    function smoothScrollTo(target, updateURL = true) {
        if (!target) return;

        // Calculate target position with offset
        const targetPosition = target.offsetTop - CONFIG.offset;
        
        // Use native smooth scrolling
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        // Update URL if requested
        if (updateURL && target.id) {
            updateURLHash('#' + target.id);
        }
    }

    // Update URL hash without triggering scroll
    function updateURLHash(hash) {
        if (history.pushState) {
            history.pushState(null, null, hash);
        } else {
            // Fallback for older browsers
            const currentScroll = window.pageYOffset;
            window.location.hash = hash;
            window.scrollTo(0, currentScroll);
        }
    }

    // Public API for manual scrolling
    window.SmoothScroll = {
        // Scroll to a target element or selector
        scrollTo: function(target) {
            const element = typeof target === 'string' ? 
                document.querySelector(target) : target;
            smoothScrollTo(element);
        },
        
        // Scroll to top of page
        scrollToTop: function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },
        
        // Update configuration
        updateConfig: function(newConfig) {
            Object.assign(CONFIG, newConfig);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
