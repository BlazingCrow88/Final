/* ===================================
   SIMPLE NAVIGATION FOR DORALEOUS WEBSITE
   File: assets/js/simple-navigation.js
   =================================== */

(function() {
    'use strict';

    // DOM Elements
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // State
    let isMenuOpen = false;

    // Initialize navigation
    function init() {
        setupMobileMenu();
        setupActiveStates();
        setupSmoothScrolling();
        setupDropdowns();
    }

    // Mobile menu functionality
    function setupMobileMenu() {
        if (!navToggle || !navMenu) return;

        navToggle.addEventListener('click', toggleMobileMenu);
        
        // Close menu when clicking nav links
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (isMenuOpen) {
                    closeMobileMenu();
                }
            });
        });

        // Close menu on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && isMenuOpen) {
                closeMobileMenu();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                closeMobileMenu();
            }
        });
    }

    function toggleMobileMenu() {
        if (isMenuOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    function openMobileMenu() {
        isMenuOpen = true;
        navToggle.classList.add('active');
        navMenu.classList.add('active');
        document.body.classList.add('menu-open');
    }

    function closeMobileMenu() {
        isMenuOpen = false;
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
    }

    // Set active navigation state based on current page
    function setupActiveStates() {
        const currentPath = window.location.pathname;
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            const linkPath = new URL(link.href).pathname;
            
            // Exact match for home page
            if (currentPath === '/' && (linkPath === '/' || linkPath === '/index.html')) {
                link.classList.add('active');
            }
            // Partial match for other pages
            else if (currentPath !== '/' && linkPath !== '/' && currentPath.includes(linkPath.replace('.html', ''))) {
                link.classList.add('active');
            }
        });
    }

    // Simple smooth scrolling for anchor links
    function setupSmoothScrolling() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();
            
            const headerHeight = document.querySelector('.main-navigation')?.offsetHeight || 80;
            const targetPosition = target.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    }

    // Simple dropdown functionality for desktop
    function setupDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            const menu = dropdown.querySelector('.dropdown-menu');
            if (!menu) return;

            // Desktop hover behavior
            if (window.innerWidth > 768) {
                dropdown.addEventListener('mouseenter', () => {
                    menu.style.opacity = '1';
                    menu.style.visibility = 'visible';
                    menu.style.transform = 'translateY(0)';
                });
                
                dropdown.addEventListener('mouseleave', () => {
                    menu.style.opacity = '0';
                    menu.style.visibility = 'hidden';
                    menu.style.transform = 'translateY(-10px)';
                });
            }
            
            // Mobile click behavior
            else {
                const toggle = dropdown.querySelector('.nav-link');
                if (toggle) {
                    toggle.addEventListener('click', (e) => {
                        e.preventDefault();
                        dropdown.classList.toggle('active');
                    });
                }
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for global access if needed
    window.Navigation = {
        closeMobileMenu: closeMobileMenu
    };

})();
