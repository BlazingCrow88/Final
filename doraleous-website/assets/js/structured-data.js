/* ===================================
   STRUCTURED DATA MANAGER
   File: assets/js/structured-data.js
   =================================== */

(function() {
    'use strict';

    // Configuration - Update these with your actual information
    const CONFIG = {
        author: {
            name: "Your Author Name",
            description: "Author of mystery and thriller novels",
            image: "/assets/images/author-photo.jpg",
            website: window.location.origin,
            email: "contact@yourname.com",
            socialMedia: {
                twitter: "https://twitter.com/yourhandle",
                facebook: "https://facebook.com/yourname", 
                instagram: "https://instagram.com/yourname",
                goodreads: "https://goodreads.com/author/yourname"
            }
        },
        website: {
            name: "Your Author Name - Official Website",
            description: "Official website of mystery novelist Your Author Name"
        }
    };

    // Initialize structured data
    function init() {
        addAuthorData();
        addWebsiteData();
        
        // Add page-specific data based on current page
        const pageType = detectPageType();
        if (pageType === 'book') {
            addBookData();
        }
    }

    // Add author (Person) structured data
    function addAuthorData() {
        const authorSchema = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": CONFIG.author.name,
            "description": CONFIG.author.description,
            "url": CONFIG.author.website,
            "image": CONFIG.author.website + CONFIG.author.image,
            "jobTitle": "Author",
            "sameAs": Object.values(CONFIG.author.socialMedia).filter(url => url),
            "knowsAbout": ["Creative Writing", "Mystery Fiction", "Thriller Novels"]
        };

        insertStructuredData(authorSchema, 'author');
    }

    // Add website structured data
    function addWebsiteData() {
        const websiteSchema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": CONFIG.website.name,
            "description": CONFIG.website.description,
            "url": CONFIG.author.website,
            "author": {
                "@type": "Person",
                "name": CONFIG.author.name
            }
        };

        insertStructuredData(websiteSchema, 'website');
    }

    // Add book structured data (for individual book pages)
    function addBookData() {
        const bookData = extractBookData();
        
        if (!bookData.title) return;

        const bookSchema = {
            "@context": "https://schema.org",
            "@type": "Book",
            "name": bookData.title,
            "description": bookData.description,
            "author": {
                "@type": "Person",
                "name": CONFIG.author.name
            },
            "genre": bookData.genre || ["Mystery", "Thriller"],
            "inLanguage": "en"
        };

        // Add optional fields if they exist
        if (bookData.isbn) bookSchema.isbn = bookData.isbn;
        if (bookData.publishDate) bookSchema.datePublished = bookData.publishDate;
        if (bookData.publisher) bookSchema.publisher = {
            "@type": "Organization",
            "name": bookData.publisher
        };
        if (bookData.coverImage) bookSchema.image = bookData.coverImage;
        if (bookData.pages) bookSchema.numberOfPages = bookData.pages;

        insertStructuredData(bookSchema, 'book');
    }

    // Extract book data from page
    function extractBookData() {
        return {
            title: getMetaContent('book-title') || 
                   document.querySelector('h1.book-title, .book-info h1, h1')?.textContent?.trim(),
            description: getMetaContent('book-description') || 
                        getMetaContent('description') ||
                        document.querySelector('.book-description, .book-summary')?.textContent?.trim(),
            isbn: getMetaContent('book-isbn') || 
                  document.querySelector('[data-isbn]')?.dataset.isbn,
            publishDate: getMetaContent('book-publish-date') ||
                        document.querySelector('[data-publish-date]')?.dataset.publishDate,
            publisher: getMetaContent('book-publisher') ||
                      document.querySelector('.book-publisher')?.textContent?.trim(),
            genre: getMetaContent('book-genre')?.split(',').map(g => g.trim()),
            coverImage: getMetaContent('book-image') || 
                       document.querySelector('.book-cover img, .cover-image')?.src,
            pages: getMetaContent('book-pages') ||
                   document.querySelector('[data-pages]')?.dataset.pages
        };
    }

    // Detect what type of page this is
    function detectPageType() {
        const path = window.location.pathname.toLowerCase();
        const title = document.title.toLowerCase();
        
        // Check if this is a book page
        if (path.includes('/book') || 
            title.includes('book') || 
            document.querySelector('.book-info, .book-details, .book-cover')) {
            return 'book';
        }
        
        return 'page';
    }

    // Get meta tag content
    function getMetaContent(name) {
        const selectors = [
            `meta[name="${name}"]`,
            `meta[property="${name}"]`,
            `meta[property="book:${name.replace('book-', '')}"]`,
            `[data-${name}]`
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.getAttribute('content') || element.dataset[name.replace(/-/g, '')];
            }
        }
        
        return null;
    }

    // Insert structured data into page
    function insertStructuredData(data, id) {
        // Remove existing script with same ID
        const existing = document.querySelector(`script[data-structured-data="${id}"]`);
        if (existing) {
            existing.remove();
        }

        // Create new script element
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.dataset.structuredData = id;
        script.textContent = JSON.stringify(data, null, 2);
        document.head.appendChild(script);
    }

    // Public API for manual updates
    window.StructuredData = {
        updateAuthor: function(authorData) {
            Object.assign(CONFIG.author, authorData);
            addAuthorData();
        },
        
        addCustomData: function(data, id) {
            insertStructuredData(data, id);
        },
        
        refreshBookData: function() {
            if (detectPageType() === 'book') {
                addBookData();
            }
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
