/* ===================================
   AOS (ANIMATE ON SCROLL) LIBRARY
   File: assets/js/vendors/aos.js
   Note: This is a simplified version. For production, use the official AOS library.
   =================================== */

(function() {
    'use strict';
    
    const AOS = {
        // Configuration
        settings: {
            offset: 120,
            delay: 0,
            duration: 400,
            easing: 'ease',
            once: false,
            mirror: false,
            anchorPlacement: 'top-bottom',
            startEvent: 'DOMContentLoaded',
            animatedClassName: 'aos-animate',
            initClassName: 'aos-init',
            useClassNames: false,
            disableMutationObserver: false,
            debounceDelay: 50,
            throttleDelay: 99,
        },
        
        // Internal variables
        $aosElements: [],
        initialized: false,
        
        // Initialize AOS
        init: function(options) {
            if (this.initialized) return;
            
            // Merge options with defaults
            this.settings = Object.assign({}, this.settings, options);
            
            // Initialize on document ready
            if (document.readyState === 'loading') {
                document.addEventListener(this.settings.startEvent, () => {
                    this.refresh();
                });
            } else {
                this.refresh();
            }
            
            // Bind events
            this.bindEvents();
            
            this.initialized = true;
            return this.settings;
        },
        
        // Refresh AOS elements
        refresh: function(initialize = false) {
            if (initialize) this.initialized = false;
            
            this.$aosElements = this.getAOSElements();
            
            if (this.initialized) {
                this.refreshHard();
            }
            
            this.initialized = true;
        },
        
        // Hard refresh - recalculate all elements
        refreshHard: function() {
            this.$aosElements = this.getAOSElements();
            this.handleScroll();
        },
        
        // Get all AOS elements
        getAOSElements: function() {
            const elements = document.querySelectorAll('[data-aos]');
            return Array.from(elements).map(element => this.prepareElement(element));
        },
        
        // Prepare element for animation
        prepareElement: function(element) {
            const elementData = {
                node: element,
                name: element.getAttribute('data-aos'),
                offset: this.getOffset(element),
                delay: this.getDelay(element),
                duration: this.getDuration(element),
                easing: this.getEasing(element),
                once: this.getOnce(element),
                mirror: this.getMirror(element),
                animatedClassName: this.getAnimatedClassName(element),
                id: this.getId()
            };
            
            // Add initial class
            element.classList.add(this.settings.initClassName);
            
            // Set animation properties
            element.style.transition = `opacity ${elementData.duration}ms ${elementData.easing}, transform ${elementData.duration}ms ${elementData.easing}`;
            
            return elementData;
        },
        
        // Get offset value
        getOffset: function(element) {
            const offset = element.getAttribute('data-aos-offset');
            return offset ? parseInt(offset) : this.settings.offset;
        },
        
        // Get delay value
        getDelay: function(element) {
            const delay = element.getAttribute('data-aos-delay');
            return delay ? parseInt(delay) : this.settings.delay;
        },
        
        // Get duration value
        getDuration: function(element) {
            const duration = element.getAttribute('data-aos-duration');
            return duration ? parseInt(duration) : this.settings.duration;
        },
        
        // Get easing value
        getEasing: function(element) {
            const easing = element.getAttribute('data-aos-easing');
            return easing || this.settings.easing;
        },
        
        // Get once value
        getOnce: function(element) {
            const once = element.getAttribute('data-aos-once');
            return once !== null ? once === 'true' : this.settings.once;
        },
        
        // Get mirror value
        getMirror: function(element) {
            const mirror = element.getAttribute('data-aos-mirror');
            return mirror !== null ? mirror === 'true' : this.settings.mirror;
        },
        
        // Get animated class name
        getAnimatedClassName: function(element) {
            const className = element.getAttribute('data-aos-id');
            return className ? `${this.settings.animatedClassName}-${className}` : this.settings.animatedClassName;
        },
        
        // Generate unique ID
        getId: function() {
            return Math.random().toString(36).substr(2, 9);
        },
        
        // Bind scroll and resize events
        bindEvents: function() {
            window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), this.settings.throttleDelay));
            window.addEventListener('resize', this.debounce(this.handleScroll.bind(this), this.settings.debounceDelay));
        },
        
        // Handle scroll event
        handleScroll: function() {
            const windowHeight = window.innerHeight;
            const windowTop = window.pageYOffset;
            const windowBottom = windowTop + windowHeight;
            
            this.$aosElements.forEach(element => {
                const elementTop = element.node.offsetTop;
                const elementHeight = element.node.offsetHeight;
                const elementBottom = elementTop + elementHeight;
                
                // Calculate trigger points
                const triggerTop = elementTop + element.offset;
                const triggerBottom = elementBottom - element.offset;
                
                // Check if element should be animated
                const shouldAnimate = (
                    windowBottom >= triggerTop &&
                    windowTop <= triggerBottom
                );
                
                if (shouldAnimate) {
                    this.animateElement(element);
                } else if (element.mirror && !element.once) {
                    this.resetElement(element);
                }
            });
        },
        
        // Animate element
        animateElement: function(element) {
            if (element.animated) return;
            
            const delay = element.delay;
            
            if (delay) {
                setTimeout(() => {
                    this.applyAnimation(element);
                }, delay);
            } else {
                this.applyAnimation(element);
            }
        },
        
        // Apply animation to element
        applyAnimation: function(element) {
            element.node.classList.add(element.animatedClassName);
            element.animated = true;
            
            // Apply animation based on type
            this.applyAnimationType(element);
            
            // Fire custom event
            this.fireEvent('aos:in', element.node);
        },
        
        // Apply specific animation type
        applyAnimationType: function(element) {
            const animationType = element.name;
            
            switch (animationType) {
                case 'fade-up':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'translateY(0)';
                    break;
                case 'fade-down':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'translateY(0)';
                    break;
                case 'fade-left':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'translateX(0)';
                    break;
                case 'fade-right':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'translateX(0)';
                    break;
                case 'fade-up-right':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'translate(0, 0)';
                    break;
                case 'fade-up-left':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'translate(0, 0)';
                    break;
                case 'fade-down-right':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'translate(0, 0)';
                    break;
                case 'fade-down-left':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'translate(0, 0)';
                    break;
                case 'flip-up':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'rotateX(0)';
                    break;
                case 'flip-down':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'rotateX(0)';
                    break;
                case 'flip-left':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'rotateY(0)';
                    break;
                case 'flip-right':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'rotateY(0)';
                    break;
                case 'zoom-in':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'scale(1)';
                    break;
                case 'zoom-out':
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'scale(1)';
                    break;
                case 'slide-up':
                    element.node.style.transform = 'translateY(0)';
                    break;
                case 'slide-down':
                    element.node.style.transform = 'translateY(0)';
                    break;
                case 'slide-left':
                    element.node.style.transform = 'translateX(0)';
                    break;
                case 'slide-right':
                    element.node.style.transform = 'translateX(0)';
                    break;
                default:
                    element.node.style.opacity = '1';
                    element.node.style.transform = 'none';
            }
        },
        
        // Reset element animation
        resetElement: function(element) {
            if (!element.animated) return;
            
            element.node.classList.remove(element.animatedClassName);
            element.animated = false;
            
            // Reset styles based on animation type
            this.resetAnimationType(element);
            
            // Fire custom event
            this.fireEvent('aos:out', element.node);
        },
        
        // Reset animation type
        resetAnimationType: function(element) {
            const animationType = element.name;
            
            switch (animationType) {
                case 'fade-up':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'translateY(100px)';
                    break;
                case 'fade-down':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'translateY(-100px)';
                    break;
                case 'fade-left':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'translateX(-100px)';
                    break;
                case 'fade-right':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'translateX(100px)';
                    break;
                case 'fade-up-right':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'translate(100px, 100px)';
                    break;
                case 'fade-up-left':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'translate(-100px, 100px)';
                    break;
                case 'fade-down-right':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'translate(100px, -100px)';
                    break;
                case 'fade-down-left':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'translate(-100px, -100px)';
                    break;
                case 'flip-up':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'rotateX(90deg)';
                    break;
                case 'flip-down':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'rotateX(-90deg)';
                    break;
                case 'flip-left':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'rotateY(-90deg)';
                    break;
                case 'flip-right':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'rotateY(90deg)';
                    break;
                case 'zoom-in':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'scale(0.6)';
                    break;
                case 'zoom-out':
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'scale(1.2)';
                    break;
                case 'slide-up':
                    element.node.style.transform = 'translateY(100px)';
                    break;
                case 'slide-down':
                    element.node.style.transform = 'translateY(-100px)';
                    break;
                case 'slide-left':
                    element.node.style.transform = 'translateX(-100px)';
                    break;
                case 'slide-right':
                    element.node.style.transform = 'translateX(100px)';
                    break;
                default:
                    element.node.style.opacity = '0';
                    element.node.style.transform = 'none';
            }
        },
        
        // Fire custom event
        fireEvent: function(eventName, element) {
            const event = new CustomEvent(eventName, {
                bubbles: true,
                cancelable: true,
                detail: { element: element }
            });
            element.dispatchEvent(event);
        },
        
        // Utility: Throttle function
        throttle: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // Utility: Debounce function
        debounce: function(func, wait) {
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
    };
    
    // Initialize default styles
    const aosCSS = `
        [data-aos] {
            pointer-events: none;
        }
        
        [data-aos].aos-animate {
            pointer-events: auto;
        }
        
        [data-aos="fade-up"] {
            opacity: 0;
            transform: translateY(100px);
        }
        
        [data-aos="fade-down"] {
            opacity: 0;
            transform: translateY(-100px);
        }
        
        [data-aos="fade-left"] {
            opacity: 0;
            transform: translateX(-100px);
        }
        
        [data-aos="fade-right"] {
            opacity: 0;
            transform: translateX(100px);
        }
        
        [data-aos="fade-up-right"] {
            opacity: 0;
            transform: translate(100px, 100px);
        }
        
        [data-aos="fade-up-left"] {
            opacity: 0;
            transform: translate(-100px, 100px);
        }
        
        [data-aos="fade-down-right"] {
            opacity: 0;
            transform: translate(100px, -100px);
        }
        
        [data-aos="fade-down-left"] {
            opacity: 0;
            transform: translate(-100px, -100px);
        }
        
        [data-aos="flip-up"] {
            opacity: 0;
            transform: rotateX(90deg);
        }
        
        [data-aos="flip-down"] {
            opacity: 0;
            transform: rotateX(-90deg);
        }
        
        [data-aos="flip-left"] {
            opacity: 0;
            transform: rotateY(-90deg);
        }
        
        [data-aos="flip-right"] {
            opacity: 0;
            transform: rotateY(90deg);
        }
        
        [data-aos="zoom-in"] {
            opacity: 0;
            transform: scale(0.6);
        }
        
        [data-aos="zoom-out"] {
            opacity: 0;
            transform: scale(1.2);
        }
        
        [data-aos="slide-up"] {
            transform: translateY(100px);
        }
        
        [data-aos="slide-down"] {
            transform: translateY(-100px);
        }
        
        [data-aos="slide-left"] {
            transform: translateX(-100px);
        }
        
        [data-aos="slide-right"] {
            transform: translateX(100px);
        }
        
        @media (prefers-reduced-motion: reduce) {
            [data-aos] {
                animation: none !important;
                transition: none !important;
                opacity: 1 !important;
                transform: none !important;
            }
        }
    `;
    
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = aosCSS;
    document.head.appendChild(style);
    
    // Export AOS
    window.AOS = AOS;
    
    // AMD support
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return AOS;
        });
    }
    
    // CommonJS support
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AOS;
    }
    
})();
