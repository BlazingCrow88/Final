/* ===================================
   META TAGS MANAGER
   File: assets/js/meta-tags.js
   =================================== */

class MetaTagsManager {
    constructor() {
        this.defaultMeta = {
            title: 'Author Name - Mystery & Thriller Novels',
            description: 'Award-winning author of mystery and thriller novels. Discover gripping stories, compelling characters, and page-turning suspense.',
            keywords: 'mystery novels, thriller books, author, fiction, suspense, crime novels',
            author: 'Author Name',
            image: '/assets/images/author-social-card.jpg',
            url: window.location.href,
            type: 'website',
            siteName: 'Author Name Official Website',
            twitterCard: 'summary_large_image',
            twitterSite: '@authorhandle',
            language: 'en',
            robots: 'index, follow'
        };
        
        this.init();
    }

    init() {
        this.updatePageMeta();
        this.setupDynamicMetaUpdates();
        this.addStructuredData();
    }

    updatePageMeta() {
        const pageType = this.detectPageType();
        const metaData = this.getPageMetaData(pageType);
        
        this.setTitle(metaData.title);
        this.setMetaDescription(metaData.description);
        this.setMetaKeywords(metaData.keywords);
        this.setCanonicalURL(metaData.url);
        this.setOpenGraphTags(metaData);
        this.setTwitterCardTags(metaData);
        this.setOtherMetaTags(metaData);
    }

    detectPageType() {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        
        if (path === '/' || path === '/index.html') {
            return 'home';
        } else if (path.includes('/about')) {
            return 'about';
        } else if (path.includes('/books')) {
            const bookSlug = this.extractSlugFromPath(path, 'books');
            return bookSlug ? 'book' : 'books';
        } else if (path.includes('/blog')) {
            const postSlug = this.extractSlugFromPath(path, 'blog');
            return postSlug ? 'blog-post' : 'blog';
        } else if (path.includes('/contact')) {
            return 'contact';
        } else if (path.includes('/cart')) {
            return 'cart';
        } else if (path.includes('/checkout')) {
            return 'checkout';
        } else if (path.includes('/privacy-policy')) {
            return 'privacy-policy';
        } else if (path.includes('/terms-of-service')) {
            return 'terms';
        } else {
            return 'generic';
        }
    }

    extractSlugFromPath(path, section) {
        const regex = new RegExp(`/${section}/([^/]+)`);
        const match = path.match(regex);
        return match ? match[1] : null;
    }

    getPageMetaData(pageType) {
        const baseURL = `${window.location.protocol}//${window.location.host}`;
        
        switch (pageType) {
            case 'home':
                return {
                    ...this.defaultMeta,
                    title: 'Author Name - Award-Winning Mystery & Thriller Novelist',
                    description: 'Discover gripping mystery and thriller novels by award-winning author. New releases, bestsellers, and exclusive content. Enter a world of suspense and intrigue.',
                    keywords: 'mystery novels, thriller books, bestselling author, new releases, fiction, suspense, crime novels, detective stories',
                    type: 'website',
                    url: baseURL
                };

            case 'about':
                return {
                    ...this.defaultMeta,
                    title: 'About Author Name - Mystery & Thriller Novelist',
                    description: 'Learn about Author Name, award-winning writer of mystery and thriller novels. Discover the inspiration behind the stories and the journey to becoming a bestselling author.',
                    keywords: 'author biography, mystery writer, thriller author, bestselling novelist, author background',
                    type: 'profile',
                    url: `${baseURL}/about`
                };

            case 'books':
                return {
                    ...this.defaultMeta,
                    title: 'Books by Author Name - Mystery & Thriller Collection',
                    description: 'Explore the complete collection of mystery and thriller novels by Author Name. From debut works to latest releases, discover your next page-turner.',
                    keywords: 'mystery books, thriller novels, book collection, new releases, bestsellers, fiction books',
                    type: 'website',
                    url: `${baseURL}/books`
                };

            case 'book':
                return this.getBookMetaData();

            case 'blog':
                return {
                    ...this.defaultMeta,
                    title: 'Author Blog - Writing Tips, News & Insights',
                    description: 'Read the latest posts from Author Name. Get writing tips, behind-the-scenes insights, book news, and thoughts on the craft of storytelling.',
                    keywords: 'author blog, writing tips, book news, author insights, storytelling, writing advice',
                    type: 'blog',
                    url: `${baseURL}/blog`
                };

            case 'blog-post':
                return this.getBlogPostMetaData();

            case 'contact':
                return {
                    ...this.defaultMeta,
                    title: 'Contact Author Name - Get in Touch',
                    description: 'Contact Author Name for speaking engagements, interviews, collaborations, or general inquiries. Connect with the author directly.',
                    keywords: 'contact author, speaking engagements, author interviews, book signings, collaborations',
                    type: 'website',
                    url: `${baseURL}/contact`,
                    robots: 'index, follow, noarchive'
                };

            case 'cart':
                return {
                    ...this.defaultMeta,
                    title: 'Shopping Cart - Author Name Books',
                    description: 'Review your selected books and proceed to checkout. Secure payment and fast delivery available.',
                    robots: 'noindex, nofollow',
                    url: `${baseURL}/cart`
                };

            case 'checkout':
                return {
                    ...this.defaultMeta,
                    title: 'Checkout - Complete Your Purchase',
                    description: 'Complete your book purchase with secure payment options. Fast and reliable delivery worldwide.',
                    robots: 'noindex, nofollow',
                    url: `${baseURL}/checkout`
                };

            case 'privacy-policy':
                return {
                    ...this.defaultMeta,
                    title: 'Privacy Policy - Author Name',
                    description: 'Read our privacy policy to understand how we collect, use, and protect your personal information.',
                    keywords: 'privacy policy, data protection, personal information, cookies, GDPR',
                    robots: 'index, nofollow',
                    url: `${baseURL}/privacy-policy`
                };

            case 'terms':
                return {
                    ...this.defaultMeta,
                    title: 'Terms of Service - Author Name',
                    description: 'Review our terms of service for using this website and purchasing our products.',
                    keywords: 'terms of service, website terms, purchase terms, user agreement',
                    robots: 'index, nofollow',
                    url: `${baseURL}/terms-of-service`
                };

            default:
                return this.defaultMeta;
        }
    }

