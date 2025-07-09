/* ===================================
   NAVIGATION FUNCTIONALITY
   File: assets/js/navigation.js
   =================================== */

(function() {
    'use strict';

    // DOM Elements
    const navigation = document.getElementById('main-nav');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const dropdownItems = document.querySelectorAll('.nav-item.dropdown');
    const searchToggle = document.querySelector('.search-toggle');
    const searchOverlay = document.querySelector('.search-overlay');
    const searchClose = document.querySelector('.search-close');
    const searchInput = document.querySelector('.search-input');

    // State variables
    let isMenuOpen = false;
    let isSearchOpen = false;
    let scrollPosition = 0;

    // Initialize navigation functionality
    function init() {
        setupEventListeners();
        setupScrollBehavior();
        setupKeyboardNavigation();
        setupActiveStates();
        setupDropdownFunctionality();
        setupSearchFunctionality();
        setupMobileMenuBehavior();
    }

    // Setup all event listeners
    function setupEventListeners() {
        // Mobile menu toggle
        if (navToggle) {
            navToggle.addEventListener('click', toggleMobileMenu);
        }

        // Navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', handleNavLinkClick);
        });

        // Search functionality
        if (searchToggle) {
            searchToggle.addEventListener('click', toggleSearch);
        }

        if (searchClose) {
            searchClose.addEventListener('click', closeSearch);
        }

        if (searchOverlay) {
            searchOverlay.addEventListener('click', handleSearchOverlayClick);
        }

        // Keyboard events
        document.addEventListener('keydown', handleKeyboardEvents);

        // Resize events
        window.addEventListener('resize', handleResize);

        // Scroll events
        window.addEventListener('scroll', throttle(handleScroll, 16));

        // Click outside to close dropdowns
        document.addEventListener('click', handleOutsideClick);
    }

    // Setup scroll behavior for navigation
    function setupScrollBehavior() {
        scrollPosition = window.pageYOffset;
        
        // Initial scroll state
        if (scrollPosition > 50) {
            navigation.classList.add('scrolled');
        }
    }

    // Handle scroll events
    function handleScroll() {
        const currentScrollPosition = window.pageYOffset;
        
        // Add/remove scrolled class
        if (currentScrollPosition > 50) {
            navigation.classList.add('scrolled');
        } else {
            navigation.classList.remove('scrolled');
        }

        // Hide/show navigation on scroll (optional)
        if (window.innerWidth > 768) { // Only on desktop
            if (currentScrollPosition > scrollPosition && currentScrollPosition > 200) {
                navigation.style.transform = 'translateY(-100%)';
            } else {
                navigation.style.transform = 'translateY(0)';
            }
        }

        scrollPosition = currentScrollPosition;
    }

    // Setup keyboard navigation
    function setupKeyboardNavigation() {
        navLinks.forEach((link, index) => {
            link.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % navLinks.length;
                    navLinks[nextIndex].focus();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = (index - 1 + navLinks.length) % navLinks.length;
                    navLinks[prevIndex].focus();
                }
            });
        });
    }

    // Setup active navigation states
    function setupActiveStates() {
        const currentPath = window.location.pathname;
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            const linkPath = new URL(link.href).pathname;
            
            // Exact match for home page
            if (currentPath === '/' && linkPath === '/') {
                link.classList.add('active');
            }
            // Partial match for other pages
            else if (currentPath !== '/' && linkPath !== '/' && currentPath.includes(linkPath)) {
                link.classList.add('active');
            }
            // Book pages special handling
            else if (currentPath.includes('/books/') && link.href.includes('/books/')) {
                link.classList.add('active');
            }
        });
    }

    // Setup dropdown functionality
    function setupDropdownFunctionality() {
        dropdownItems.forEach(item => {
            const dropdownMenu = item.querySelector('.dropdown-menu');
            
            if (dropdownMenu) {
                // Mouse events for desktop
                if (window.innerWidth > 768) {
                    item.addEventListener('mouseenter', () => {
                        showDropdown(dropdownMenu);
                    });
                    
                    item.addEventListener('mouseleave', () => {
                        hideDropdown(dropdownMenu);
                    });
                }
                
                // Click events for mobile
                const dropdownToggle = item.querySelector('.nav-link');
                if (dropdownToggle && window.innerWidth <= 768) {
                    dropdownToggle.addEventListener('click', (e) => {
                        e.preventDefault();
                        toggleDropdown(item, dropdownMenu);
                    });
                }
            }
        });
    }

    // Show dropdown menu
    function showDropdown(menu) {
        menu.style.opacity = '1';
        menu.style.visibility = 'visible';
        menu.style.transform = 'translateY(0)';
    }

    // Hide dropdown menu
    function hideDropdown(menu) {
        menu.style.opacity = '0';
        menu.style.visibility = 'hidden';
        menu.style.transform = 'translateY(-10px)';
    }

    // Toggle dropdown for mobile
    function toggleDropdown(item, menu) {
        const isActive = item.classList.contains('active');
        
        // Close all other dropdowns
        dropdownItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
            }
        });
        
        // Toggle current dropdown
        if (isActive) {
            item.classList.remove('active');
        } else {
            item.classList.add('active');
        }
    }

    // Setup search functionality
    function setupSearchFunctionality() {
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearchInput, 300));
            searchInput.addEventListener('keydown', handleSearchKeydown);
        }
    }

    // Handle search input
    function handleSearchInput(e) {
        const query = e.target.value.trim();
        
        if (query.length >= 2) {
            performSearch(query);
        } else {
            clearSearchResults();
        }
    }

    // Handle search keyboard events
    function handleSearchKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query.length >= 2) {
                // Redirect to search results page or perform search
                window.location.href = `/search?q=${encodeURIComponent(query)}`;
            }
        } else if (e.key === 'Escape') {
            closeSearch();
        }
    }

    // Perform search (placeholder for actual search implementation)
    function performSearch(query) {
        // This would integrate with your search functionality
        console.log('Searching for:', query);
        
        // Example: Show loading state
        showSearchLoading();
        
        // Example: Mock search results
        setTimeout(() => {
            showSearchResults(mockSearchResults(query));
        }, 500);
    }

    // Mock search results (replace with actual search API)
    function mockSearchResults(query) {
        return [
            {
                title: 'Doraleous and Associates: A Tale of Glory',
                type: 'Book',
                url: '/books/doraleous-associates/',
                excerpt: 'Epic fantasy adventure featuring mercenaries and magic...'
            },
            {
                title: 'About Brian M. Shoemaker',
                type: 'Page',
                url: '/about.html',
                excerpt: 'Learn about the author behind the fantasy adventures...'
            }
        ];
    }

    // Show search loading state
    function showSearchLoading() {
        // Implementation for search loading UI
    }

    // Show search results
    function showSearchResults(results) {
        // Implementation for displaying search results
    }

    // Clear search results
    function clearSearchResults() {
        // Implementation for clearing search results
    }

    // Setup mobile menu behavior
    function setupMobileMenuBehavior() {
        // Prevent body scroll when menu is open
        function preventBodyScroll() {
            document.body.style.overflow = isMenuOpen ? 'hidden' : '';
        }

        // Update menu behavior on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && isMenuOpen) {
                closeMobileMenu();
            }
        });
    }

    // Toggle mobile menu
    function toggleMobileMenu() {
        if (isMenuOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    // Open mobile menu
    function openMobileMenu() {
        isMenuOpen = true;
        navToggle.classList.add('active');
        navMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus management
        setTimeout(() => {
            const firstNavLink = navMenu.querySelector('.nav-link');
            if (firstNavLink) {
                firstNavLink.focus();
            }
        }, 300);
    }

    // Close mobile menu
    function closeMobileMenu() {
        isMenuOpen = false;
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
        
        // Close all dropdowns
        dropdownItems.forEach(item => {
            item.classList.remove('active');
        });
    }

    // Toggle search overlay
    function toggleSearch() {
        if (isSearchOpen) {
            closeSearch();
        } else {
            openSearch();
        }
    }

    // Open search overlay
    function openSearch() {
        if (!searchOverlay) return;
        
        isSearchOpen = true;
        searchOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus on search input
        setTimeout(() => {
            if (searchInput) {
                searchInput.focus();
            }
        }, 100);
    }

    // Close search overlay
    function closeSearch() {
        if (!searchOverlay) return;
        
        isSearchOpen = false;
        searchOverlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Clear search input
        if (searchInput) {
            searchInput.value = '';
        }
        
        clearSearchResults();
    }

    // Handle navigation link clicks
    function handleNavLinkClick(e) {
        const link = e.currentTarget;
        const href = link.getAttribute('href');
        
        // Close mobile menu on link click
        if (isMenuOpen) {
            closeMobileMenu();
        }
        
        // Handle smooth scrolling for anchor links
        if (href && href.startsWith('#')) {
            e.preventDefault();
            smoothScrollToElement(href);
        }
        
        // Update active states
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        link.classList.add('active');
    }

    // Smooth scroll to element
    function smoothScrollToElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            const headerHeight = navigation.offsetHeight;
            const elementPosition = element.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    // Handle keyboard events
    function handleKeyboardEvents(e) {
        // Escape key closes overlays
        if (e.key === 'Escape') {
            if (isSearchOpen) {
                closeSearch();
            } else if (isMenuOpen) {
                closeMobileMenu();
            }
        }
        
        // Tab key for accessibility
        if (e.key === 'Tab' && isMenuOpen) {
            trapFocusInMenu(e);
        }
    }

    // Trap focus within mobile menu
    function trapFocusInMenu(e) {
        const focusableElements = navMenu.querySelectorAll(
            'a, button, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    // Handle search overlay clicks
    function handleSearchOverlayClick(e) {
        if (e.target === searchOverlay) {
            closeSearch();
        }
    }

    // Handle clicks outside dropdowns
    function handleOutsideClick(e) {
        if (!e.target.closest('.nav-item.dropdown')) {
            dropdownItems.forEach(item => {
                const menu = item.querySelector('.dropdown-menu');
                if (menu) {
                    hideDropdown(menu);
                }
            });
        }
    }

    // Handle window resize
    function handleResize() {
        // Reset navigation styles on resize
        if (window.innerWidth > 768) {
            navigation.style.transform = 'translateY(0)';
            if (isMenuOpen) {
                closeMobileMenu();
            }
        }
        
        // Re-setup dropdown functionality
        setupDropdownFunctionality();
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

    // Utility: Debounce function
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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    window.Navigation = {
        openSearch: openSearch,
        closeSearch: closeSearch,
        closeMobileMenu: closeMobileMenu,
        openMobileMenu: openMobileMenu
    };

})();
