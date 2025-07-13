/* ===================================
   SIMPLIFIED ANIMATIONS FOR DORALEOUS
   File: assets/js/simple-animations.js
   =================================== */

(function() {
    'use strict';

    // Simple configuration
    const CONFIG = {
        // Respect reduced motion preference
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        
        // Animation settings
        animationDuration: 800,
        observerOptions: {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        }
    };

    let observer = null;

    // Initialize animations
    function init() {
        if (CONFIG.reducedMotion) {
            // Skip animations for users who prefer reduced motion
            document.documentElement.classList.add('reduced-motion');
            return;
        }

        setupScrollAnimations();
        setupHoverEffects();
        setupFloatingElements();
        setupTypewriterEffect();
    }

    // Setup scroll-triggered animations
    function setupScrollAnimations() {
        if (!window.IntersectionObserver) return;

        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animationType = element.getAttribute('data-animate') || 'fade-in';
                    
                    element.classList.add('animate-' + animationType);
                    observer.unobserve(element);
                }
            });
        }, CONFIG.observerOptions);

        // Observe elements with data-animate attribute
        document.querySelectorAll('[data-animate]').forEach(element => {
            element.classList.add('animate-hidden');
            observer.observe(element);
        });
    }

    // Setup hover effects for fantasy elements
    function setupHoverEffects() {
        // Character cards hover effect
        document.querySelectorAll('.character-card, .blog-post-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
                card.style.boxShadow = '0 15px 30px rgba(52, 152, 219, 0.3)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            });
        });

        // Button hover effects
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '';
            });
        });

        // Social media icons glow effect
        document.querySelectorAll('.social-link').forEach(link => {
            link.addEventListener('mouseenter', () => {
                link.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.8)';
                link.style.transform = 'scale(1.1)';
            });
            
            link.addEventListener('mouseleave', () => {
                link.style.boxShadow = '';
                link.style.transform = 'scale(1)';
            });
        });
    }

    // Setup floating animation for magical elements
    function setupFloatingElements() {
        document.querySelectorAll('[data-float]').forEach(element => {
            const duration = element.getAttribute('data-float-duration') || '3s';
            const distance = element.getAttribute('data-float-distance') || '10px';
            
            element.style.animation = `float ${duration} ease-in-out infinite`;
            element.style.setProperty('--float-distance', distance);
        });
    }

    // Setup typewriter effect for hero text
    function setupTypewriterEffect() {
        const typewriterElements = document.querySelectorAll('[data-typewriter]');
        
        typewriterElements.forEach(element => {
            const text = element.getAttribute('data-typewriter') || element.textContent;
            const speed = parseInt(element.getAttribute('data-typewriter-speed')) || 100;
            
            // Clear text and start typing
            element.textContent = '';
            typeText(element, text, speed);
        });
    }

    // Typewriter animation function
    function typeText(element, text, speed) {
        let index = 0;
        
        function type() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(type, speed);
            }
        }
        
        // Start typing after a short delay
        setTimeout(type, 500);
    }

    // Utility function to add sparkle effect
    function addSparkleEffect(element) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ffd700;
            border-radius: 50%;
            animation: sparkle 1s ease-out forwards;
            pointer-events: none;
        `;
        
        const rect = element.getBoundingClientRect();
        sparkle.style.left = Math.random() * rect.width + 'px';
        sparkle.style.top = Math.random() * rect.height + 'px';
        
        element.style.position = 'relative';
        element.appendChild(sparkle);
        
        setTimeout(() => sparkle.remove(), 1000);
    }

    // Add sparkle effect to magical elements on click
    document.addEventListener('click', (e) => {
        if (e.target.hasAttribute('data-sparkle')) {
            addSparkleEffect(e.target);
        }
    });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        /* Hide elements initially */
        .animate-hidden {
            opacity: 0;
            transform: translateY(30px);
        }

        /* Fade in animation */
        .animate-fade-in {
            opacity: 1;
            transform: translateY(0);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }

        /* Slide in from left */
        .animate-slide-left {
            opacity: 1;
            transform: translateX(0);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .animate-hidden.animate-slide-left {
            transform: translateX(-50px);
        }

        /* Slide in from right */
        .animate-slide-right {
            opacity: 1;
            transform: translateX(0);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .animate-hidden.animate-slide-right {
            transform: translateX(50px);
        }

        /* Scale in animation */
        .animate-scale-in {
            opacity: 1;
            transform: scale(1);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .animate-hidden.animate-scale-in {
            transform: scale(0.8);
        }

        /* Floating animation */
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(var(--float-distance, -10px)); }
        }

        /* Sparkle animation */
        @keyframes sparkle {
            0% {
                opacity: 1;
                transform: scale(0) rotate(0deg);
            }
            50% {
                opacity: 1;
                transform: scale(1) rotate(180deg);
            }
            100% {
                opacity: 0;
                transform: scale(0) rotate(360deg);
            }
        }

        /* Hover transitions for all interactive elements */
        .btn, .character-card, .blog-post-card, .social-link {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        /* Reduced motion support */
        .reduced-motion *,
        .reduced-motion *:before,
        .reduced-motion *:after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            transform: none !important;
        }

        /* Fantasy-themed glow effects */
        .glow-effect {
            animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
            from { box-shadow: 0 0 10px rgba(52, 152, 219, 0.5); }
            to { box-shadow: 0 0 20px rgba(52, 152, 219, 0.8); }
        }
    `;
    
    document.head.appendChild(style);

    // Export simple API
    window.DoraleousAnimations = {
        addSparkle: addSparkleEffect,
        typeText: typeText
    };

})();