    getBookMetaData() {
        // Try to extract book data from page content or data attributes
        const bookTitle = this.extractContentMeta('book-title') || 'Book';
        const bookDescription = this.extractContentMeta('book-description') || '';
        const bookImage = this.extractContentMeta('book-image') || this.defaultMeta.image;
        const bookPrice = this.extractContentMeta('book-price') || '';
        const bookAuthor = this.extractContentMeta('book-author') || this.defaultMeta.author;
        const bookGenre = this.extractContentMeta('book-genre') || 'Mystery';
        const bookISBN = this.extractContentMeta('book-isbn') || '';

        return {
            ...this.defaultMeta,
            title: `${bookTitle} by ${bookAuthor} - Mystery Thriller Novel`,
            description: bookDescription || `Discover "${bookTitle}" by ${bookAuthor}. A gripping ${bookGenre.toLowerCase()} novel that will keep you on the edge of your seat.`,
            keywords: `${bookTitle}, ${bookAuthor}, ${bookGenre.toLowerCase()} novel, mystery book, thriller book, fiction`,
            image: bookImage,
            type: 'book',
            url: window.location.href,
            bookMeta: {
                isbn: bookISBN,
                author: bookAuthor,
                genre: bookGenre,
                price: bookPrice
            }
        };
    }

    getBlogPostMetaData() {
        const postTitle = this.extractContentMeta('post-title') || 'Blog Post';
        const postDescription = this.extractContentMeta('post-description') || '';
        const postImage = this.extractContentMeta('post-image') || this.defaultMeta.image;
        const postAuthor = this.extractContentMeta('post-author') || this.defaultMeta.author;
        const postDate = this.extractContentMeta('post-date') || '';
        const postCategory = this.extractContentMeta('post-category') || 'Writing';

        return {
            ...this.defaultMeta,
            title: `${postTitle} - Author Name Blog`,
            description: postDescription || `Read "${postTitle}" on the Author Name blog. Insights on writing, publishing, and the creative process.`,
            keywords: `${postTitle}, author blog, writing tips, ${postCategory.toLowerCase()}, author insights`,
            image: postImage,
            type: 'article',
            url: window.location.href,
            articleMeta: {
                author: postAuthor,
                publishedTime: postDate,
                section: postCategory
            }
        };
    }

