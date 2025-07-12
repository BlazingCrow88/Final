/* ===================================
   SEO OPTIMIZER
   File: assets/js/seo-optimizer.js
   =================================== */

class SEOOptimizer {
    constructor() {
        this.config = {
            maxTitleLength: 60,
            maxDescriptionLength: 160,
            maxKeywords: 10,
            minWordCount: 300,
            maxWordCount: 2000,
            headingStructure: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            imageAltRequired: true,
            internalLinkMin: 2,
            externalLinkMax: 10,
            keywordDensityMax: 3, // percentage
            readabilityTarget: 60 // Flesch reading ease score
        };

        this.analytics = {
            pageViews: 0,
            timeOnPage: 0,
            bounceRate: 0,
            clickThroughRate: 0,
            socialShares: 0
        };

        this.seoScore = 0;
        this.recommendations = [];
        this.keywords = [];
        this.competitorData = [];

        this.init();
    }

    init() {
        this.analyzeCurrentPage();
        this.setupPerformanceMonitoring();
        this.setupUserBehaviorTracking();
        this.initializeABTesting();
        this.setupAutoOptimization();
    }

    analyzeCurrentPage() {
        this.analyzeMeta();
        this.analyzeContent();
        this.analyzeImages();
        this.analyzeLinks();
        this.analyzeHeadingStructure();
        this.analyzePageSpeed();
        this.analyzeMobileOptimization();
        this.calculateSEOScore();
        this.generateRecommendations();
    }

    analyzeMeta() {
        const analysis = {
            title: this.analyzeTitle(),
            description: this.analyzeDescription(),
            keywords: this.analyzeKeywords(),
            canonicalUrl: this.analyzeCanonical(),
            openGraph: this.analyzeOpenGraph(),
            twitterCard: this.analyzeTwitterCard(),
            robotsMeta: this.analyzeRobotsMeta()
        };

        this.metaAnalysis = analysis;
        return analysis;
    }

    analyzeTitle() {
        const titleElement = document.querySelector('title');
        const title = titleElement?.textContent || '';
        
        const analysis = {
            text: title,
            length: title.length,
            isOptimal: title.length >= 30 && title.length <= this.config.maxTitleLength,
            hasKeyword: false,
            hasBrand: title.toLowerCase().includes('author name'),
            isUnique: true, // Would need database check in real implementation
            recommendations: []
        };

        if (title.length === 0) {
            analysis.recommendations.push('Add a page title');
        } else if (title.length < 30) {
            analysis.recommendations.push('Title is too short, aim for 30-60 characters');
        } else if (title.length > this.config.maxTitleLength) {
            analysis.recommendations.push(`Title is too long, keep under ${this.config.maxTitleLength} characters`);
        }

        if (!analysis.hasBrand) {
            analysis.recommendations.push('Consider including your brand name in the title');
        }

        // Check for primary keyword
        const primaryKeyword = this.getPrimaryKeyword();
        if (primaryKeyword && title.toLowerCase().includes(primaryKeyword.toLowerCase())) {
            analysis.hasKeyword = true;
        } else if (primaryKeyword) {
            analysis.recommendations.push(`Include your primary keyword "${primaryKeyword}" in the title`);
        }

        return analysis;
    }

    analyzeDescription() {
        const descriptionElement = document.querySelector('meta[name="description"]');
        const description = descriptionElement?.getAttribute('content') || '';
        
        const analysis = {
            text: description,
            length: description.length,
            isOptimal: description.length >= 120 && description.length <= this.config.maxDescriptionLength,
            hasKeyword: false,
            hasCallToAction: this.hasCallToAction(description),
            recommendations: []
        };

        if (description.length === 0) {
            analysis.recommendations.push('Add a meta description');
        } else if (description.length < 120) {
            analysis.recommendations.push('Meta description is too short, aim for 120-160 characters');
        } else if (description.length > this.config.maxDescriptionLength) {
            analysis.recommendations.push(`Meta description is too long, keep under ${this.config.maxDescriptionLength} characters`);
        }

        const primaryKeyword = this.getPrimaryKeyword();
        if (primaryKeyword && description.toLowerCase().includes(primaryKeyword.toLowerCase())) {
            analysis.hasKeyword = true;
        } else if (primaryKeyword) {
            analysis.recommendations.push(`Include your primary keyword "${primaryKeyword}" in the description`);
        }

        if (!analysis.hasCallToAction) {
            analysis.recommendations.push('Consider adding a call-to-action in your meta description');
        }

        return analysis;
    }

