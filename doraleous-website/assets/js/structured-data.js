/* ===================================
   STRUCTURED DATA MANAGER
   File: assets/js/structured-data.js
   =================================== */

class StructuredDataManager {
    constructor() {
        this.baseURL = `${window.location.protocol}//${window.location.host}`;
        this.organizationData = {
            name: "Author Name",
            url: this.baseURL,
            logo: `${this.baseURL}/assets/images/logo.png`,
            description: "Award-winning mystery and thriller novelist",
            foundingDate: "2010",
            email: "contact@authorname.com",
            telephone: "+1-555-123-4567",
            address: {
                "@type": "PostalAddress",
                "addressCountry": "US",
                "addressRegion": "NY",
                "addressLocality": "New York"
            },
            sameAs: [
                "https://twitter.com/authorhandle",
                "https://facebook.com/authorname",
                "https://instagram.com/authorname",
                "https://linkedin.com/in/authorname",
                "https://goodreads.com/author/authorname"
            ]
        };
        
        this.authorData = {
            name: "Author Name",
            givenName: "Author",
            familyName: "Name",
            jobTitle: "Novelist",
            description: "Award-winning author specializing in mystery and thriller novels",
            birthDate: "1980-01-01",
            nationality: "American",
            gender: "https://schema.org/Male",
            url: this.baseURL,
            image: `${this.baseURL}/assets/images/author-photo.jpg`,
            sameAs: this.organizationData.sameAs,
            worksFor: {
                "@type": "Organization",
                "name": this.organizationData.name
            },
            award: [
                "Mystery Writers of America Edgar Award Nominee",
                "International Thriller Writers Award Winner",
                "Goodreads Choice Award Nominee"
            ],
            knowsAbout: [
                "Mystery Writing",
                "Thriller Fiction",
                "Crime Novels",
                "Suspense Writing",
                "Character Development",
                "Plot Construction"
            ]
        };

        this.init();
    }

    init() {
        this.addBaseStructuredData();
        this.addPageSpecificStructuredData();
        this.setupDynamicUpdates();
    }

    addBaseStructuredData() {
        // Add Organization structured data
        this.addOrganizationData();
        
        // Add Person (Author) structured data
        this.addPersonData();
        
        // Add Website structured data
        this.addWebsiteData();
    }