    extractContentMeta(type) {
        // Try multiple methods to extract content meta data
        
        // Method 1: Data attributes
        const dataElement = document.querySelector(`[data-meta-${type}]`);
        if (dataElement) {
            return dataElement.dataset[`meta${type.charAt(0).toUpperCase() + type.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`];
        }

        // Method 2: Meta tags
        const metaElement = document.querySelector(`meta[name="meta-${type}"], meta[property="meta-${type}"]`);
        if (metaElement) {
            return metaElement.getAttribute('content');
        }

        // Method 3: Specific content elements
        switch (type) {
            case 'book-title':
            case 'post-title':
                return document.querySelector('h1')?.textContent.trim();
            
            case 'book-description':
            case 'post-description':
                const descElement = document.querySelector('.book-description, .post-excerpt, .product-description');
                return descElement?.textContent.trim();
            
            case 'book-image':
            case 'post-image':
                const imgElement = document.querySelector('.book-cover img, .post-featured-image img, .product-image img');
                return imgElement?.src;
            
            case 'book-price':
                const priceElement = document.querySelector('.book-price, .product-price, .price');
                return priceElement?.textContent.trim();
            
            default:
                return null;
        }
    }

    setTitle(title) {
        document.title = title;
        this.setMetaTag('property', 'og:title', title);
        this.setMetaTag('name', 'twitter:title', title);
    }

    setMetaDescription(description) {
        this.setMetaTag('name', 'description', description);
        this.setMetaTag('property', 'og:description', description);
        this.setMetaTag('name', 'twitter:description', description);
    }

    setMetaKeywords(keywords) {
        this.setMetaTag('name', 'keywords', keywords);
    }

    setCanonicalURL(url) {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = url;
    }

    setOpenGraphTags(metaData) {
        this.setMetaTag('property', 'og:title', metaData.title);
        this.setMetaTag('property', 'og:description', metaData.description);
        this.setMetaTag('property', 'og:image', metaData.image);
        this.setMetaTag('property', 'og:url', metaData.url);
        this.setMetaTag('property', 'og:type', metaData.type);
        this.setMetaTag('property', 'og:site_name', metaData.siteName);
        this.setMetaTag('property', 'og:locale', metaData.language);

        // Article-specific tags
        if (metaData.articleMeta) {
            this.setMetaTag('property', 'article:author', metaData.articleMeta.author);
            if (metaData.articleMeta.publishedTime) {
                this.setMetaTag('property', 'article:published_time', metaData.articleMeta.publishedTime);
            }
            if (metaData.articleMeta.section) {
                this.setMetaTag('property', 'article:section', metaData.articleMeta.section);
            }
        }

        // Book-specific tags
        if (metaData.bookMeta) {
            this.setMetaTag('property', 'book:author', metaData.bookMeta.author);
            if (metaData.bookMeta.isbn) {
                this.setMetaTag('property', 'book:isbn', metaData.bookMeta.isbn);
            }
            if (metaData.bookMeta.genre) {
                this.setMetaTag('property', 'book:tag', metaData.bookMeta.genre);
            }
        }
    }

    setTwitterCardTags(metaData) {
        this.setMetaTag('name', 'twitter:card', metaData.twitterCard || 'summary_large_image');
        this.setMetaTag('name', 'twitter:site', metaData.twitterSite);
        this.setMetaTag('name', 'twitter:creator', metaData.twitterSite);
        this.setMetaTag('name', 'twitter:title', metaData.title);
        this.setMetaTag('name', 'twitter:description', metaData.description);
        this.setMetaTag('name', 'twitter:image', metaData.image);
    }

    setOtherMetaTags(metaData) {
        this.setMetaTag('name', 'author', metaData.author);
        this.setMetaTag('name', 'robots', metaData.robots);
        this.setMetaTag('name', 'language', metaData.language);
        this.setMetaTag('http-equiv', 'content-language', metaData.language);
        
        // Viewport (if not already set)
        if (!document.querySelector('meta[name="viewport"]')) {
            this.setMetaTag('name', 'viewport', 'width=device-width, initial-scale=1.0');
        }

        // Theme color
        this.setMetaTag('name', 'theme-color', '#1a1a1a');
        this.setMetaTag('name', 'msapplication-navbutton-color', '#1a1a1a');
        this.setMetaTag('name', 'apple-mobile-web-app-status-bar-style', 'black-translucent');
    }

