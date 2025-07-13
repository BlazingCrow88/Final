/* ===================================
   SIMPLE SLIDER FOR BOOK WEBSITE
   File: assets/js/simple-slider.js
   =================================== */

(function() {
    'use strict';

    class SimpleSlider {
        constructor(element, options = {}) {
            this.slider = typeof element === 'string' ? document.querySelector(element) : element;
            
            if (!this.slider) {
                console.error('Slider element not found');
                return;
            }

            // Default options
            this.options = {
                slidesToShow: 1,
                autoplay: true,
                autoplaySpeed: 4000,
                showArrows: true,
                showDots: true,
                infinite: true,
                speed: 300,
                ...options
            };

            this.currentSlide = 0;
            this.slides = [];
            this.totalSlides = 0;
            this.isAnimating = false;
            this.autoplayTimer = null;

            this.init();
        }

        init() {
            this.setupSlides();
            this.createNavigation();
            this.bindEvents();
            this.goToSlide(0);
            
            if (this.options.autoplay) {
                this.startAutoplay();
            }
        }

        setupSlides() {
            const slideElements = this.slider.querySelectorAll('.slide');
            this.slides = Array.from(slideElements);
            this.totalSlides = this.slides.length;

            if (this.totalSlides === 0) {
                console.warn('No slides found');
                return;
            }

            // Wrap slides in container
            const wrapper = document.createElement('div');
            wrapper.className = 'slider-wrapper';
            
            this.slides.forEach((slide, index) => {
                slide.style.display = index === 0 ? 'block' : 'none';
                slide.classList.add('slider-slide');
                wrapper.appendChild(slide);
            });

            this.slider.appendChild(wrapper);
            this.wrapper = wrapper;
        }

        createNavigation() {
            // Create navigation container
            const nav = document.createElement('div');
            nav.className = 'slider-nav';

            // Create arrows
            if (this.options.showArrows && this.totalSlides > 1) {
                const prevBtn = document.createElement('button');
                prevBtn.className = 'slider-arrow slider-prev';
                prevBtn.innerHTML = '‹';
                prevBtn.setAttribute('aria-label', 'Previous slide');

                const nextBtn = document.createElement('button');
                nextBtn.className = 'slider-arrow slider-next';
                nextBtn.innerHTML = '›';
                nextBtn.setAttribute('aria-label', 'Next slide');

                nav.appendChild(prevBtn);
                nav.appendChild(nextBtn);

                this.prevBtn = prevBtn;
                this.nextBtn = nextBtn;
            }

            // Create dots
            if (this.options.showDots && this.totalSlides > 1) {
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'slider-dots';

                for (let i = 0; i < this.totalSlides; i++) {
                    const dot = document.createElement('button');
                    dot.className = 'slider-dot';
                    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                    if (i === 0) dot.classList.add('active');
                    dotsContainer.appendChild(dot);
                }

                nav.appendChild(dotsContainer);
                this.dotsContainer = dotsContainer;
            }

            this.slider.appendChild(nav);
        }

        bindEvents() {
            // Arrow navigation
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', () => this.prevSlide());
            }
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => this.nextSlide());
            }

            // Dot navigation
            if (this.dotsContainer) {
                this.dotsContainer.addEventListener('click', (e) => {
                    if (e.target.classList.contains('slider-dot')) {
                        const index = Array.from(this.dotsContainer.children).indexOf(e.target);
                        this.goToSlide(index);
                    }
                });
            }

            // Pause autoplay on hover
            if (this.options.autoplay) {
                this.slider.addEventListener('mouseenter', () => this.pauseAutoplay());
                this.slider.addEventListener('mouseleave', () => this.startAutoplay());
            }

            // Keyboard navigation
            this.slider.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') this.prevSlide();
                if (e.key === 'ArrowRight') this.nextSlide();
            });

            // Touch/swipe support for mobile
            this.addTouchSupport();
        }

        addTouchSupport() {
            let startX = 0;
            let startY = 0;
            let endX = 0;
            let endY = 0;

            this.slider.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            });

            this.slider.addEventListener('touchend', (e) => {
                endX = e.changedTouches[0].clientX;
                endY = e.changedTouches[0].clientY;

                const diffX = startX - endX;
                const diffY = startY - endY;

                // Only trigger if horizontal swipe is greater than vertical
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        this.nextSlide(); // Swipe left = next
                    } else {
                        this.prevSlide(); // Swipe right = previous
                    }
                }
            });
        }

        goToSlide(index, direction = 'next') {
            if (this.isAnimating || index === this.currentSlide) return;

            this.isAnimating = true;

            // Hide current slide
            if (this.slides[this.currentSlide]) {
                this.slides[this.currentSlide].style.display = 'none';
            }

            // Show new slide
            this.currentSlide = index;
            if (this.slides[this.currentSlide]) {
                this.slides[this.currentSlide].style.display = 'block';
            }

            // Update dots
            this.updateDots();

            // Animation complete
            setTimeout(() => {
                this.isAnimating = false;
            }, this.options.speed);
        }

        nextSlide() {
            let nextIndex = this.currentSlide + 1;
            
            if (nextIndex >= this.totalSlides) {
                nextIndex = this.options.infinite ? 0 : this.totalSlides - 1;
            }
            
            if (nextIndex !== this.currentSlide) {
                this.goToSlide(nextIndex, 'next');
            }
        }

        prevSlide() {
            let prevIndex = this.currentSlide - 1;
            
            if (prevIndex < 0) {
                prevIndex = this.options.infinite ? this.totalSlides - 1 : 0;
            }
            
            if (prevIndex !== this.currentSlide) {
                this.goToSlide(prevIndex, 'prev');
            }
        }

        updateDots() {
            if (!this.dotsContainer) return;

            const dots = this.dotsContainer.querySelectorAll('.slider-dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === this.currentSlide);
            });
        }

        startAutoplay() {
            if (!this.options.autoplay || this.totalSlides <= 1) return;

            this.pauseAutoplay(); // Clear existing timer
            this.autoplayTimer = setInterval(() => {
                this.nextSlide();
            }, this.options.autoplaySpeed);
        }

        pauseAutoplay() {
            if (this.autoplayTimer) {
                clearInterval(this.autoplayTimer);
                this.autoplayTimer = null;
            }
        }

        destroy() {
            this.pauseAutoplay();
            // Remove event listeners and restore original HTML
            const nav = this.slider.querySelector('.slider-nav');
            if (nav) nav.remove();
        }
    }

    // CSS for the slider
    const sliderCSS = `
        .simple-slider {
            position: relative;
            overflow: hidden;
            background: #f5f5f5;
            border-radius: 8px;
        }

        .slider-wrapper {
            position: relative;
            width: 100%;
            min-height: 200px;
        }

        .slider-slide {
            width: 100%;
            transition: opacity 0.3s ease;
        }

        .slider-nav {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .slider-arrow {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s ease;
        }

        .slider-arrow:hover {
            background: rgba(0, 0, 0, 0.9);
        }

        .slider-dots {
            display: flex;
            gap: 8px;
        }

        .slider-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: background 0.3s ease;
        }

        .slider-dot.active {
            background: white;
        }

        .slider-dot:hover {
            background: rgba(255, 255, 255, 0.8);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
            .slider-arrow {
                width: 35px;
                height: 35px;
                font-size: 18px;
            }

            .slider-nav {
                bottom: 15px;
            }
        }
    `;

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = sliderCSS;
    document.head.appendChild(style);

    // Make it globally available
    window.SimpleSlider = SimpleSlider;

    // Auto-initialize sliders with data attributes
    document.addEventListener('DOMContentLoaded', () => {
        const sliders = document.querySelectorAll('[data-simple-slider]');
        sliders.forEach(slider => {
            new SimpleSlider(slider);
        });
    });

})();
