/* ===================================
   BLOG NAVIGATION FUNCTIONALITY
   File: assets/js/blog-navigation.js
   =================================== */

class BlogNavigation {
    constructor() {
        this.currentPage = 1;
        this.postsPerPage = 12;
        this.totalPosts = 0;
        this.currentFilters = {
            search: '',
            category: '',
            tag: '',
            sort: 'newest'
        };
        this.currentView = 'grid';
        this.isLoading = false;
        this.debounceTimer = null;
        this.init();
    }

    init() {
        this.loadUrlParams();
        this.bindEvents();
        this.setupInfiniteScroll();
        this.setupKeyboardNavigation();
        this.updateViewState();
    }

    loadUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        this.currentFilters.search = urlParams.get('search') || '';
        this.currentFilters.category = urlParams.get('category') || '';
        this.currentFilters.tag = urlParams.get('tag') || '';
        this.currentFilters.sort = urlParams.get('sort') || 'newest';
        this.currentView = urlParams.get('view') || 'grid';
        this.currentPage = parseInt(urlParams.get('page')) || 1;

        // Update form fields
        this.updateFormFields();
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('blogSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
            });
        }

        // Filter dropdowns
        this.bindFilterDropdowns();

        // View toggle
        this.bindViewToggle();

        // Load more button
        const loadMoreBtn = document.getElementById('loadMorePosts');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMorePosts());
        }

        // Pagination links
        this.bindPaginationLinks();

        // Share buttons
        this.bindShareButtons();

        // Back to top
        this.setupBackToTop();
    }

    bindFilterDropdowns() {
        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown(categoryFilter);
            });

            const categoryOptions = document.querySelectorAll('.filter-menu .filter-option');
            categoryOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    const category = option.textContent.trim().split(' (')[0];
                    this.setFilter('category', category === 'All Categories' ? '' : category);
                });
            });
        }

        // Sort filter
        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown(sortFilter);
            });

            const sortOptions = document.querySelectorAll('.sort-menu .sort-option');
            sortOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sortValue = new URL(option.href).searchParams.get('sort') || 'newest';
                    this.setFilter('sort', sortValue);
                });
            });
        }

        // Close dropdowns on outside click
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });
    }

    bindViewToggle() {
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.setView(view);
            });
        });
    }

    bindPaginationLinks() {
        const paginationLinks = document.querySelectorAll('.pagination a');
        paginationLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = new URL(link.href);
                const page = url.searchParams.get('page') || 1;
                this.goToPage(parseInt(page));
            });
        });
    }

    bindShareButtons() {
        const shareButtons = document.querySelectorAll('.share-btn');
        shareButtons.forEach(btn => {
            if (btn.classList.contains('copy-link')) {
                btn.addEventListener('click', () => this.copyToClipboard(btn.dataset.url));
            }
        });
    }

    setupInfiniteScroll() {
        // Only enable if infinite scroll is preferred
        if (this.isInfiniteScrollEnabled()) {
            window.addEventListener('scroll', () => this.handleScroll());
        }
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('blogSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Arrow keys for pagination
            if (e.key === 'ArrowLeft' && e.altKey) {
                e.preventDefault();
                this.goToPreviousPage();
            }

            if (e.key === 'ArrowRight' && e.altKey) {
                e.preventDefault();
                this.goToNextPage();
            }
        });
    }

    setupBackToTop() {
        const backToTopBtn = document.createElement('button');
        backToTopBtn.className = 'back-to-top';
        backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        backToTopBtn.setAttribute('aria-label', 'Back to top');
        document.body.appendChild(backToTopBtn);

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
    }

    handleSearch(e) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.setFilter('search', e.target.value);
        }, 300);
    }

    performSearch() {
        clearTimeout(this.debounceTimer);
        const searchInput = document.getElementById('blogSearch');
        if (searchInput) {
            this.setFilter('search', searchInput.value);
        }
    }

    setFilter(key, value) {
        this.currentFilters[key] = value;
        this.currentPage = 1;
        this.updateURL();
        this.loadPosts();
    }

    setView(view) {
        this.currentView = view;
        this.updateURL();
        this.updateViewState();
        
        // Track view change
        this.trackEvent('blog_view_changed', { view });
    }

    updateViewState() {
        const postsContainer = document.getElementById('postsContainer');
        const viewButtons = document.querySelectorAll('.view-btn');

        if (postsContainer) {
            postsContainer.className = `posts-container ${this.currentView}-view`;
        }

        viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.currentView);
        });
    }

    goToPage(page) {
        if (page < 1 || this.isLoading) return;
        
        this.currentPage = page;
        this.updateURL();
        this.loadPosts();
        
        // Scroll to top of posts
        const postsSection = document.querySelector('.blog-posts');
        if (postsSection) {
            postsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    }

    goToNextPage() {
        const hasNextPage = document.querySelector('.pagination .next');
        if (hasNextPage) {
            this.goToPage(this.currentPage + 1);
        }
    }

    async loadMorePosts() {
        if (this.isLoading) return;

        const loadMoreBtn = document.getElementById('loadMorePosts');
        this.setLoadingState(loadMoreBtn, true);

        try {
            const nextPage = this.currentPage + 1;
            const posts = await this.fetchPosts(nextPage, true);
            
            if (posts && posts.length > 0) {
                this.appendPosts(posts);
                this.currentPage = nextPage;
                this.updateURL();
            } else {
                this.hideLoadMoreButton();
            }

        } catch (error) {
            console.error('Error loading more posts:', error);
            this.showError('Failed to load more posts');
        } finally {
            this.setLoadingState(loadMoreBtn, false);
        }
    }

    async loadPosts(append = false) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoadingState();

        try {
            const posts = await this.fetchPosts(this.currentPage, append);
            
            if (append) {
                this.appendPosts(posts);
            } else {
                this.replacePosts(posts);
            }

            this.updatePagination();
            this.updatePostsCount();

        } catch (error) {
            console.error('Error loading posts:', error);
            this.showError('Failed to load posts');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    async fetchPosts(page, append = false) {
        const params = new URLSearchParams({
            page: page,
            per_page: this.postsPerPage,
            ...this.currentFilters
        });

        const response = await fetch(`/api/blog-posts?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.totalPosts = data.total;
        
        return data.posts;
    }

    replacePosts(posts) {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) return;

        if (posts.length === 0) {
            postsContainer.innerHTML = this.getNoPostsHTML();
            return;
        }

        postsContainer.innerHTML = posts.map(post => this.renderPostCard(post)).join('');
        this.bindPostCardEvents();
    }

    appendPosts(posts) {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer || posts.length === 0) return;

        const postsHTML = posts.map(post => this.renderPostCard(post)).join('');
        postsContainer.insertAdjacentHTML('beforeend', postsHTML);
        this.bindPostCardEvents();
    }

    renderPostCard(post) {
        return `
            <article class="post-card" data-category="${post.category}" data-date="${post.date}">
                <div class="post-image">
                    <a href="${post.url}">
                        <img src="${post.featured_image}" alt="${post.title}" loading="lazy">
                    </a>
                    ${post.is_new ? '<div class="post-badge new">New</div>' : ''}
                    ${post.is_popular ? '<div class="post-badge popular">Popular</div>' : ''}
                </div>
                
                <div class="post-content">
                    <div class="post-meta">
                        <a href="${post.category_url}" class="post-category">${post.category}</a>
                        <time datetime="${post.date}" class="post-date">${post.formatted_date}</time>
                        <span class="reading-time">${post.reading_time} min read</span>
                    </div>
                    
                    <h3 class="post-title">
                        <a href="${post.url}">${post.title}</a>
                    </h3>
                    
                    <p class="post-excerpt">${post.excerpt}</p>
                    
                    <div class="post-footer">
                        <div class="post-tags">
                            ${post.tags.map(tag => `<a href="${tag.url}" class="tag">${tag.name}</a>`).join('')}
                        </div>
                        
                        <div class="post-stats">
                            <span class="post-views">
                                <i class="fas fa-eye"></i>
                                ${post.view_count}
                            </span>
                            <span class="post-comments">
                                <i class="fas fa-comments"></i>
                                ${post.comment_count}
                            </span>
                        </div>
                    </div>
                    
                    <a href="${post.url}" class="read-more">
                        Read More <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;
    }

    getNoPostsHTML() {
        return `
            <div class="no-posts">
                <i class="fas fa-search"></i>
                <h3>No posts found</h3>
                <p>Try adjusting your search or filter criteria.</p>
                <a href="blog.html" class="btn btn-primary">View All Posts</a>
            </div>
        `;
    }

    bindPostCardEvents() {
        // Track post clicks
        const postLinks = document.querySelectorAll('.post-card a');
        postLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.trackEvent('blog_post_click', {
                    url: link.href,
                    title: link.textContent.trim()
                });
            });
        });
    }

    updateURL() {
        const params = new URLSearchParams();
        
        if (this.currentPage > 1) params.set('page', this.currentPage);
        if (this.currentFilters.search) params.set('search', this.currentFilters.search);
        if (this.currentFilters.category) params.set('category', this.currentFilters.category);
        if (this.currentFilters.tag) params.set('tag', this.currentFilters.tag);
        if (this.currentFilters.sort !== 'newest') params.set('sort', this.currentFilters.sort);
        if (this.currentView !== 'grid') params.set('view', this.currentView);

        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        history.replaceState(null, '', newURL);
    }

    updateFormFields() {
        const searchInput = document.getElementById('blogSearch');
        if (searchInput) {
            searchInput.value = this.currentFilters.search;
        }

        // Update dropdown button text
        const categoryBtn = document.getElementById('categoryFilter');
        if (categoryBtn) {
            const categoryText = this.currentFilters.category || 'All Categories';
            categoryBtn.querySelector('span').textContent = categoryText;
        }

        const sortBtn = document.getElementById('sortFilter');
        if (sortBtn) {
            const sortLabels = {
                'newest': 'Newest First',
                'oldest': 'Oldest First',
                'popular': 'Most Popular',
                'title': 'Title A-Z'
            };
            sortBtn.querySelector('span').textContent = sortLabels[this.currentFilters.sort];
        }
    }

    toggleDropdown(button) {
        const dropdown = button.nextElementSibling;
        const isOpen = dropdown.classList.contains('show');
        
        this.closeAllDropdowns();
        
        if (!isOpen) {
            dropdown.classList.add('show');
            button.classList.add('active');
        }
    }

    closeAllDropdowns() {
        const dropdowns = document.querySelectorAll('.filter-menu, .sort-menu');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        const buttons = document.querySelectorAll('.filter-btn, .sort-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
        });
    }

    handleScroll() {
        if (!this.isInfiniteScrollEnabled() || this.isLoading) return;

        const scrollThreshold = 200;
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.offsetHeight;

        if (scrollPosition >= documentHeight - scrollThreshold) {
            this.loadMorePosts();
        }
    }

    isInfiniteScrollEnabled() {
        return localStorage.getItem('infiniteScroll') !== 'disabled';
    }

    setLoadingState(button, loading) {
        if (!button) return;

        const spinner = button.querySelector('.fa-spinner');
        const text = button.querySelector('.btn-text');

        if (loading) {
            button.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';
            if (text) text.textContent = 'Loading...';
        } else {
            button.disabled = false;
            if (spinner) spinner.style.display = 'none';
            if (text) text.textContent = 'Load More Posts';
        }
    }

    showLoadingState() {
        const postsContainer = document.getElementById('postsContainer');
        if (postsContainer && !postsContainer.innerHTML.trim()) {
            postsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
        }
    }

    hideLoadingState() {
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    hideLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMorePosts');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
    }

    updatePagination() {
        // This would be handled by server-side rendering in most cases
        // But we can update the pagination numbers here if needed
    }

    updatePostsCount() {
        const countElement = document.querySelector('.posts-count');
        if (countElement) {
            const showing = this.currentPage * this.postsPerPage;
            const actualShowing = Math.min(showing, this.totalPosts);
            countElement.textContent = `Showing ${actualShowing} of ${this.totalPosts} posts`;
        }
    }

    copyToClipboard(url) {
        navigator.clipboard.writeText(url).then(() => {
            // Show success message
            this.showToast('Link copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Link copied to clipboard!');
        });
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button class="close-error">&times;</button>
        `;

        const container = document.querySelector('.blog-posts .container');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);

        // Close button
        errorDiv.querySelector('.close-error').addEventListener('click', () => {
            errorDiv.remove();
        });
    }

    trackEvent(eventName, data = {}) {
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'blog',
                ...data
            });
        }

        // Custom analytics
        if (window.analytics) {
            window.analytics.track(eventName, data);
        }
    }

    // Public API methods
    search(query) {
        this.setFilter('search', query);
    }

    filterByCategory(category) {
        this.setFilter('category', category);
    }

    filterByTag(tag) {
        this.setFilter('tag', tag);
    }

    clearFilters() {
        this.currentFilters = {
            search: '',
            category: '',
            tag: '',
            sort: 'newest'
        };
        this.currentPage = 1;
        this.updateURL();
        this.updateFormFields();
        this.loadPosts();
    }
}

// Initialize blog navigation
document.addEventListener('DOMContentLoaded', () => {
    window.blogNavigation = new BlogNavigation();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogNavigation;
}