    setMetaTag(attribute, name, content) {
        if (!content) return;

        let meta = document.querySelector(`meta[${attribute}="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attribute, name);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

    setupDynamicMetaUpdates() {
        // Update meta tags when content changes (for SPAs)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.target.tagName === 'TITLE') {
                    this.updatePageMeta();
                }
            });
        });

        observer.observe(document.head, {
            childList: true,
            subtree: true
        });

        // Listen for navigation events
        window.addEventListener('popstate', () => {
            setTimeout(() => this.updatePageMeta(), 100);
        });
    }

    addStructuredData() {
        // Add JSON-LD structured data
        const pageType = this.detectPageType();
        let structuredData = null;

        switch (pageType) {
            case 'home':
                structuredData = this.getWebsiteStructuredData();
                break;
            case 'book':
                structuredData = this.getBookStructuredData();
                break;
            case 'blog-post':
                structuredData = this.getArticleStructuredData();
                break;
            case 'about':
                structuredData = this.getPersonStructuredData();
                break;
        }

        if (structuredData) {
            this.insertStructuredData(structuredData);
        }

        // Add breadcrumb structured data
        this.addBreadcrumbStructuredData();
    }

    getWebsiteStructuredData() {
        return {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": this.defaultMeta.siteName,
            "url": `${window.location.protocol}//${window.location.host}`,
            "description": this.defaultMeta.description,
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${window.location.protocol}//${window.location.host}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            },
            "author": {
                "@type": "Person",
                "name": this.defaultMeta.author
            }
        };
    }

    getBookStructuredData() {
        const bookTitle = this.extractContentMeta('book-title');
        const bookDescription = this.extractContentMeta('book-description');
        const bookImage = this.extractContentMeta('book-image');
        const bookPrice = this.extractContentMeta('book-price');
        const bookISBN = this.extractContentMeta('book-isbn');

        return {
            "@context": "https://schema.org",
            "@type": "Book",
            "name": bookTitle,
            "description": bookDescription,
            "image": bookImage,
            "author": {
                "@type": "Person",
                "name": this.defaultMeta.author
            },
            "isbn": bookISBN,
            "genre": "Mystery",
            "bookFormat": "https://schema.org/Paperback",
            "offers": {
                "@type": "Offer",
                "price": bookPrice?.replace(/[^0-9.]/g, ''),
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
            }
        };
    }

    getArticleStructuredData() {
        const postTitle = this.extractContentMeta('post-title');
        const postDescription = this.extractContentMeta('post-description');
        const postImage = this.extractContentMeta('post-image');
        const postDate = this.extractContentMeta('post-date');

        return {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": postTitle,
            "description": postDescription,
            "image": postImage,
            "author": {
                "@type": "Person",
                "name": this.defaultMeta.author
            },
            "publisher": {
                "@type": "Organization",
                "name": this.defaultMeta.siteName,
                "logo": {
                    "@type": "ImageObject",
                    "url": `${window.location.protocol}//${window.location.host}/assets/images/logo.png`
                }
            },
            "datePublished": postDate,
            "dateModified": postDate,
            "mainEntityOfPage": window.location.href
        };
    }

    getPersonStructuredData() {
        return {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": this.defaultMeta.author,
            "jobTitle": "Author",
            "description": "Award-winning mystery and thriller novelist",
            "url": `${window.location.protocol}//${window.location.host}`,
            "sameAs": [
                "https://twitter.com/authorhandle",
                "https://facebook.com/authorname",
                "https://instagram.com/authorname"
            ],
            "knowsAbout": ["Mystery Writing", "Thriller Novels", "Creative Writing", "Storytelling"]
        };
    }

    addBreadcrumbStructuredData() {
        const path = window.location.pathname;
        const pathSegments = path.split('/').filter(segment => segment);
        
        if (pathSegments.length === 0) return;

        const breadcrumbList = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": []
        };

        const baseURL = `${window.location.protocol}//${window.location.host}`;
        
        // Add home
        breadcrumbList.itemListElement.push({
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseURL
        });

        // Add path segments
        let currentPath = '';
        pathSegments.forEach((segment, index) => {
            currentPath += '/' + segment;
            breadcrumbList.itemListElement.push({
                "@type": "ListItem",
                "position": index + 2,
                "name": this.formatBreadcrumbName(segment),
                "item": baseURL + currentPath
            });
        });

        this.insertStructuredData(breadcrumbList);
    }

    formatBreadcrumbName(segment) {
        return segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    insertStructuredData(data) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
    }

    // Public API methods
    updateMeta(metaData) {
        const mergedData = { ...this.defaultMeta, ...metaData };
        this.setTitle(mergedData.title);
        this.setMetaDescription(mergedData.description);
        this.setOpenGraphTags(mergedData);
        this.setTwitterCardTags(mergedData);
    }

    setPageTitle(title) {
        this.setTitle(title);
    }

    setPageDescription(description) {
        this.setMetaDescription(description);
    }

    setPageImage(imageUrl) {
        this.setMetaTag('property', 'og:image', imageUrl);
        this.setMetaTag('name', 'twitter:image', imageUrl);
    }
}

// Initialize meta tags manager
document.addEventListener('DOMContentLoaded', () => {
    window.metaTagsManager = new MetaTagsManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetaTagsManager;
}