    analyzeKeywords() {
        const keywordsElement = document.querySelector('meta[name="keywords"]');
        const keywords = keywordsElement?.getAttribute('content') || '';
        const keywordsList = keywords.split(',').map(k => k.trim()).filter(k => k);
        
        const analysis = {
            keywords: keywordsList,
            count: keywordsList.length,
            isOptimal: keywordsList.length > 0 && keywordsList.length <= this.config.maxKeywords,
            recommendations: []
        };

        if (keywordsList.length === 0) {
            analysis.recommendations.push('Add relevant keywords to your meta keywords tag');
        } else if (keywordsList.length > this.config.maxKeywords) {
            analysis.recommendations.push(`Too many keywords, focus on ${this.config.maxKeywords} most important ones`);
        }

        return analysis;
    }

    analyzeContent() {
        const contentElement = document.querySelector('main, .content, .post-content, article');
        const content = contentElement?.textContent || document.body.textContent;
        
        const words = content.trim().split(/\s+/);
        const wordCount = words.length;
        
        const analysis = {
            wordCount: wordCount,
            isOptimal: wordCount >= this.config.minWordCount && wordCount <= this.config.maxWordCount,
            keywordDensity: this.calculateKeywordDensity(content),
            readabilityScore: this.calculateReadabilityScore(content),
            hasIntroduction: this.hasIntroduction(),
            hasConclusion: this.hasConclusion(),
            contentQuality: this.assessContentQuality(content),
            recommendations: []
        };

        if (wordCount < this.config.minWordCount) {
            analysis.recommendations.push(`Content is too short, aim for at least ${this.config.minWordCount} words`);
        } else if (wordCount > this.config.maxWordCount) {
            analysis.recommendations.push(`Content is very long, consider breaking it into multiple pages`);
        }

        if (analysis.keywordDensity > this.config.keywordDensityMax) {
            analysis.recommendations.push('Keyword density is too high, use keywords more naturally');
        } else if (analysis.keywordDensity < 0.5) {
            analysis.recommendations.push('Consider using your target keywords more frequently');
        }

        if (analysis.readabilityScore < this.config.readabilityTarget) {
            analysis.recommendations.push('Improve readability by using shorter sentences and simpler words');
        }

        if (!analysis.hasIntroduction) {
            analysis.recommendations.push('Add a clear introduction to your content');
        }

        if (!analysis.hasConclusion) {
            analysis.recommendations.push('Add a conclusion to summarize your content');
        }

        this.contentAnalysis = analysis;
        return analysis;
    }

    analyzeImages() {
        const images = document.querySelectorAll('img');
        const totalImages = images.length;
        let imagesWithAlt = 0;
        let imagesWithTitle = 0;
        let imagesOptimized = 0;
        let imageIssues = [];

        images.forEach((img, index) => {
            const hasAlt = img.getAttribute('alt') && img.getAttribute('alt').trim() !== '';
            const hasTitle = img.getAttribute('title') && img.getAttribute('title').trim() !== '';
            const isOptimized = this.isImageOptimized(img);

            if (hasAlt) imagesWithAlt++;
            if (hasTitle) imagesWithTitle++;
            if (isOptimized) imagesOptimized++;

            if (!hasAlt) {
                imageIssues.push(`Image ${index + 1} missing alt text`);
            }

            if (!isOptimized) {
                imageIssues.push(`Image ${index + 1} could be optimized for better performance`);
            }
        });

        const analysis = {
            totalImages: totalImages,
            imagesWithAlt: imagesWithAlt,
            imagesWithTitle: imagesWithTitle,
            imagesOptimized: imagesOptimized,
            altTextCoverage: totalImages > 0 ? (imagesWithAlt / totalImages) * 100 : 100,
            issues: imageIssues,
            recommendations: []
        };

        if (analysis.altTextCoverage < 100) {
            analysis.recommendations.push('Add alt text to all images for better accessibility and SEO');
        }

        if (analysis.imagesOptimized / totalImages < 0.8) {
            analysis.recommendations.push('Optimize images for better page loading speed');
        }

        return analysis;
    }

