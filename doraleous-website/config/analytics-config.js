/* ===================================
   ANALYTICS CONFIGURATION
   File: config/analytics-config.js
   =================================== */

(function() {
    'use strict';

    // Analytics configuration object
    const ANALYTICS_CONFIG = {
        // Google Analytics 4 Configuration
        ga4: {
            measurementId: 'G-XXXXXXXXXX', // Replace with actual GA4 Measurement ID
            enabled: true,
            cookieSettings: {
                cookie_expires: 7776000, // 90 days
                cookie_prefix: 'bms_',
                cookie_domain: 'auto',
                cookie_flags: 'SameSite=Lax; Secure'
            },
            customDimensions: {
                user_type: 'custom_map.user_type',
                page_category: 'custom_map.page_category',
                content_type: 'custom_map.content_type',
                engagement_level: 'custom_map.engagement_level'
            }
        },

        // Event tracking configuration
        events: {
            // Page view events
            page_view: {
                enabled: true,
                enhanced: true, // Include scroll depth, time on page
                customParameters: ['page_category', 'content_type']
            },

            // Book-related events
            book_interaction: {
                enabled: true,
                events: [
                    'book_view',
                    'excerpt_read',
                    'character_view',
                    'review_read',
                    'purchase_click'
                ]
            },

            // Form events
            form_interaction: {
                enabled: true,
                events: [
                    'form_start',
                    'form_submit',
                    'form_error',
                    'newsletter_signup'
                ]
            },

            // Engagement events
            engagement: {
                enabled: true,
                events: [
                    'scroll_depth',
                    'time_on_page',
                    'social_share',
                    'search_usage'
                ]
            },

            // Navigation events
            navigation: {
                enabled: true,
                events: [
                    'menu_click',
                    'internal_link_click',
                    'external_link_click',
                    'download_click'
                ]
            }
        },

        // Privacy and consent settings
        privacy: {
            respectDNT: true, // Respect Do Not Track header
            anonymizeIP: true,
            cookieConsent: true,
            dataRetention: 26, // months
            consentCategories: {
                necessary: true,
                analytics: false, // Requires user consent
                marketing: false,
                preferences: false
            }
        },

        // Performance monitoring
        performance: {
            enabled: true,
            sampleRate: 10, // Percentage of users to track performance for
            metrics: [
                'page_load_time',
                'first_contentful_paint',
                'largest_contentful_paint',
                'cumulative_layout_shift',
                'first_input_delay'
            ]
        },

        // Custom tracking
        custom: {
            authorEngagement: true,
            bookDiscovery: true,
            readerJourney: true,
            contentPerformance: true
        }
    };

    // Analytics Manager Class
    class AnalyticsManager {
        constructor() {
            this.isInitialized = false;
            this.consentGiven = false;
            this.userId = null;
            this.sessionId = this.generateSessionId();
            this.pageLoadTime = performance.now();
            this.eventQueue = [];
            
            this.init();
        }

        init() {
            // Check for consent before initializing
            this.checkConsent();
            
            // Initialize if consent given or not required
            if (this.consentGiven || !ANALYTICS_CONFIG.privacy.cookieConsent) {
                this.initializeAnalytics();
            }

            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize performance monitoring
            if (ANALYTICS_CONFIG.performance.enabled) {
                this.initPerformanceMonitoring();
            }

            this.isInitialized = true;
        }

        checkConsent() {
            // Check if user has given consent
            const consent = localStorage.getItem('analytics_consent');
            this.consentGiven = consent === 'true';

            // Respect Do Not Track
            if (ANALYTICS_CONFIG.privacy.respectDNT && navigator.doNotTrack === '1') {
                this.consentGiven = false;
            }
        }

        initializeAnalytics() {
            if (!ANALYTICS_CONFIG.ga4.enabled || !ANALYTICS_CONFIG.ga4.measurementId) {
                console.warn('Google Analytics not configured');
                return;
            }

            // Load GA4
            this.loadGA4Script();
            
            // Configure gtag
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            // Configure GA4 with privacy settings
            const config = {
                anonymize_ip: ANALYTICS_CONFIG.privacy.anonymizeIP,
                cookie_expires: ANALYTICS_CONFIG.ga4.cookieSettings.cookie_expires,
                cookie_prefix: ANALYTICS_CONFIG.ga4.cookieSettings.cookie_prefix,
                cookie_domain: ANALYTICS_CONFIG.ga4.cookieSettings.cookie_domain,
                cookie_flags: ANALYTICS_CONFIG.ga4.cookieSettings.cookie_flags
            };

            gtag('config', ANALYTICS_CONFIG.ga4.measurementId, config);
            
            // Make gtag globally available
            window.gtag = gtag;
            
            // Process queued events
            this.processEventQueue();
        }

        loadGA4Script() {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.ga4.measurementId}`;
            document.head.appendChild(script);
        }

        setupEventListeners() {
            // Page visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this.trackEvent('page_exit', {
                        time_on_page: Math.round((performance.now() - this.pageLoadTime) / 1000)
                    });
                }
            });

            // Scroll depth tracking
            this.setupScrollTracking();
            
            // Form tracking
            this.setupFormTracking();
            
            // Link tracking
            this.setupLinkTracking();
            
            // Book interaction tracking
            this.setupBookTracking();
        }

        setupScrollTracking() {
            let maxScroll = 0;
            const scrollMilestones = [25, 50, 75, 90, 100];
            const trackedMilestones = new Set();

            const trackScroll = () => {
                const scrollPercent = Math.round(
                    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
                );
                
                maxScroll = Math.max(maxScroll, scrollPercent);
                
                scrollMilestones.forEach(milestone => {
                    if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
                        this.trackEvent('scroll_depth', {
                            scroll_depth: milestone,
                            page_category: this.getPageCategory()
                        });
                        trackedMilestones.add(milestone);
                    }
                });
            };

            window.addEventListener('scroll', this.throttle(trackScroll, 1000));
        }

        setupFormTracking() {
            // Track form submissions
            document.addEventListener('submit', (e) => {
                const form = e.target;
                if (!form.matches('form')) return;

                const formId = form.id || form.className || 'unknown';
                
                this.trackEvent('form_submit', {
                    form_id: formId,
                    form_type: this.getFormType(form)
                });
            });

            // Track form errors
            document.addEventListener('invalid', (e) => {
                const form = e.target.closest('form');
                if (!form) return;

                const formId = form.id || form.className || 'unknown';
                
                this.trackEvent('form_error', {
                    form_id: formId,
                    field_name: e.target.name || e.target.id || 'unknown',
                    error_type: 'validation_error'
                });
            });
        }

        setupLinkTracking() {
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (!link || !link.href) return;

                const url = new URL(link.href);
                const isExternal = url.hostname !== window.location.hostname;
                const isDownload = this.isDownloadLink(link);

                if (isExternal) {
                    this.trackEvent('external_link_click', {
                        link_url: url.hostname,
                        link_text: link.textContent.trim().substring(0, 100)
                    });
                } else if (isDownload) {
                    this.trackEvent('download_click', {
                        file_name: this.getFileName(url.pathname),
                        file_type: this.getFileExtension(url.pathname)
                    });
                } else {
                    this.trackEvent('internal_link_click', {
                        page_section: this.getPageSection(link),
                        link_text: link.textContent.trim().substring(0, 100)
                    });
                }
            });
        }

        setupBookTracking() {
            // Track book page views
            if (this.isBookPage()) {
                this.trackEvent('book_view', {
                    book_title: this.getBookTitle(),
                    page_type: this.getBookPageType()
                });
            }

            // Track character interactions
            document.addEventListener('click', (e) => {
                const characterCard = e.target.closest('.character-card');
                if (characterCard) {
                    const characterName = characterCard.querySelector('.character-name')?.textContent || 'unknown';
                    this.trackEvent('character_view', {
                        character_name: characterName,
                        interaction_type: 'card_click'
                    });
                }
            });

            // Track excerpt reading
            const excerptSection = document.querySelector('.excerpt-content');
            if (excerptSection) {
                this.setupReadingTracking(excerptSection);
            }
        }

        setupReadingTracking(element) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.trackEvent('excerpt_read', {
                            reading_progress: 'started',
                            content_type: 'book_excerpt'
                        });
                    }
                });
            }, { threshold: 0.5 });

            observer.observe(element);
        }

        initPerformanceMonitoring() {
            // Core Web Vitals tracking
            if ('PerformanceObserver' in window) {
                // First Contentful Paint
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        if (entry.name === 'first-contentful-paint') {
                            this.trackEvent('performance_metric', {
                                metric_name: 'first_contentful_paint',
                                metric_value: Math.round(entry.startTime),
                                page_category: this.getPageCategory()
                            });
                        }
                    });
                }).observe({ entryTypes: ['paint'] });

                // Largest Contentful Paint
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.trackEvent('performance_metric', {
                        metric_name: 'largest_contentful_paint',
                        metric_value: Math.round(lastEntry.startTime),
                        page_category: this.getPageCategory()
                    });
                }).observe({ entryTypes: ['largest-contentful-paint'] });

                // First Input Delay
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        this.trackEvent('performance_metric', {
                            metric_name: 'first_input_delay',
                            metric_value: Math.round(entry.processingStart - entry.startTime),
                            page_category: this.getPageCategory()
                        });
                    });
                }).observe({ entryTypes: ['first-input'] });
            }

            // Page load time
            window.addEventListener('load', () => {
                const pageLoadTime = performance.now() - this.pageLoadTime;
                this.trackEvent('performance_metric', {
                    metric_name: 'page_load_time',
                    metric_value: Math.round(pageLoadTime),
                    page_category: this.getPageCategory()
                });
            });
        }

        trackEvent(eventName, parameters = {}) {
            if (!this.consentGiven && ANALYTICS_CONFIG.privacy.cookieConsent) {
                // Queue event for later if consent not given
                this.eventQueue.push({ eventName, parameters });
                return;
            }

            // Add common parameters
            const commonParams = {
                session_id: this.sessionId,
                page_category: this.getPageCategory(),
                user_type: this.getUserType(),
                timestamp: Date.now()
            };

            const eventData = { ...commonParams, ...parameters };

            // Send to Google Analytics if available
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, eventData);
            }

            // Send to custom analytics endpoint
            this.sendToCustomAnalytics(eventName, eventData);

            // Log for debugging in development
            if (this.isDevelopment()) {
                console.log('Analytics Event:', eventName, eventData);
            }
        }

        sendToCustomAnalytics(eventName, eventData) {
            // Send to custom analytics backend
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_type: eventName,
                    event_data: eventData,
                    page_url: window.location.href,
                    referrer_url: document.referrer,
                    user_agent: navigator.userAgent
                })
            }).catch(error => {
                console.warn('Custom analytics tracking failed:', error);
            });
        }

        processEventQueue() {
            while (this.eventQueue.length > 0) {
                const { eventName, parameters } = this.eventQueue.shift();
                this.trackEvent(eventName, parameters);
            }
        }

        // Utility methods
        generateSessionId() {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        getPageCategory() {
            const path = window.location.pathname;
            if (path.includes('/books/')) return 'books';
            if (path.includes('/blog/')) return 'blog';
            if (path.includes('/about')) return 'about';
            if (path.includes('/contact')) return 'contact';
            if (path === '/' || path === '/index.html') return 'home';
            return 'other';
        }

        getUserType() {
            // Determine if returning visitor
            const hasVisited = localStorage.getItem('bms_returning_visitor');
            if (!hasVisited) {
                localStorage.setItem('bms_returning_visitor', 'true');
                return 'new_visitor';
            }
            return 'returning_visitor';
        }

        isBookPage() {
            return window.location.pathname.includes('/books/');
        }

        getBookTitle() {
            const titleElement = document.querySelector('.book-title, .page-title');
            return titleElement ? titleElement.textContent.trim() : 'unknown';
        }

        getBookPageType() {
            const path = window.location.pathname;
            if (path.includes('/characters')) return 'characters';
            if (path.includes('/excerpt')) return 'excerpt';
            if (path.includes('/reviews')) return 'reviews';
            return 'overview';
        }

        getFormType(form) {
            if (form.classList.contains('contact-form')) return 'contact';
            if (form.classList.contains('newsletter-form')) return 'newsletter';
            if (form.classList.contains('review-form')) return 'review';
            return 'other';
        }

        isDownloadLink(link) {
            const downloadExtensions = ['.pdf', '.epub', '.mobi', '.doc', '.docx'];
            return downloadExtensions.some(ext => link.href.toLowerCase().includes(ext));
        }

        getFileName(pathname) {
            return pathname.split('/').pop();
        }

        getFileExtension(pathname) {
            return pathname.split('.').pop();
        }

        getPageSection(link) {
            const section = link.closest('section, header, footer, nav');
            return section ? section.className || section.tagName.toLowerCase() : 'unknown';
        }

        isDevelopment() {
            return window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.includes('dev');
        }

        throttle(func, limit) {
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

        // Public methods for manual tracking
        trackPageView(customParams = {}) {
            this.trackEvent('page_view', customParams);
        }

        trackPurchaseClick(bookTitle, retailer) {
            this.trackEvent('purchase_click', {
                book_title: bookTitle,
                retailer: retailer,
                page_category: 'books'
            });
        }

        trackNewsletterSignup(source = 'unknown') {
            this.trackEvent('newsletter_signup', {
                signup_source: source
            });
        }

        trackSocialShare(platform, content) {
            this.trackEvent('social_share', {
                platform: platform,
                content_type: content,
                page_category: this.getPageCategory()
            });
        }

        // Consent management
        giveConsent() {
            this.consentGiven = true;
            localStorage.setItem('analytics_consent', 'true');
            
            if (!this.isInitialized) {
                this.initializeAnalytics();
            }
        }

        revokeConsent() {
            this.consentGiven = false;
            localStorage.removeItem('analytics_consent');
            
            // Clear GA cookies
            this.clearAnalyticsCookies();
        }

        clearAnalyticsCookies() {
            const cookiesToClear = [
                '_ga', '_ga_' + ANALYTICS_CONFIG.ga4.measurementId.replace('G-', ''),
                '_gid', '_gat', '_gtag'
            ];
            
            cookiesToClear.forEach(cookie => {
                document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            });
        }
    }

    // Initialize analytics when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.Analytics = new AnalyticsManager();
        });
    } else {
        window.Analytics = new AnalyticsManager();
    }

    // Export configuration for external access
    window.ANALYTICS_CONFIG = ANALYTICS_CONFIG;

})();
