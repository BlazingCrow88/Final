/* ===================================
   ANIMATIONS AND VISUAL EFFECTS
   File: assets/js/animations.js
   =================================== */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Intersection Observer settings
        observerOptions: {
            threshold: [0, 0.1, 0.5, 1],
            rootMargin: '0px 0px -50px 0px'
        },
        
        // Animation settings
        animationDuration: 800,
        animationDelay: 100,
        staggerDelay: 150,
        
        // Performance settings
        reducedMotion: false,
        enableGPUAcceleration: true,
        throttleScrollEvents: true,
        
        // Animation classes
        classes: {
            fadeIn: 'animate-fade-in',
            fadeInUp: 'animate-fade-in-up',
            fadeInDown: 'animate-fade-in-down',
            fadeInLeft: 'animate-fade-in-left',
            fadeInRight: 'animate-fade-in-right',
            scaleIn: 'animate-scale-in',
            slideInUp: 'animate-slide-in-up',
            slideInDown: 'animate-slide-in-down',
            rotateIn: 'animate-rotate-in',
            bounceIn: 'animate-bounce-in'
        }
    };

    // State variables
    let intersectionObserver = null;
    let parallaxElements = [];
    let scrollPosition = 0;
    let windowHeight = window.innerHeight;
    let isScrolling = false;
    let animationQueue = [];

    // Initialize animations
    function init() {
        checkReducedMotionPreference();
        setupIntersectionObserver();
        setupScrollAnimations();
        setupHoverEffects();
        setupParallaxElements();
        setupCounterAnimations();
        setupTypewriterEffects();
        setupFloatingElements();
        setupMorphingElements();
        
        // Handle window resize
        window.addEventListener('resize', throttle(handleResize, 100));
        
        // Handle scroll events
        if (CONFIG.throttleScrollEvents) {
            window.addEventListener('scroll', throttle(handleScroll, 16));
        } else {
            window.addEventListener('scroll', handleScroll);
        }
    }

    // Check for reduced motion preference
    function checkReducedMotionPreference() {
        CONFIG.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (CONFIG.reducedMotion) {
            document.documentElement.classList.add('reduced-motion');
            CONFIG.animationDuration = 0;
            CONFIG.animationDelay = 0;
            CONFIG.staggerDelay = 0;
        }
    }

    // Setup Intersection Observer for scroll animations
    function setupIntersectionObserver() {
        if (!window.IntersectionObserver) {
            // Fallback for browsers without Intersection Observer
            setupFallbackAnimations();
            return;
        }

        intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateElement(entry.target);
                    
                    // Stop observing once animated (unless it should repeat)
                    if (!entry.target.hasAttribute('data-animate-repeat')) {
                        intersectionObserver.unobserve(entry.target);
                    }
                } else if (entry.target.hasAttribute('data-animate-repeat')) {
                    // Reset animation for repeating elements
                    resetElementAnimation(entry.target);
                }
            });
        }, CONFIG.observerOptions);

        // Observe all elements with animation attributes
        const animatedElements = document.querySelectorAll('[data-animate]');
        animatedElements.forEach(element => {
            // Add initial state
            element.classList.add('animate-initial');
            intersectionObserver.observe(element);
        });
    }

    // Setup scroll-based animations
    function setupScrollAnimations() {
        // Setup elements that animate based on scroll position
        const scrollElements = document.querySelectorAll('[data-scroll-animation]');
        scrollElements.forEach(element => {
            setupScrollBasedAnimation(element);
        });
    }

    // Setup hover effects
    function setupHoverEffects() {
        // Enhanced hover effects for cards and buttons
        const hoverElements = document.querySelectorAll('[data-hover-effect]');
        hoverElements.forEach(element => {
            setupHoverEffect(element);
        });

        // Magnetic hover effect for buttons
        const magneticElements = document.querySelectorAll('[data-magnetic]');
        magneticElements.forEach(element => {
            setupMagneticEffect(element);
        });
    }

    // Setup parallax elements
    function setupParallaxElements() {
        const parallaxEls = document.querySelectorAll('[data-parallax]');
        parallaxEls.forEach(element => {
            const speed = parseFloat(element.getAttribute('data-parallax')) || 0.5;
            parallaxElements.push({
                element: element,
                speed: speed,
                offset: element.offsetTop
            });
        });
    }

    // Setup counter animations
    function setupCounterAnimations() {
        const counters = document.querySelectorAll('[data-counter]');
        counters.forEach(counter => {
            setupCounterAnimation(counter);
        });
    }

    // Setup typewriter effects
    function setupTypewriterEffects() {
        const typewriters = document.querySelectorAll('[data-typewriter]');
        typewriters.forEach(element => {
            setupTypewriterEffect(element);
        });
    }

    // Setup floating elements
    function setupFloatingElements() {
        const floatingElements = document.querySelectorAll('[data-float]');
        floatingElements.forEach(element => {
            setupFloatingAnimation(element);
        });
    }

    // Setup morphing elements
    function setupMorphingElements() {
        const morphingElements = document.querySelectorAll('[data-morph]');
        morphingElements.forEach(element => {
            setupMorphingEffect(element);
        });
    }

    // Animate element when it comes into view
    function animateElement(element) {
        const animationType = element.getAttribute('data-animate');
        const delay = parseInt(element.getAttribute('data-animate-delay')) || 0;
        const duration = parseInt(element.getAttribute('data-animate-duration')) || CONFIG.animationDuration;
        
        // Add to animation queue for staggered animations
        if (element.hasAttribute('data-animate-stagger')) {
            addToAnimationQueue(element, animationType, delay, duration);
        } else {
            performAnimation(element, animationType, delay, duration);
        }
    }

    // Perform the actual animation
    function performAnimation(element, animationType, delay, duration) {
        if (CONFIG.reducedMotion) {
            element.classList.add('animate-complete');
            return;
        }

        setTimeout(() => {
            element.classList.remove('animate-initial');
            element.classList.add('animate-in-progress');
            
            // Apply animation class
            const animationClass = CONFIG.classes[animationType] || CONFIG.classes.fadeIn;
            element.classList.add(animationClass);
            
            // Mark as complete after animation duration
            setTimeout(() => {
                element.classList.remove('animate-in-progress');
                element.classList.add('animate-complete');
                
                // Emit custom event
                emitAnimationEvent(element, 'animationComplete');
            }, duration);
            
        }, delay);
    }

    // Reset element animation
    function resetElementAnimation(element) {
        const animationType = element.getAttribute('data-animate');
        const animationClass = CONFIG.classes[animationType] || CONFIG.classes.fadeIn;
        
        element.classList.remove('animate-complete', 'animate-in-progress', animationClass);
        element.classList.add('animate-initial');
    }

    // Add element to staggered animation queue
    function addToAnimationQueue(element, animationType, delay, duration) {
        const staggerGroup = element.getAttribute('data-animate-stagger');
        let queueGroup = animationQueue.find(group => group.name === staggerGroup);
        
        if (!queueGroup) {
            queueGroup = { name: staggerGroup, elements: [], index: 0 };
            animationQueue.push(queueGroup);
        }
        
        queueGroup.elements.push({ element, animationType, delay, duration });
        
        // Start staggered animation if this is the first element
        if (queueGroup.elements.length === 1) {
            processStaggeredAnimation(queueGroup);
        }
    }

    // Process staggered animations
    function processStaggeredAnimation(queueGroup) {
        if (queueGroup.index >= queueGroup.elements.length) return;
        
        const item = queueGroup.elements[queueGroup.index];
        performAnimation(item.element, item.animationType, item.delay, item.duration);
        
        queueGroup.index++;
        
        // Schedule next animation
        setTimeout(() => {
            processStaggeredAnimation(queueGroup);
        }, CONFIG.staggerDelay);
    }

    // Setup scroll-based animation
    function setupScrollBasedAnimation(element) {
        const animationType = element.getAttribute('data-scroll-animation');
        
        // Different scroll-based animations
        switch (animationType) {
            case 'progress-bar':
                setupProgressBarAnimation(element);
                break;
            case 'counter-scroll':
                setupScrollCounterAnimation(element);
                break;
            case 'reveal-text':
                setupTextRevealAnimation(element);
                break;
            case 'scale-on-scroll':
                setupScaleOnScrollAnimation(element);
                break;
        }
    }

    // Setup hover effect
    function setupHoverEffect(element) {
        const effectType = element.getAttribute('data-hover-effect');
        
        switch (effectType) {
            case 'lift':
                setupLiftHoverEffect(element);
                break;
            case 'glow':
                setupGlowHoverEffect(element);
                break;
            case 'tilt':
                setupTiltHoverEffect(element);
                break;
            case 'ripple':
                setupRippleHoverEffect(element);
                break;
        }
    }

    // Setup magnetic hover effect
    function setupMagneticEffect(element) {
        if (CONFIG.reducedMotion) return;
        
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const strength = parseFloat(element.getAttribute('data-magnetic')) || 0.3;
            const moveX = x * strength;
            const moveY = y * strength;
            
            element.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translate(0px, 0px)';
        });
    }

    // Setup counter animation
    function setupCounterAnimation(counter) {
        const target = parseInt(counter.getAttribute('data-counter'));
        const duration = parseInt(counter.getAttribute('data-counter-duration')) || 2000;
        const suffix = counter.getAttribute('data-counter-suffix') || '';
        
        // Start counter when element comes into view
        if (intersectionObserver) {
            const counterObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(counter, target, duration, suffix);
                        counterObserver.unobserve(counter);
                    }
                });
            });
            
            counterObserver.observe(counter);
        }
    }

    // Animate counter
    function animateCounter(element, target, duration, suffix) {
        let current = 0;
        const increment = target / (duration / 16); // 60fps
        
        const updateCounter = () => {
            current += increment;
            if (current >= target) {
                element.textContent = target + suffix;
                return;
            }
            
            element.textContent = Math.floor(current) + suffix;
            requestAnimationFrame(updateCounter);
        };
        
        updateCounter();
    }

    // Setup typewriter effect
    function setupTypewriterEffect(element) {
        const text = element.getAttribute('data-typewriter') || element.textContent;
        const speed = parseInt(element.getAttribute('data-typewriter-speed')) || 50;
        const delay = parseInt(element.getAttribute('data-typewriter-delay')) || 0;
        
        element.textContent = '';
        
        // Start typewriter when element comes into view
        if (intersectionObserver) {
            const typewriterObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            animateTypewriter(element, text, speed);
                        }, delay);
                        typewriterObserver.unobserve(element);
                    }
                });
            });
            
            typewriterObserver.observe(element);
        }
    }

    // Animate typewriter effect
    function animateTypewriter(element, text, speed) {
        let index = 0;
        
        const typeCharacter = () => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(typeCharacter, speed);
            }
        };
        
        typeCharacter();
    }

    // Setup floating animation
    function setupFloatingAnimation(element) {
        if (CONFIG.reducedMotion) return;
        
        const distance = parseFloat(element.getAttribute('data-float-distance')) || 20;
        const duration = parseFloat(element.getAttribute('data-float-duration')) || 3;
        const delay = parseFloat(element.getAttribute('data-float-delay')) || 0;
        
        element.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
        element.style.setProperty('--float-distance', `${distance}px`);
    }

    // Setup morphing effect
    function setupMorphingEffect(element) {
        const shapes = element.getAttribute('data-morph').split(',');
        const duration = parseInt(element.getAttribute('data-morph-duration')) || 2000;
        
        let currentIndex = 0;
        
        const morphNext = () => {
            currentIndex = (currentIndex + 1) % shapes.length;
            element.style.clipPath = shapes[currentIndex].trim();
        };
        
        setInterval(morphNext, duration);
    }

    // Handle scroll events
    function handleScroll() {
        scrollPosition = window.pageYOffset;
        
        // Update parallax elements
        updateParallaxElements();
        
        // Update scroll-based animations
        updateScrollAnimations();
        
        isScrolling = true;
        
        // Clear scrolling flag after scroll ends
        clearTimeout(window.scrollEndTimer);
        window.scrollEndTimer = setTimeout(() => {
            isScrolling = false;
        }, 100);
    }

    // Update parallax elements
    function updateParallaxElements() {
        if (CONFIG.reducedMotion) return;
        
        parallaxElements.forEach(item => {
            const elementTop = item.offset - scrollPosition;
            const rate = elementTop * item.speed;
            
            if (CONFIG.enableGPUAcceleration) {
                item.element.style.transform = `translate3d(0, ${rate}px, 0)`;
            } else {
                item.element.style.transform = `translateY(${rate}px)`;
            }
        });
    }

    // Update scroll-based animations
    function updateScrollAnimations() {
        const progressBars = document.querySelectorAll('[data-scroll-animation="progress-bar"]');
        progressBars.forEach(bar => {
            updateProgressBar(bar);
        });
    }

    // Update progress bar based on scroll
    function updateProgressBar(progressBar) {
        const rect = progressBar.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, 
            (windowHeight - rect.top) / (windowHeight + rect.height)
        ));
        
        const fillElement = progressBar.querySelector('.progress-fill') || progressBar;
        fillElement.style.width = `${progress * 100}%`;
    }

    // Handle window resize
    function handleResize() {
        windowHeight = window.innerHeight;
        
        // Recalculate parallax element offsets
        parallaxElements.forEach(item => {
            item.offset = item.element.offsetTop;
        });
    }

    // Setup lift hover effect
    function setupLiftHoverEffect(element) {
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'translateY(-8px)';
            element.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.2)';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translateY(0)';
            element.style.boxShadow = '';
        });
    }

    // Setup glow hover effect
    function setupGlowHoverEffect(element) {
        element.addEventListener('mouseenter', () => {
            element.style.boxShadow = '0 0 20px rgba(183, 136, 31, 0.6)';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.boxShadow = '';
        });
    }

    // Setup tilt hover effect
    function setupTiltHoverEffect(element) {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;
            
            const rotateX = (deltaY / rect.height) * 10;
            const rotateY = (deltaX / rect.width) * -10;
            
            element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    }

    // Setup ripple hover effect
    function setupRippleHoverEffect(element) {
        element.addEventListener('click', (e) => {
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            element.style.position = 'relative';
            element.style.overflow = 'hidden';
            element.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }

    // Fallback animations for browsers without Intersection Observer
    function setupFallbackAnimations() {
        const animatedElements = document.querySelectorAll('[data-animate]');
        
        const checkAnimations = () => {
            animatedElements.forEach(element => {
                const rect = element.getBoundingClientRect();
                const isVisible = rect.top < windowHeight && rect.bottom > 0;
                
                if (isVisible && element.classList.contains('animate-initial')) {
                    animateElement(element);
                }
            });
        };
        
        window.addEventListener('scroll', throttle(checkAnimations, 100));
        checkAnimations(); // Check on load
    }

    // Emit custom animation event
    function emitAnimationEvent(element, eventType) {
        const event = new CustomEvent(eventType, {
            detail: { element },
            bubbles: true
        });
        element.dispatchEvent(event);
    }

    // Utility: Throttle function
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

    // Public API
    window.Animations = {
        init: init,
        animateElement: animateElement,
        resetElement: resetElementAnimation,
        addCustomAnimation: (name, className) => {
            CONFIG.classes[name] = className;
        },
        updateConfig: (newConfig) => {
            Object.assign(CONFIG, newConfig);
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Add required CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-initial {
            opacity: 0;
        }
        
        .animate-fade-in {
            opacity: 1;
            transition: opacity ${CONFIG.animationDuration}ms ease;
        }
        
        .animate-fade-in-up {
            opacity: 1;
            transform: translateY(0);
            transition: opacity ${CONFIG.animationDuration}ms ease, transform ${CONFIG.animationDuration}ms ease;
        }
        
        .animate-initial.animate-fade-in-up {
            transform: translateY(30px);
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(var(--float-distance, -20px)); }
        }
        
        @keyframes ripple {
            to { transform: scale(4); opacity: 0; }
        }
        
        .reduced-motion * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    `;
    document.head.appendChild(style);

})();