    analyzeLinks() {
        const internalLinks = document.querySelectorAll(`a[href^="/"], a[href^="${window.location.origin}"]`);
        const externalLinks = document.querySelectorAll('a[href^="http"]:not([href^="' + window.location.origin + '"])');
        
        let internalLinksWithText = 0;
        let externalLinksWithNofollow = 0;

        internalLinks.forEach(link => {
            if (link.textContent.trim() !== '') {
                internalLinksWithText++;
            }
        });

        externalLinks.forEach(link => {
            if (link.getAttribute('rel') && link.getAttribute('rel').includes('nofollow')) {
                externalLinksWithNofollow++;
            }
        });

        const analysis = {
            internalLinks: internalLinks.length,
            externalLinks: externalLinks.length,
            internalLinksWithText: internalLinksWithText,
            externalLinksWithNofollow: externalLinksWithNofollow,
            recommendations: []
        };

        if (analysis.internalLinks < this.config.internalLinkMin) {
            analysis.recommendations.push(`Add more internal links, aim for at least ${this.config.internalLinkMin}`);
        }

        if (analysis.externalLinks > this.config.externalLinkMax) {
            analysis.recommendations.push('Consider reducing the number of external links');
        }

        if (analysis.externalLinksWithNofollow / analysis.externalLinks < 0.5) {
            analysis.recommendations.push('Consider adding rel="nofollow" to external links to preserve link equity');
        }

        return analysis;
    }