    addOrganizationData() {
        const organizationSchema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${this.baseURL}#organization`,
            "name": this.organizationData.name,
            "url": this.organizationData.url,
            "logo": {
                "@type": "ImageObject",
                "url": this.organizationData.logo,
                "width": 600,
                "height": 60
            },
            "description": this.organizationData.description,
            "foundingDate": this.organizationData.foundingDate,
            "email": this.organizationData.email,
            "telephone": this.organizationData.telephone,
            "address": this.organizationData.address,
            "sameAs": this.organizationData.sameAs,
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": this.organizationData.telephone,
                "contactType": "customer service",
                "email": this.organizationData.email,
                "availableLanguage": ["English"]
            }
        };

        this.insertStructuredData(organizationSchema, 'organization');
    }

    addPersonData() {
        const personSchema = {
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": `${this.baseURL}#person`,
            "name": this.authorData.name,
            "givenName": this.authorData.givenName,
            "familyName": this.authorData.familyName,
            "jobTitle": this.authorData.jobTitle,
            "description": this.authorData.description,
            "birthDate": this.authorData.birthDate,
            "nationality": this.authorData.nationality,
            "gender": this.authorData.gender,
            "url": this.authorData.url,
            "image": {
                "@type": "ImageObject",
                "url": this.authorData.image,
                "width": 400,
                "height": 400
            },
            "sameAs": this.authorData.sameAs,
            "worksFor": {
                "@type": "Organization",
                "@id": `${this.baseURL}#organization`
            },
            "award": this.authorData.award,
            "knowsAbout": this.authorData.knowsAbout,
            "alumniOf": {
                "@type": "EducationalOrganization",
                "name": "University Name"
            },
            "memberOf": {
                "@type": "Organization",
                "name": "Mystery Writers of America"
            }
        };

        this.insertStructuredData(personSchema, 'person');
    }

    addWebsiteData() {
        const websiteSchema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${this.baseURL}#website`,
            "name": `${this.organizationData.name} - Official Website`,
            "alternateName": this.organizationData.name,
            "url": this.baseURL,
            "description": this.organizationData.description,
            "publisher": {
                "@type": "Organization",
                "@id": `${this.baseURL}#organization`
            },
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${this.baseURL}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            },
            "mainEntity": {
                "@type": "Person",
                "@id": `${this.baseURL}#person`
            }
        };

        this.insertStructuredData(websiteSchema, 'website');
    }

    addPageSpecificStructuredData() {
        const pageType = this.detectPageType();
        
        switch (pageType) {
            case 'book':
                this.addBookData();
                break;
            case 'blog-post':
                this.addBlogPostData();
                break;
            case 'books':
                this.addBookCollectionData();
                break;
            case 'blog':
                this.addBlogData();
                break;
            case 'contact':
                this.addContactPageData();
                break;
            case 'about':
                this.addAboutPageData();
                break;
            case 'events':
                this.addEventsData();
                break;
        }

        // Always add breadcrumb data for non-home pages
        if (pageType !== 'home') {
            this.addBreadcrumbData();
        }
    }

    addBookData() {
        const bookData = this.extractBookData();
        
        if (!bookData.title) return;

        const bookSchema = {
            "@context": "https://schema.org",
            "@type": "Book",
            "@id": `${window.location.href}#book`,
            "name": bookData.title,
            "alternateName": bookData.subtitle,
            "description": bookData.description,
            "isbn": bookData.isbn,
            "bookEdition": bookData.edition || "First Edition",
            "bookFormat": bookData.format || "https://schema.org/Paperback",
            "genre": bookData.genre || ["Mystery", "Thriller"],
            "inLanguage": "en-US",
            "numberOfPages": bookData.pages,
            "datePublished": bookData.publishDate,
            "publisher": {
                "@type": "Organization",
                "name": bookData.publisher || "Publisher Name"
            },
            "author": {
                "@type": "Person",
                "@id": `${this.baseURL}#person`
            },
            "image": {
                "@type": "ImageObject",
                "url": bookData.coverImage,
                "width": 400,
                "height": 600
            },
            "offers": {
                "@type": "Offer",
                "price": bookData.price,
                "priceCurrency": "USD",
                "availability": bookData.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "seller": {
                    "@type": "Organization",
                    "@id": `${this.baseURL}#organization`
                },
                "validFrom": new Date().toISOString(),
                "url": window.location.href
            },
            "aggregateRating": bookData.rating ? {
                "@type": "AggregateRating",
                "ratingValue": bookData.rating,
                "reviewCount": bookData.reviewCount || 1,
                "bestRating": 5,
                "worstRating": 1
            } : null,
            "review": bookData.reviews || [],
            "mainEntity": {
                "@type": "WebPage",
                "url": window.location.href
            }
        };

        // Remove null values
        Object.keys(bookSchema).forEach(key => {
            if (bookSchema[key] === null || bookSchema[key] === undefined) {
                delete bookSchema[key];
            }
        });

        this.insertStructuredData(bookSchema, 'book');
    }

    addBlogPostData() {
        const postData = this.extractBlogPostData();
        
        if (!postData.title) return;

        const articleSchema = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "@id": `${window.location.href}#article`,
            "headline": postData.title,
            "description": postData.excerpt,
            "articleBody": postData.content,
            "datePublished": postData.publishDate,
            "dateModified": postData.modifiedDate || postData.publishDate,
            "author": {
                "@type": "Person",
                "@id": `${this.baseURL}#person`
            },
            "publisher": {
                "@type": "Organization",
                "@id": `${this.baseURL}#organization`
            },
            "image": {
                "@type": "ImageObject",
                "url": postData.featuredImage,
                "width": 1200,
                "height": 630
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": window.location.href
            },
            "articleSection": postData.category,
            "keywords": postData.tags,
            "wordCount": postData.wordCount,
            "commentCount": postData.commentCount || 0,
            "timeRequired": `PT${Math.ceil((postData.wordCount || 500) / 200)}M`, // Reading time
            "inLanguage": "en-US",
            "isPartOf": {
                "@type": "Blog",
                "@id": `${this.baseURL}/blog#blog`
            }
        };

        this.insertStructuredData(articleSchema, 'article');
    }

    addBookCollectionData() {
        const booksData = this.extractBooksCollectionData();

        const collectionSchema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${window.location.href}#collection`,
            "name": "Books by Author Name",
            "description": "Complete collection of mystery and thriller novels",
            "url": window.location.href,
            "mainEntity": {
                "@type": "ItemList",
                "itemListElement": booksData.map((book, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                        "@type": "Book",
                        "name": book.title,
                        "url": book.url,
                        "image": book.coverImage,
                        "author": {
                            "@type": "Person",
                            "@id": `${this.baseURL}#person`
                        }
                    }
                }))
            },
            "isPartOf": {
                "@type": "WebSite",
                "@id": `${this.baseURL}#website`
            }
        };

        this.insertStructuredData(collectionSchema, 'collection');
    }

    addBlogData() {
        const blogSchema = {
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": `${window.location.href}#blog`,
            "name": `${this.organizationData.name} Blog`,
            "description": "Insights on writing, publishing, and the creative process",
            "url": window.location.href,
            "author": {
                "@type": "Person",
                "@id": `${this.baseURL}#person`
            },
            "publisher": {
                "@type": "Organization",
                "@id": `${this.baseURL}#organization`
            },
            "inLanguage": "en-US",
            "isPartOf": {
                "@type": "WebSite",
                "@id": `${this.baseURL}#website`
            }
        };

        this.insertStructuredData(blogSchema, 'blog');
    }

    addContactPageData() {
        const contactSchema = {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "@id": `${window.location.href}#contactpage`,
            "name": "Contact Author Name",
            "description": "Get in touch with Author Name for speaking engagements, interviews, and collaborations",
            "url": window.location.href,
            "mainEntity": {
                "@type": "Organization",
                "@id": `${this.baseURL}#organization`
            },
            "isPartOf": {
                "@type": "WebSite",
                "@id": `${this.baseURL}#website`
            }
        };

        this.insertStructuredData(contactSchema, 'contactpage');
    }

    addAboutPageData() {
        const aboutSchema = {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "@id": `${window.location.href}#aboutpage`,
            "name": "About Author Name",
            "description": "Learn about the life and work of mystery novelist Author Name",
            "url": window.location.href,
            "mainEntity": {
                "@type": "Person",
                "@id": `${this.baseURL}#person`
            },
            "isPartOf": {
                "@type": "WebSite",
                "@id": `${this.baseURL}#website`
            }
        };

        this.insertStructuredData(aboutSchema, 'aboutpage');
    }

    addEventsData() {
        const eventsData = this.extractEventsData();

        if (eventsData.length > 0) {
            const eventsSchema = {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "@id": `${window.location.href}#events`,
                "name": "Author Events",
                "description": "Upcoming book signings, readings, and author appearances",
                "itemListElement": eventsData.map((event, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                        "@type": "Event",
                        "name": event.name,
                        "description": event.description,
                        "startDate": event.startDate,
                        "endDate": event.endDate,
                        "location": {
                            "@type": "Place",
                            "name": event.locationName,
                            "address": event.address
                        },
                        "performer": {
                            "@type": "Person",
                            "@id": `${this.baseURL}#person`
                        },
                        "organizer": {
                            "@type": "Organization",
                            "name": event.organizer
                        },
                        "offers": event.ticketUrl ? {
                            "@type": "Offer",
                            "url": event.ticketUrl,
                            "availability": "https://schema.org/InStock"
                        } : null
                    }
                }))
            };

            this.insertStructuredData(eventsSchema, 'events');
        }
    }

    addBreadcrumbData() {
        const breadcrumbs = this.generateBreadcrumbs();
        
        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs.map((crumb, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": crumb.name,
                "item": crumb.url
            }))
        };

        this.insertStructuredData(breadcrumbSchema, 'breadcrumb');
    }

    addProductData(productData) {
        // For e-commerce products (books)
        const productSchema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "@id": `${window.location.href}#product`,
            "name": productData.name,
            "description": productData.description,
            "image": productData.image,
            "brand": {
                "@type": "Brand",
                "name": this.organizationData.name
            },
            "manufacturer": {
                "@type": "Organization",
                "@id": `${this.baseURL}#organization`
            },
            "offers": {
                "@type": "Offer",
                "price": productData.price,
                "priceCurrency": "USD",
                "availability": productData.availability,
                "seller": {
                    "@type": "Organization",
                    "@id": `${this.baseURL}#organization`
                }
            },
            "aggregateRating": productData.rating ? {
                "@type": "AggregateRating",
                "ratingValue": productData.rating,
                "reviewCount": productData.reviewCount
            } : null
        };

        this.insertStructuredData(productSchema, 'product');
    }

    // Data extraction methods
    extractBookData() {
        return {
            title: this.getMetaContent('book-title') || document.querySelector('h1')?.textContent,
            subtitle: this.getMetaContent('book-subtitle'),
            description: this.getMetaContent('book-description') || this.getMetaContent('description'),
            isbn: this.getMetaContent('book-isbn'),
            edition: this.getMetaContent('book-edition'),
            format: this.getMetaContent('book-format'),
            genre: this.getMetaContent('book-genre')?.split(',') || ['Mystery', 'Thriller'],
            pages: this.getMetaContent('book-pages'),
            publishDate: this.getMetaContent('book-publish-date'),
            publisher: this.getMetaContent('book-publisher'),
            price: this.getMetaContent('book-price')?.replace(/[^0-9.]/g, ''),
            coverImage: this.getMetaContent('book-image') || document.querySelector('.book-cover img')?.src,
            inStock: this.getMetaContent('book-in-stock') !== 'false',
            rating: parseFloat(this.getMetaContent('book-rating')),
            reviewCount: parseInt(this.getMetaContent('book-review-count')),
            reviews: this.extractReviews()
        };
    }

    extractBlogPostData() {
        return {
            title: this.getMetaContent('post-title') || document.querySelector('h1')?.textContent,
            excerpt: this.getMetaContent('post-excerpt') || this.getMetaContent('description'),
            content: document.querySelector('.post-content')?.textContent,
            publishDate: this.getMetaContent('post-publish-date'),
            modifiedDate: this.getMetaContent('post-modified-date'),
            featuredImage: this.getMetaContent('post-image') || document.querySelector('.post-featured-image img')?.src,
            category: this.getMetaContent('post-category'),
            tags: this.getMetaContent('post-tags')?.split(',').map(tag => tag.trim()),
            wordCount: document.querySelector('.post-content')?.textContent.split(/\s+/).length || 500,
            commentCount: parseInt(this.getMetaContent('post-comment-count')) || 0
        };
    }

    extractBooksCollectionData() {
        const bookElements = document.querySelectorAll('.book-item, .product-card');
        return Array.from(bookElements).map(element => ({
            title: element.querySelector('.book-title, .product-title')?.textContent,
            url: element.querySelector('a')?.href,
            coverImage: element.querySelector('img')?.src
        }));
    }

    extractEventsData() {
        const eventElements = document.querySelectorAll('.event-item');
        return Array.from(eventElements).map(element => ({
            name: element.querySelector('.event-title')?.textContent,
            description: element.querySelector('.event-description')?.textContent,
            startDate: element.dataset.startDate,
            endDate: element.dataset.endDate,
            locationName: element.querySelector('.event-location')?.textContent,
            address: element.dataset.address,
            organizer: element.dataset.organizer,
            ticketUrl: element.querySelector('.ticket-link')?.href
        }));
    }

    extractReviews() {
        const reviewElements = document.querySelectorAll('.review-item');
        return Array.from(reviewElements).slice(0, 5).map(element => ({
            "@type": "Review",
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": element.dataset.rating,
                "bestRating": 5
            },
            "author": {
                "@type": "Person",
                "name": element.querySelector('.reviewer-name')?.textContent
            },
            "reviewBody": element.querySelector('.review-text')?.textContent,
            "datePublished": element.dataset.reviewDate
        }));
    }

    generateBreadcrumbs() {
        const pathSegments = window.location.pathname.split('/').filter(segment => segment);
        const breadcrumbs = [{ name: 'Home', url: this.baseURL }];
        
        let currentPath = '';
        pathSegments.forEach(segment => {
            currentPath += '/' + segment;
            breadcrumbs.push({
                name: this.formatBreadcrumbName(segment),
                url: this.baseURL + currentPath
            });
        });

        return breadcrumbs;
    }

    formatBreadcrumbName(segment) {
        // Convert URL segment to readable name
        const nameMap = {
            'books': 'Books',
            'blog': 'Blog',
            'about': 'About',
            'contact': 'Contact',
            'events': 'Events',
            'media': 'Media'
        };

        return nameMap[segment] || segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    detectPageType() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('/books/') && path.split('/').length > 2) return 'book';
        if (path.includes('/books')) return 'books';
        if (path.includes('/blog/') && path.split('/').length > 2) return 'blog-post';
        if (path.includes('/blog')) return 'blog';
        if (path.includes('/about')) return 'about';
        if (path.includes('/contact')) return 'contact';
        if (path.includes('/events')) return 'events';
        
        return 'page';
    }

    getMetaContent(name) {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"], [data-meta-${name}]`);
        return meta?.getAttribute('content') || meta?.dataset[`meta${name.charAt(0).toUpperCase() + name.slice(1)}`];
    }

    insertStructuredData(data, id) {
        // Remove existing structured data with the same ID
        const existingScript = document.querySelector(`script[data-structured-data="${id}"]`);
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.dataset.structuredData = id;
        script.textContent = JSON.stringify(data, null, 2);
        document.head.appendChild(script);
    }

    setupDynamicUpdates() {
        // Listen for content changes that might require structured data updates
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    // Check if important content has changed
                    const target = mutation.target;
                    if (target.matches && (
                        target.matches('h1, .book-title, .post-title') ||
                        target.classList.contains('book-info') ||
                        target.classList.contains('post-meta')
                    )) {
                        shouldUpdate = true;
                    }
                }
            });

            if (shouldUpdate) {
                setTimeout(() => this.addPageSpecificStructuredData(), 1000);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-meta-title', 'data-meta-description', 'data-meta-image']
        });
    }

    // Public API methods
    updateBookData(bookData) {
        this.addProductData(bookData);
    }

    updateArticleData(articleData) {
        // Implementation for dynamic article updates
    }

    addCustomStructuredData(data, id) {
        this.insertStructuredData(data, id);
    }

    removeStructuredData(id) {
        const script = document.querySelector(`script[data-structured-data="${id}"]`);
        if (script) {
            script.remove();
        }
    }
}

// Initialize structured data manager
document.addEventListener('DOMContentLoaded', () => {
    window.structuredDataManager = new StructuredDataManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StructuredDataManager;
}
