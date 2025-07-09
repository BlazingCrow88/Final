/* ===================================
   SMOOTH SCROLL FUNCTIONALITY
   File: assets/js/smooth-scroll.js
   =================================== */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        duration: 800,           // Animation duration in milliseconds
        easing: 'easeInOutCubic', // Easing function
        offset: 80,              // Offset from top (accounting for fixed header)
        updateURL: true,         // Update URL hash during scroll
        emitEvents: true,        // Emit custom events
        disableForReducedMotion: true // Respect user's motion preferences
    };

    // Easing functions
    const EASING_FUNCTIONS = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2
    };

    // State variables
    let isScrolling = false;
    let scrollAnimation = null;
    let currentTarget = null;

    // Initialize smooth scroll functionality
    function init() {
        // Check for reduced motion preference
        if (CONFIG.disableForReducedMotion && prefersReducedMotion()) {
            console.log('Smooth scroll disabled due to reduced motion preference');
            return;
        }

        setupEventListeners();
        setupIntersectionObserver();
        setupScrollIndicator();
        handleInitialHash();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Handle anchor link clicks
        document.addEventListener('click', handleAnchorClick);

        // Handle keyboard navigation
        document.addEventListener('keydown', handleKeydown);

        // Handle scroll events for active section highlighting
        window.addEventListener('scroll', throttle(handleScroll, 16));

        // Handle hash changes
        window.addEventListener('hashchange', handleHashChange);

        // Handle browser back/forward buttons
        window.addEventListener('popstate', handlePopState);
    }

    // Setup intersection observer for active section detection
    function setupIntersectionObserver() {
        const sections = document.querySelectorAll('section[id], div[id]');
        
        if (sections.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: `-${CONFIG.offset}px 0px -60% 0px`,
            threshold: [0, 0.1, 0.5]
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateActiveNavigation(entry.target.id);
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            observer.observe(section);
        });
    }

    // Setup scroll indicator
    function setupScrollIndicator() {
        const scrollIndicator = document.querySelector('.scroll-indicator');
        
        if (scrollIndicator) {
            scrollIndicator.addEventListener('click', (e) => {
                e.preventDefault();
                const target = scrollIndicator.getAttribute('href') || '#about';
                smoothScrollTo(target);
            });

            // Hide scroll indicator after initial scroll
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > window.innerHeight * 0.5) {
                    scrollIndicator.style.opacity = '0';
                    scrollIndicator.style.pointerEvents = 'none';
                }
            });
        }
    }

    // Handle initial page load with hash
    function handleInitialHash() {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            // Delay to ensure page is fully loaded
            setTimeout(() => {
                smoothScrollTo(hash, false); // Don't update URL on initial load
            }, 100);
        }
    }

    // Handle anchor link clicks
    function handleAnchorClick(e) {
        const link = e.target.closest('a[href^="#"]');
        
        if (!link) return;

        const href = link.getAttribute('href');
        const target = document.querySelector(href);

        if (!target || href === '#') return;

        e.preventDefault();

        // Add click animation to link
        animateLink(link);

        // Perform smooth scroll
        smoothScrollTo(href);
    }

    // Handle keyboard navigation
    function handleKeydown(e) {
        // Page Down / Space
        if (e.key === 'PageDown' || (e.key === ' ' && !isInputFocused())) {
            e.preventDefault();
            smoothScrollBy(window.innerHeight * 0.8);
        }
        // Page Up
        else if (e.key === 'PageUp') {
            e.preventDefault();
            smoothScrollBy(-window.innerHeight * 0.8);
        }
        // Home
        else if (e.key === 'Home' && e.ctrlKey) {
            e.preventDefault();
            smoothScrollTo('#', false);
        }
        // End
        else if (e.key === 'End' && e.ctrlKey) {
            e.preventDefault();
            smoothScrollToBottom();
        }
    }

    // Handle scroll events
    function handleScroll() {
        updateScrollProgress();
        
        // Emit scroll event
        if (CONFIG.emitEvents) {
            emitScrollEvent();
        }
    }

    // Handle hash changes
    function handleHashChange() {
        if (!isScrolling) {
            const hash = window.location.hash;
            if (hash && hash.length > 1) {
                smoothScrollTo(hash, false);
            }
        }
    }

    // Handle popstate events
    function handlePopState() {
        if (!isScrolling) {
            const hash = window.location.hash;
            if (hash && hash.length > 1) {
                smoothScrollTo(hash, false);
            }
        }
    }

    // Main smooth scroll function
    function smoothScrollTo(target, updateURL = CONFIG.updateURL) {
        if (isScrolling) {
            cancelScrollAnimation();
        }

        const targetElement = typeof target === 'string' ? 
            document.querySelector(target) : target;

        if (!targetElement && target !== '#') {
            console.warn('Smooth scroll target not found:', target);
            return;
        }

        const startPosition = window.pageYOffset;
        const targetPosition = target === '#' ? 0 : 
            targetElement.offsetTop - CONFIG.offset;
        const distance = targetPosition - startPosition;

        if (Math.abs(distance) < 10) return; // Already close enough

        currentTarget = targetElement;
        isScrolling = true;

        // Emit start event
        if (CONFIG.emitEvents) {
            emitEvent('smoothScrollStart', { target: targetElement, distance });
        }

        // Start animation
        animateScroll(startPosition, targetPosition, distance, updateURL, target);
    }

    // Smooth scroll by relative amount
    function smoothScrollBy(distance) {
        const startPosition = window.pageYOffset;
        const targetPosition = Math.max(0, 
            Math.min(startPosition + distance, getMaxScrollPosition()));
        
        animateScroll(startPosition, targetPosition, distance, false);
    }

    // Smooth scroll to bottom
    function smoothScrollToBottom() {
        const startPosition = window.pageYOffset;
        const targetPosition = getMaxScrollPosition();
        const distance = targetPosition - startPosition;
        
        animateScroll(startPosition, targetPosition, distance, false);
    }

    // Animate scroll
    function animateScroll(start, target, distance, updateURL, hash) {
        const startTime = performance.now();
        const easingFunction = EASING_FUNCTIONS[CONFIG.easing] || EASING_FUNCTIONS.easeInOutCubic;

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / CONFIG.duration, 1);
            const easeProgress = easingFunction(progress);
            
            const currentPosition = start + (distance * easeProgress);
            window.scrollTo(0, currentPosition);

            if (progress < 1) {
                scrollAnimation = requestAnimationFrame(animate);
            } else {
                // Animation complete
                onScrollComplete(updateURL, hash);
            }
        }

        scrollAnimation = requestAnimationFrame(animate);
    }

    // Handle scroll completion
    function onScrollComplete(updateURL, hash) {
        isScrolling = false;
        scrollAnimation = null;

        // Update URL hash
        if (updateURL && hash && hash !== '#') {
            updateURLHash(hash);
        }

        // Emit complete event
        if (CONFIG.emitEvents) {
            emitEvent('smoothScrollComplete', { target: currentTarget });
        }

        currentTarget = null;
    }

    // Cancel current scroll animation
    function cancelScrollAnimation() {
        if (scrollAnimation) {
            cancelAnimationFrame(scrollAnimation);
            scrollAnimation = null;
        }
        isScrolling = false;
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

    // Update active navigation highlighting
    function updateActiveNavigation(activeId) {
        // Remove active class from all nav links
        const navLinks = document.querySelectorAll('.nav-link, .footer-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to matching nav link
        const activeLink = document.querySelector(`a[href="#${activeId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Emit section change event
        if (CONFIG.emitEvents) {
            emitEvent('activeSectionChanged', { sectionId: activeId });
        }
    }

    // Update scroll progress indicator
    function updateScrollProgress() {
        const scrollProgress = getScrollProgress();
        const progressBars = document.querySelectorAll('.scroll-progress-bar');
        
        progressBars.forEach(bar => {
            bar.style.width = `${scrollProgress}%`;
        });

        // Update progress in document
        document.documentElement.style.setProperty('--scroll-progress', scrollProgress / 100);
    }

    // Animate clicked link
    function animateLink(link) {
        link.style.transform = 'scale(0.95)';
        setTimeout(() => {
            link.style.transform = '';
        }, 150);
    }

    // Utility functions
    function getScrollProgress() {
        const scrollTop = window.pageYOffset;
        const docHeight = getMaxScrollPosition();
        return docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    }

    function getMaxScrollPosition() {
        return Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        ) - window.innerHeight;
    }

    function isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );
    }

    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    function emitEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    function emitScrollEvent() {
        const scrollData = {
            position: window.pageYOffset,
            progress: getScrollProgress(),
            direction: getScrollDirection()
        };
        
        emitEvent('smoothScroll', scrollData);
    }

    // Track scroll direction
    let lastScrollPosition = 0;
    function getScrollDirection() {
        const currentPosition = window.pageYOffset;
        const direction = currentPosition > lastScrollPosition ? 'down' : 'up';
        lastScrollPosition = currentPosition;
        return direction;
    }

    // Public API
    window.SmoothScroll = {
        scrollTo: smoothScrollTo,
        scrollBy: smoothScrollBy,
        scrollToTop: () => smoothScrollTo('#'),
        scrollToBottom: smoothScrollToBottom,
        isScrolling: () => isScrolling,
        cancel: cancelScrollAnimation,
        updateConfig: (newConfig) => Object.assign(CONFIG, newConfig)
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