    analyzeHeadingStructure() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const headingStructure = [];
        let h1Count = 0;
        let hasKeywordInH1 = false;

        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));
            const text = heading.textContent.trim();
            
            headingStructure.push({
                level: level,
                text: text,
                tag: heading.tagName.toLowerCase()
            });

            if (level === 1) {
                h1Count++;
                const primaryKeyword = this.getPrimaryKeyword();
                if (primaryKeyword && text.toLowerCase().includes(primaryKeyword.toLowerCase())) {
                    hasKeywordInH1 = true;
                }
            }
        });

        const analysis = {
            headings: headingStructure,
            h1Count: h1Count,
            hasKeywordInH1: hasKeywordInH1,
            isStructureLogical: this.isHeadingStructureLogical(headingStructure),
            recommendations: []
        };

        if (h1Count === 0) {
            analysis.recommendations.push('Add an H1 heading to your page');
        } else if (h1Count > 1) {
            analysis.recommendations.push('Use only one H1 heading per page');
        }

        if (!hasKeywordInH1 && this.getPrimaryKeyword()) {
            analysis.recommendations.push('Include your primary keyword in the H1 heading');
        }

        if (!analysis.isStructureLogical) {
            analysis.recommendations.push('Improve heading structure - use headings in logical order (H1 > H2 > H3, etc.)');
        }

        return analysis;
    }

    analyzePageSpeed() {
        const analysis = {
            loadTime: 0,
            domContentLoaded: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            recommendations: []
        };

        // Use Performance API
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            analysis.loadTime = timing.loadEventEnd - timing.navigationStart;
            analysis.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
        }

        // Use Performance Observer for modern metrics
        if (window.PerformanceObserver) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name === 'first-contentful-paint') {
                            analysis.firstContentfulPaint = entry.startTime;
                        }
                        if (entry.entryType === 'largest-contentful-paint') {
                            analysis.largestContentfulPaint = entry.startTime;
                        }
                        if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                            analysis.cumulativeLayoutShift += entry.value;
                        }
                    }
                });

                observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
            } catch (error) {
                console.log('Performance Observer not fully supported');
            }
        }

        // Generate recommendations based on performance
        if (analysis.loadTime > 3000) {
            analysis.recommendations.push('Page load time is slow, optimize images and minify resources');
        }

        if (analysis.largestContentfulPaint > 2500) {
            analysis.recommendations.push('Largest Contentful Paint is slow, optimize above-the-fold content');
        }

        if (analysis.cumulativeLayoutShift > 0.1) {
            analysis.recommendations.push('Reduce Cumulative Layout Shift by setting image dimensions and avoiding dynamic content insertion');
        }

        return analysis;
    }

    analyzeMobileOptimization() {
        const analysis = {
            hasViewportMeta: !!document.querySelector('meta[name="viewport"]'),
            isResponsive: this.checkResponsiveDesign(),
            hasTouchFriendlyButtons: this.checkTouchFriendlyElements(),
            hasReadableFont: this.checkFontSizes(),
            recommendations: []
        };

        if (!analysis.hasViewportMeta) {
            analysis.recommendations.push('Add viewport meta tag for mobile optimization');
        }

        if (!analysis.isResponsive) {
            analysis.recommendations.push('Implement responsive design for better mobile experience');
        }

        if (!analysis.hasTouchFriendlyButtons) {
            analysis.recommendations.push('Make buttons and links touch-friendly (minimum 44px tap targets)');
        }

        if (!analysis.hasReadableFont) {
            analysis.recommendations.push('Ensure font sizes are readable on mobile devices (minimum 16px)');
        }

        return analysis;
    }

    calculateSEOScore() {
        let score = 0;
        const maxScore = 100;

        // Title optimization (20 points)
        if (this.metaAnalysis?.title?.isOptimal) score += 15;
        if (this.metaAnalysis?.title?.hasKeyword) score += 5;

        // Meta description (15 points)
        if (this.metaAnalysis?.description?.isOptimal) score += 10;
        if (this.metaAnalysis?.description?.hasKeyword) score += 5;

        // Content quality (25 points)
        if (this.contentAnalysis?.isOptimal) score += 15;
        if (this.contentAnalysis?.keywordDensity >= 0.5 && this.contentAnalysis?.keywordDensity <= 3) score += 5;
        if (this.contentAnalysis?.readabilityScore >= 60) score += 5;

        // Technical SEO (20 points)
        const images = this.analyzeImages();
        if (images.altTextCoverage >= 90) score += 10;
        
        const speed = this.analyzePageSpeed();
        if (speed.loadTime <= 3000) score += 10;

        // Mobile optimization (10 points)
        const mobile = this.analyzeMobileOptimization();
        if (mobile.hasViewportMeta && mobile.isResponsive) score += 10;

        // Heading structure (10 points)
        const headings = this.analyzeHeadingStructure();
        if (headings.h1Count === 1 && headings.hasKeywordInH1) score += 10;

        this.seoScore = Math.min(score, maxScore);
        return this.seoScore;
    }

    generateRecommendations() {
        this.recommendations = [];

        // Collect all recommendations from analyses
        const analyses = [
            this.metaAnalysis?.title,
            this.metaAnalysis?.description,
            this.contentAnalysis,
            this.analyzeImages(),
            this.analyzeLinks(),
            this.analyzeHeadingStructure(),
            this.analyzePageSpeed(),
            this.analyzeMobileOptimization()
        ];

        analyses.forEach(analysis => {
            if (analysis?.recommendations) {
                this.recommendations.push(...analysis.recommendations);
            }
        });

        // Prioritize recommendations
        this.recommendations = this.prioritizeRecommendations(this.recommendations);
    }

    prioritizeRecommendations(recommendations) {
        const priority = {
            'Add a page title': 1,
            'Add a meta description': 1,
            'Add an H1 heading': 1,
            'Add viewport meta tag': 2,
            'Include your primary keyword': 2,
            'Add alt text to all images': 3,
            'Improve page loading speed': 3
        };

        return recommendations.sort((a, b) => {
            const priorityA = priority[a] || 5;
            const priorityB = priority[b] || 5;
            return priorityA - priorityB;
        });
    }

    // Helper methods
    getPrimaryKeyword() {
        // In a real implementation, this would come from user input or analysis
        const path = window.location.pathname;
        if (path.includes('mystery')) return 'mystery novels';
        if (path.includes('thriller')) return 'thriller books';
        if (path.includes('author')) return 'mystery author';
        return 'mystery thriller novels';
    }

    hasCallToAction(text) {
        const ctaWords = ['buy', 'read', 'discover', 'explore', 'learn', 'download', 'subscribe', 'contact', 'order'];
        return ctaWords.some(word => text.toLowerCase().includes(word));
    }

    calculateKeywordDensity(content) {
        const primaryKeyword = this.getPrimaryKeyword();
        if (!primaryKeyword) return 0;

        const words = content.toLowerCase().split(/\s+/);
        const keywordWords = primaryKeyword.toLowerCase().split(/\s+/);
        const totalWords = words.length;

        let keywordCount = 0;
        for (let i = 0; i <= words.length - keywordWords.length; i++) {
            const phrase = words.slice(i, i + keywordWords.length).join(' ');
            if (phrase === primaryKeyword.toLowerCase()) {
                keywordCount++;
            }
        }

        return totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;
    }

    calculateReadabilityScore(content) {
        // Simplified Flesch Reading Ease calculation
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = content.split(/\s+/).filter(w => w.length > 0);
        const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

        if (sentences.length === 0 || words.length === 0) return 0;

        const avgSentenceLength = words.length / sentences.length;
        const avgSyllablesPerWord = syllables / words.length;

        return 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    }

    countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
    }

    hasIntroduction() {
        const firstParagraph = document.querySelector('p');
        return firstParagraph && firstParagraph.textContent.length > 100;
    }

    hasConclusion() {
        const paragraphs = document.querySelectorAll('p');
        const lastParagraph = paragraphs[paragraphs.length - 1];
        return lastParagraph && (
            lastParagraph.textContent.toLowerCase().includes('conclusion') ||
            lastParagraph.textContent.toLowerCase().includes('in summary') ||
            lastParagraph.textContent.toLowerCase().includes('to conclude')
        );
    }

    assessContentQuality(content) {
        const quality = {
            hasOriginalContent: content.length > 500,
            hasStructure: document.querySelectorAll('h2, h3').length >= 2,
            hasLists: document.querySelectorAll('ul, ol').length > 0,
            hasTables: document.querySelectorAll('table').length > 0,
            hasImages: document.querySelectorAll('img').length > 0
        };

        const score = Object.values(quality).filter(Boolean).length;
        return {
            ...quality,
            overallScore: (score / 5) * 100
        };
    }

    isImageOptimized(img) {
        // Basic optimization checks
        const src = img.src.toLowerCase();
        const hasWebP = src.includes('.webp');
        const hasOptimizedFormat = hasWebP || src.includes('.jpg') || src.includes('.png');
        const hasLazyLoading = img.getAttribute('loading') === 'lazy';
        const hasResponsive = img.getAttribute('srcset') || img.getAttribute('sizes');

        return hasOptimizedFormat && (hasLazyLoading || hasResponsive);
    }

    isHeadingStructureLogical(headings) {
        let currentLevel = 0;
        
        for (const heading of headings) {
            if (heading.level === 1) {
                if (currentLevel > 0) return false; // Multiple H1s
                currentLevel = 1;
            } else {
                if (heading.level > currentLevel + 1) return false; // Skipped levels
                currentLevel = heading.level;
            }
        }
        
        return true;
    }

    checkResponsiveDesign() {
        // Basic responsive design check
        const hasMediaQueries = Array.from(document.styleSheets).some(sheet => {
            try {
                return Array.from(sheet.cssRules || []).some(rule => 
                    rule.type === CSSRule.MEDIA_RULE
                );
            } catch (e) {
                return false;
            }
        });

        const hasFlexibleImages = Array.from(document.querySelectorAll('img')).some(img => {
            const style = window.getComputedStyle(img);
            return style.maxWidth === '100%' || style.width.includes('%');
        });

        return hasMediaQueries || hasFlexibleImages;
    }

    checkTouchFriendlyElements() {
        const buttons = document.querySelectorAll('button, a, input[type="submit"]');
        let touchFriendlyCount = 0;

        buttons.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width >= 44 && rect.height >= 44) {
                touchFriendlyCount++;
            }
        });

        return buttons.length === 0 || (touchFriendlyCount / buttons.length) >= 0.8;
    }

    checkFontSizes() {
        const textElements = document.querySelectorAll('p, span, div, li');
        let readableCount = 0;

        textElements.forEach(element => {
            const style = window.getComputedStyle(element);
            const fontSize = parseFloat(style.fontSize);
            if (fontSize >= 16) {
                readableCount++;
            }
        });

        return textElements.length === 0 || (readableCount / textElements.length) >= 0.8;
    }

    analyzeCanonical() {
        const canonical = document.querySelector('link[rel="canonical"]');
        return {
            exists: !!canonical,
            url: canonical?.href,
            isCorrect: canonical?.href === window.location.href
        };
    }

    analyzeOpenGraph() {
        const ogTags = {};
        document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
            const property = meta.getAttribute('property');
            ogTags[property] = meta.getAttribute('content');
        });

        return {
            hasTitle: !!ogTags['og:title'],
            hasDescription: !!ogTags['og:description'],
            hasImage: !!ogTags['og:image'],
            hasUrl: !!ogTags['og:url'],
            hasType: !!ogTags['og:type'],
            tags: ogTags
        };
    }

    analyzeTwitterCard() {
        const twitterTags = {};
        document.querySelectorAll('meta[name^="twitter:"]').forEach(meta => {
            const name = meta.getAttribute('name');
            twitterTags[name] = meta.getAttribute('content');
        });

        return {
            hasCard: !!twitterTags['twitter:card'],
            hasTitle: !!twitterTags['twitter:title'],
            hasDescription: !!twitterTags['twitter:description'],
            hasImage: !!twitterTags['twitter:image'],
            tags: twitterTags
        };
    }

    analyzeRobotsMeta() {
        const robotsMeta = document.querySelector('meta[name="robots"]');
        const content = robotsMeta?.getAttribute('content') || '';
        
        return {
            exists: !!robotsMeta,
            content: content,
            allowsIndexing: !content.includes('noindex'),
            allowsFollowing: !content.includes('nofollow')
        };
    }

    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        if ('PerformanceObserver' in window) {
            // LCP
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.analytics.largestContentfulPaint = lastEntry.startTime;
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // FID
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    this.analytics.firstInputDelay = entry.processingStart - entry.startTime;
                }
            }).observe({ entryTypes: ['first-input'] });

            // CLS
            let clsValue = 0;
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.analytics.cumulativeLayoutShift = clsValue;
            }).observe({ entryTypes: ['layout-shift'] });
        }
    }

    setupUserBehaviorTracking() {
        // Track time on page
        const startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            this.analytics.timeOnPage = Date.now() - startTime;
        });

        // Track scroll depth
        let maxScrollDepth = 0;
        window.addEventListener('scroll', () => {
            const scrollDepth = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
            this.analytics.scrollDepth = maxScrollDepth;
        });

        // Track clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="http"]')) {
                this.analytics.externalClicks = (this.analytics.externalClicks || 0) + 1;
            }
        });
    }

    initializeABTesting() {
        // Simple A/B testing for SEO elements
        const tests = [
            {
                element: 'title',
                variants: ['A', 'B'],
                metric: 'clickThroughRate'
            },
            {
                element: 'meta-description',
                variants: ['A', 'B'],
                metric: 'clickThroughRate'
            }
        ];

        tests.forEach(test => {
            const variant = Math.random() < 0.5 ? 'A' : 'B';
            sessionStorage.setItem(`abtest_${test.element}`, variant);
        });
    }

    setupAutoOptimization() {
        // Automatically apply some optimizations
        this.optimizeImages();
        this.optimizeInternalLinks();
        this.addMissingMetaTags();
    }

    optimizeImages() {
        document.querySelectorAll('img:not([alt])').forEach(img => {
            // Add generic alt text if missing
            const src = img.src;
            const filename = src.split('/').pop().split('.')[0];
            img.alt = filename.replace(/[-_]/g, ' ');
        });

        // Add lazy loading to images below the fold
        const images = document.querySelectorAll('img:not([loading])');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    entry.target.setAttribute('loading', 'lazy');
                }
            });
        });

        images.forEach(img => observer.observe(img));
    }

    optimizeInternalLinks() {
        // Add title attributes to internal links
        document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]').forEach(link => {
            if (!link.title && link.textContent.trim()) {
                link.title = link.textContent.trim();
            }
        });
    }

    addMissingMetaTags() {
        // Add viewport meta if missing
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0';
            document.head.appendChild(viewport);
        }

        // Add charset if missing
        if (!document.querySelector('meta[charset]')) {
            const charset = document.createElement('meta');
            charset.setAttribute('charset', 'UTF-8');
            document.head.insertBefore(charset, document.head.firstChild);
        }
    }

    // Public API methods
    getSEOScore() {
        return this.seoScore;
    }

    getRecommendations() {
        return this.recommendations;
    }

    getFullAnalysis() {
        return {
            score: this.seoScore,
            recommendations: this.recommendations,
            meta: this.metaAnalysis,
            content: this.contentAnalysis,
            images: this.analyzeImages(),
            links: this.analyzeLinks(),
            headings: this.analyzeHeadingStructure(),
            speed: this.analyzePageSpeed(),
            mobile: this.analyzeMobileOptimization(),
            analytics: this.analytics
        };
    }

    optimizePage() {
        this.setupAutoOptimization();
        return this.analyzeCurrentPage();
    }

    exportReport() {
        const report = this.getFullAnalysis();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `seo-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize SEO optimizer
document.addEventListener('DOMContentLoaded', () => {
    window.seoOptimizer = new SEOOptimizer();
    
    // Auto-analyze after page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            window.seoOptimizer.analyzeCurrentPage();
        }, 1000);
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOOptimizer;
}
