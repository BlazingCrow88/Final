/* ===================================
   PRODUCT DISPLAY SYSTEM
   File: assets/js/product-display.js
   =================================== */

class ProductDisplay {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || '/api/products';
        this.enableFilters = options.enableFilters !== false;
        this.enableSearch = options.enableSearch !== false;
        this.enableSorting = options.enableSorting !== false;
        this.enablePagination = options.enablePagination !== false;
        this.enableQuickView = options.enableQuickView !== false;
        this.enableWishlist = options.enableWishlist !== false;
        this.enableCompare = options.enableCompare !== false;
        this.productsPerPage = options.productsPerPage || 12;
        this.viewMode = options.defaultView || 'grid'; // 'grid' or 'list'
        
        this.products = [];
        this.filteredProducts = [];
        this.categories = [];
        this.tags = [];
        this.priceRange = { min: 0, max: 1000 };
        this.currentFilters = {
            search: '',
            category: '',
            tags: [],
            priceMin: 0,
            priceMax: 1000,
            inStock: false,
            featured: false
        };
        this.sortBy = 'newest';
        this.currentPage = 1;
        this.compareList = new Set();
        this.wishlist = new Set();
        
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupInterface();
        this.bindEvents();
        this.loadUserPreferences();
        this.renderProducts();
    }

    setupInterface() {
        const container = document.getElementById('productDisplay');
        if (!container) return;

        container.innerHTML = `
            <div class="product-display-container">
                ${this.enableFilters ? this.renderFiltersHTML() : ''}
                
                <div class="products-main">
                    <div class="products-header">
                        <div class="products-info">
                            <h2 id="productsTitle">Our Books</h2>
                            <span class="products-count" id="productsCount">0 books</span>
                        </div>
                        
                        <div class="products-controls">
                            ${this.enableSearch ? `
                                <div class="search-box">
                                    <i class="fas fa-search"></i>
                                    <input type="text" id="productSearch" placeholder="Search books...">
                                    <button class="clear-search" id="clearSearch" style="display: none;">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            ` : ''}
                            
                            ${this.enableSorting ? `
                                <select id="sortSelect" class="sort-select">
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="title">Title A-Z</option>
                                    <option value="popularity">Most Popular</option>
                                    <option value="rating">Highest Rated</option>
                                </select>
                            ` : ''}
                            
                            <div class="view-toggle">
                                <button class="view-btn ${this.viewMode === 'grid' ? 'active' : ''}" 
                                        data-view="grid" title="Grid View">
                                    <i class="fas fa-th"></i>
                                </button>
                                <button class="view-btn ${this.viewMode === 'list' ? 'active' : ''}" 
                                        data-view="list" title="List View">
                                    <i class="fas fa-list"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="active-filters" id="activeFilters" style="display: none;">
                        <!-- Active filters will be displayed here -->
                    </div>

                    <div class="products-grid ${this.viewMode}-view" id="productsGrid">
                        <!-- Products will be rendered here -->
                    </div>

                    ${this.enablePagination ? `
                        <div class="pagination-container" id="productsPagination">
                            <!-- Pagination will be rendered here -->
                        </div>
                    ` : ''}
                </div>
            </div>

            ${this.enableQuickView ? this.renderQuickViewModal() : ''}
            ${this.enableCompare ? this.renderCompareModal() : ''}
        `;
    }

    renderFiltersHTML() {
        return `
            <div class="products-sidebar">
                <div class="filters-container">
                    <div class="filters-header">
                        <h3>Filters</h3>
                        <button class="clear-all-filters" id="clearAllFilters">Clear All</button>
                    </div>

                    <div class="filter-group">
                        <h4>Categories</h4>
                        <div class="category-filters" id="categoryFilters">
                            <!-- Categories will be populated -->
                        </div>
                    </div>

                    <div class="filter-group">
                        <h4>Price Range</h4>
                        <div class="price-filter">
                            <div class="price-range-slider">
                                <input type="range" id="priceMin" min="0" max="1000" value="0" class="range-input">
                                <input type="range" id="priceMax" min="0" max="1000" value="1000" class="range-input">
                            </div>
                            <div class="price-inputs">
                                <input type="number" id="priceMinInput" placeholder="Min" min="0">
                                <span>to</span>
                                <input type="number" id="priceMaxInput" placeholder="Max" min="0">
                            </div>
                        </div>
                    </div>

                    <div class="filter-group">
                        <h4>Availability</h4>
                        <label class="filter-checkbox">
                            <input type="checkbox" id="inStockFilter">
                            <span class="checkmark"></span>
                            In Stock Only
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" id="featuredFilter">
                            <span class="checkmark"></span>
                            Featured Books
                        </label>
                    </div>

                    <div class="filter-group">
                        <h4>Tags</h4>
                        <div class="tag-filters" id="tagFilters">
                            <!-- Tags will be populated -->
                        </div>
                    </div>

                    <div class="filter-group">
                        <h4>Rating</h4>
                        <div class="rating-filters">
                            <label class="filter-checkbox">
                                <input type="checkbox" value="5" class="rating-filter">
                                <span class="checkmark"></span>
                                <div class="stars">★★★★★</div>
                            </label>
                            <label class="filter-checkbox">
                                <input type="checkbox" value="4" class="rating-filter">
                                <span class="checkmark"></span>
                                <div class="stars">★★★★☆ & up</div>
                            </label>
                            <label class="filter-checkbox">
                                <input type="checkbox" value="3" class="rating-filter">
                                <span class="checkmark"></span>
                                <div class="stars">★★★☆☆ & up</div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderQuickViewModal() {
        return `
            <div class="modal" id="quickViewModal">
                <div class="modal-content quick-view-content">
                    <button class="modal-close">&times;</button>
                    <div class="quick-view-body" id="quickViewBody">
                        <!-- Product details will be loaded here -->
                    </div>
                </div>
            </div>
        `;
    }

    renderCompareModal() {
        return `
            <div class="modal" id="compareModal">
                <div class="modal-content compare-content">
                    <div class="modal-header">
                        <h3>Compare Products</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="compare-table-container" id="compareTableContainer">
                            <!-- Comparison table will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Search
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.debounce(() => this.handleSearch(e.target.value), 300)();
            });
        }

        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => this.clearSearch());
        }

        // Sorting
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.handleSort(e.target.value));
        }

        // View toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-btn')) {
                const view = e.target.closest('.view-btn').dataset.view;
                this.changeView(view);
            }
        });

        // Filters
        this.bindFilterEvents();

        // Product actions
        document.addEventListener('click', (e) => this.handleProductAction(e));

        // Modal events
        this.bindModalEvents();

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.closest('.pagination-btn')) {
                e.preventDefault();
                const page = parseInt(e.target.closest('.pagination-btn').dataset.page);
                if (page) this.goToPage(page);
            }
        });
    }

    bindFilterEvents() {
        // Category filters
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('category-filter')) {
                this.updateCategoryFilter();
            }
        });

        // Price range
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        const priceMinInput = document.getElementById('priceMinInput');
        const priceMaxInput = document.getElementById('priceMaxInput');

        if (priceMin && priceMax) {
            priceMin.addEventListener('input', () => this.updatePriceFilter());
            priceMax.addEventListener('input', () => this.updatePriceFilter());
        }

        if (priceMinInput && priceMaxInput) {
            priceMinInput.addEventListener('change', () => this.updatePriceFilterFromInputs());
            priceMaxInput.addEventListener('change', () => this.updatePriceFilterFromInputs());
        }

        // Other filters
        document.addEventListener('change', (e) => {
            if (e.target.id === 'inStockFilter' || e.target.id === 'featuredFilter') {
                this.updateFilters();
            }
        });

        // Tag filters
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('tag-filter')) {
                this.updateTagFilters();
            }
        });

        // Clear all filters
        const clearAllBtn = document.getElementById('clearAllFilters');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllFilters());
        }
    }

    bindModalEvents() {
        // Close modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || 
                (e.target.classList.contains('modal') && e.target === e.currentTarget)) {
                this.closeModals();
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    async loadProducts() {
        try {
            const response = await fetch(this.apiEndpoint);
            if (!response.ok) {
                throw new Error('Failed to load products');
            }

            const data = await response.json();
            this.products = data.products || [];
            this.categories = data.categories || [];
            this.tags = data.tags || [];
            this.priceRange = data.priceRange || { min: 0, max: 1000 };
            
            this.filteredProducts = [...this.products];
            this.populateFilters();

        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products');
        }
    }

    populateFilters() {
        this.populateCategoryFilters();
        this.populateTagFilters();
        this.updatePriceRange();
    }

    populateCategoryFilters() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;

        container.innerHTML = this.categories.map(category => `
            <label class="filter-checkbox">
                <input type="checkbox" class="category-filter" value="${category.slug}">
                <span class="checkmark"></span>
                ${category.name} (${category.count})
            </label>
        `).join('');
    }

    populateTagFilters() {
        const container = document.getElementById('tagFilters');
        if (!container) return;

        container.innerHTML = this.tags.slice(0, 10).map(tag => `
            <label class="filter-checkbox">
                <input type="checkbox" class="tag-filter" value="${tag.slug}">
                <span class="checkmark"></span>
                ${tag.name} (${tag.count})
            </label>
        `).join('');
    }

    updatePriceRange() {
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        const priceMinInput = document.getElementById('priceMinInput');
        const priceMaxInput = document.getElementById('priceMaxInput');

        if (priceMin && priceMax) {
            priceMin.min = this.priceRange.min;
            priceMin.max = this.priceRange.max;
            priceMin.value = this.currentFilters.priceMin;
            
            priceMax.min = this.priceRange.min;
            priceMax.max = this.priceRange.max;
            priceMax.value = this.currentFilters.priceMax;
        }

        if (priceMinInput && priceMaxInput) {
            priceMinInput.placeholder = `$${this.priceRange.min}`;
            priceMaxInput.placeholder = `$${this.priceRange.max}`;
        }
    }

    handleSearch(query) {
        this.currentFilters.search = query.toLowerCase();
        this.currentPage = 1;
        this.updateFilters();
        
        const clearBtn = document.getElementById('clearSearch');
        if (clearBtn) {
            clearBtn.style.display = query ? 'block' : 'none';
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.value = '';
            this.handleSearch('');
        }
    }

    handleSort(sortBy) {
        this.sortBy = sortBy;
        this.applySort();
        this.renderProducts();
    }

    applySort() {
        this.filteredProducts.sort((a, b) => {
            switch (this.sortBy) {
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'popularity':
                    return (b.views || 0) - (a.views || 0);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                default:
                    return 0;
            }
        });
    }

    updateCategoryFilter() {
        const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked'))
            .map(input => input.value);
        this.currentFilters.category = selectedCategories;
        this.currentPage = 1;
        this.updateFilters();
    }

    updatePriceFilter() {
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        
        if (priceMin && priceMax) {
            this.currentFilters.priceMin = parseInt(priceMin.value);
            this.currentFilters.priceMax = parseInt(priceMax.value);
            
            // Update input fields
            const priceMinInput = document.getElementById('priceMinInput');
            const priceMaxInput = document.getElementById('priceMaxInput');
            if (priceMinInput) priceMinInput.value = this.currentFilters.priceMin;
            if (priceMaxInput) priceMaxInput.value = this.currentFilters.priceMax;
            
            this.debounce(() => this.updateFilters(), 500)();
        }
    }

    updatePriceFilterFromInputs() {
        const priceMinInput = document.getElementById('priceMinInput');
        const priceMaxInput = document.getElementById('priceMaxInput');
        
        if (priceMinInput && priceMaxInput) {
            this.currentFilters.priceMin = parseInt(priceMinInput.value) || this.priceRange.min;
            this.currentFilters.priceMax = parseInt(priceMaxInput.value) || this.priceRange.max;
            
            // Update range sliders
            const priceMin = document.getElementById('priceMin');
            const priceMax = document.getElementById('priceMax');
            if (priceMin) priceMin.value = this.currentFilters.priceMin;
            if (priceMax) priceMax.value = this.currentFilters.priceMax;
            
            this.updateFilters();
        }
    }

    updateTagFilters() {
        const selectedTags = Array.from(document.querySelectorAll('.tag-filter:checked'))
            .map(input => input.value);
        this.currentFilters.tags = selectedTags;
        this.currentPage = 1;
        this.updateFilters();
    }

    updateFilters() {
        // Update filter values
        this.currentFilters.inStock = document.getElementById('inStockFilter')?.checked || false;
        this.currentFilters.featured = document.getElementById('featuredFilter')?.checked || false;

        // Apply filters
        this.filteredProducts = this.products.filter(product => {
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                if (!product.title.toLowerCase().includes(searchTerm) &&
                    !product.description.toLowerCase().includes(searchTerm) &&
                    !product.author.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }

            // Category filter
            if (this.currentFilters.category.length > 0) {
                if (!this.currentFilters.category.includes(product.category_slug)) {
                    return false;
                }
            }

            // Price filter
            if (product.price < this.currentFilters.priceMin || 
                product.price > this.currentFilters.priceMax) {
                return false;
            }

            // Stock filter
            if (this.currentFilters.inStock && product.stock <= 0) {
                return false;
            }

            // Featured filter
            if (this.currentFilters.featured && !product.featured) {
                return false;
            }

            // Tag filters
            if (this.currentFilters.tags.length > 0) {
                const productTags = product.tags || [];
                if (!this.currentFilters.tags.some(tag => productTags.includes(tag))) {
                    return false;
                }
            }

            return true;
        });

        this.applySort();
        this.currentPage = 1;
        this.renderProducts();
        this.updateActiveFilters();
    }

    updateActiveFilters() {
        const container = document.getElementById('activeFilters');
        if (!container) return;

        const activeFilters = [];

        if (this.currentFilters.search) {
            activeFilters.push({
                type: 'search',
                label: `Search: "${this.currentFilters.search}"`,
                action: () => this.clearSearch()
            });
        }

        if (this.currentFilters.category.length > 0) {
            this.currentFilters.category.forEach(categorySlug => {
                const category = this.categories.find(c => c.slug === categorySlug);
                if (category) {
                    activeFilters.push({
                        type: 'category',
                        label: category.name,
                        action: () => this.removeFilter('category', categorySlug)
                    });
                }
            });
        }

        if (this.currentFilters.priceMin > this.priceRange.min || 
            this.currentFilters.priceMax < this.priceRange.max) {
            activeFilters.push({
                type: 'price',
                label: `$${this.currentFilters.priceMin} - $${this.currentFilters.priceMax}`,
                action: () => this.removeFilter('price')
            });
        }

        if (this.currentFilters.inStock) {
            activeFilters.push({
                type: 'stock',
                label: 'In Stock',
                action: () => this.removeFilter('inStock')
            });
        }

        if (this.currentFilters.featured) {
            activeFilters.push({
                type: 'featured',
                label: 'Featured',
                action: () => this.removeFilter('featured')
            });
        }

        if (activeFilters.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div class="active-filters-header">Active Filters:</div>
            <div class="active-filters-list">
                ${activeFilters.map(filter => `
                    <span class="active-filter ${filter.type}">
                        ${filter.label}
                        <button class="remove-filter" data-filter-type="${filter.type}">×</button>
                    </span>
                `).join('')}
                <button class="clear-all-active" onclick="productDisplay.clearAllFilters()">
                    Clear All
                </button>
            </div>
        `;

        // Bind remove filter events
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-filter')) {
                const filterType = e.target.dataset.filterType;
                const filterElement = e.target.closest('.active-filter');
                const filterLabel = filterElement.textContent.trim().replace('×', '');
                
                this.removeActiveFilter(filterType, filterLabel);
            }
        });
    }

    removeActiveFilter(type, label) {
        switch (type) {
            case 'search':
                this.clearSearch();
                break;
            case 'category':
                this.removeFilter('category', label);
                break;
            case 'price':
                this.removeFilter('price');
                break;
            case 'stock':
                this.removeFilter('inStock');
                break;
            case 'featured':
                this.removeFilter('featured');
                break;
        }
    }

    removeFilter(type, value = null) {
        switch (type) {
            case 'category':
                const categoryCheckbox = document.querySelector(`.category-filter[value="${value}"]`);
                if (categoryCheckbox) {
                    categoryCheckbox.checked = false;
                    this.updateCategoryFilter();
                }
                break;
            case 'price':
                this.currentFilters.priceMin = this.priceRange.min;
                this.currentFilters.priceMax = this.priceRange.max;
                this.updatePriceRange();
                this.updateFilters();
                break;
            case 'inStock':
                const stockCheckbox = document.getElementById('inStockFilter');
                if (stockCheckbox) {
                    stockCheckbox.checked = false;
                    this.updateFilters();
                }
                break;
            case 'featured':
                const featuredCheckbox = document.getElementById('featuredFilter');
                if (featuredCheckbox) {
                    featuredCheckbox.checked = false;
                    this.updateFilters();
                }
                break;
        }
    }

    clearAllFilters() {
        // Reset all filter values
        this.currentFilters = {
            search: '',
            category: [],
            tags: [],
            priceMin: this.priceRange.min,
            priceMax: this.priceRange.max,
            inStock: false,
            featured: false
        };

        // Reset form elements
        const searchInput = document.getElementById('productSearch');
        if (searchInput) searchInput.value = '';

        document.querySelectorAll('.category-filter, .tag-filter, .rating-filter').forEach(checkbox => {
            checkbox.checked = false;
        });

        const inStockFilter = document.getElementById('inStockFilter');
        const featuredFilter = document.getElementById('featuredFilter');
        if (inStockFilter) inStockFilter.checked = false;
        if (featuredFilter) featuredFilter.checked = false;

        this.updatePriceRange();
        this.updateFilters();
    }

    changeView(view) {
        this.viewMode = view;
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Update products grid
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.className = `products-grid ${view}-view`;
        }

        // Save preference
        localStorage.setItem('productViewMode', view);
    }

    renderProducts() {
        const container = document.getElementById('productsGrid');
        const countElement = document.getElementById('productsCount');
        
        if (!container) return;

        // Update count
        if (countElement) {
            const count = this.filteredProducts.length;
            countElement.textContent = `${count} book${count !== 1 ? 's' : ''}`;
        }

        if (this.filteredProducts.length === 0) {
            container.innerHTML = this.renderNoProductsHTML();
            return;
        }

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const pageProducts = this.filteredProducts.slice(startIndex, endIndex);

        // Render products
        container.innerHTML = pageProducts.map(product => 
            this.renderProductCard(product)
        ).join('');

        // Render pagination
        if (this.enablePagination) {
            this.renderPagination();
        }

        // Lazy load images
        this.lazyLoadImages();
    }

    renderProductCard(product) {
        const isInWishlist = this.wishlist.has(product.id);
        const isInCompare = this.compareList.has(product.id);
        const stockStatus = product.stock > 0 ? 'in-stock' : 'out-of-stock';

        return `
            <div class="product-card ${stockStatus}" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.title}" class="product-image" loading="lazy">
                    
                    ${product.featured ? '<div class="product-badge featured">Featured</div>' : ''}
                    ${product.discount ? `<div class="product-badge discount">-${product.discount}%</div>` : ''}
                    ${product.stock <= 0 ? '<div class="product-badge out-of-stock">Out of Stock</div>' : ''}
                    
                    <div class="product-overlay">
                        <div class="product-actions">
                            ${this.enableQuickView ? `
                                <button class="action-btn quick-view" data-action="quick-view" title="Quick View">
                                    <i class="fas fa-eye"></i>
                                </button>
                            ` : ''}
                            
                            ${this.enableWishlist ? `
                                <button class="action-btn wishlist ${isInWishlist ? 'active' : ''}" 
                                        data-action="wishlist" title="Add to Wishlist">
                                    <i class="fas fa-heart"></i>
                                </button>
                            ` : ''}
                            
                            ${this.enableCompare ? `
                                <button class="action-btn compare ${isInCompare ? 'active' : ''}" 
                                        data-action="compare" title="Add to Compare">
                                    <i class="fas fa-balance-scale"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title">
                        <a href="${product.url}">${product.title}</a>
                    </h3>
                    <div class="product-author">by ${product.author}</div>
                    
                    ${product.rating ? `
                        <div class="product-rating">
                            <div class="stars" title="${product.rating} out of 5">
                                ${this.renderStars(product.rating)}
                            </div>
                            <span class="rating-count">(${product.review_count || 0})</span>
                        </div>
                    ` : ''}
                    
                    <div class="product-excerpt">${product.excerpt || ''}</div>
                    
                    <div class="product-price">
                        ${product.sale_price ? `
                            <span class="price-sale">$${product.sale_price.toFixed(2)}</span>
                            <span class="price-regular">$${product.price.toFixed(2)}</span>
                        ` : `
                            <span class="price">$${product.price.toFixed(2)}</span>
                        `}
                    </div>

                    <div class="product-footer">
                        <button class="btn btn-primary add-to-cart" 
                                data-action="add-to-cart" 
                                ${product.stock <= 0 ? 'disabled' : ''}>
                            ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        
                        <div class="product-meta">
                            <span class="stock-info">${product.stock} in stock</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    renderNoProductsHTML() {
        return `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>No books found</h3>
                <p>Try adjusting your search or filter criteria.</p>
                <button class="btn btn-primary" onclick="productDisplay.clearAllFilters()">
                    Clear All Filters
                </button>
            </div>
        `;
    }

    renderPagination() {
        const container = document.getElementById('productsPagination');
        if (!container) return;

        const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '<nav class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination-btn prev" data-page="${this.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
            `;
        }

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        data-page="${i}">
                    ${i}
                </button>
            `;
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-btn next" data-page="${this.currentPage + 1}">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }

        paginationHTML += '</nav>';
        container.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderProducts();
        
        // Scroll to top of products
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.scrollIntoView({ behavior: 'smooth' });
        }
    }

    handleProductAction(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;

        e.preventDefault();
        
        const action = actionBtn.dataset.action;
        const productCard = actionBtn.closest('.product-card');
        const productId = productCard?.dataset.productId;

        if (!productId) return;

        switch (action) {
            case 'add-to-cart':
                this.addToCart(productId);
                break;
            case 'quick-view':
                this.showQuickView(productId);
                break;
            case 'wishlist':
                this.toggleWishlist(productId);
                break;
            case 'compare':
                this.toggleCompare(productId);
                break;
        }
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        if (window.cart) {
            window.cart.addItem(product);
        } else {
            // Fallback if cart system not loaded
            console.log('Added to cart:', product);
            this.showSuccess(`"${product.title}" added to cart`);
        }
    }

    showQuickView(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modalBody = document.getElementById('quickViewBody');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="quick-view-content">
                <div class="quick-view-image">
                    <img src="${product.image}" alt="${product.title}">
                </div>
                <div class="quick-view-details">
                    <div class="product-category">${product.category}</div>
                    <h2>${product.title}</h2>
                    <div class="product-author">by ${product.author}</div>
                    
                    ${product.rating ? `
                        <div class="product-rating">
                            <div class="stars">${this.renderStars(product.rating)}</div>
                            <span class="rating-count">(${product.review_count || 0} reviews)</span>
                        </div>
                    ` : ''}
                    
                    <div class="product-price">
                        ${product.sale_price ? `
                            <span class="price-sale">$${product.sale_price.toFixed(2)}</span>
                            <span class="price-regular">$${product.price.toFixed(2)}</span>
                        ` : `
                            <span class="price">$${product.price.toFixed(2)}</span>
                        `}
                    </div>
                    
                    <div class="product-description">
                        ${product.description || ''}
                    </div>
                    
                    <div class="quick-view-actions">
                        <button class="btn btn-primary" onclick="productDisplay.addToCart('${productId}')">
                            Add to Cart
                        </button>
                        <a href="${product.url}" class="btn btn-secondary">View Details</a>
                    </div>
                </div>
            </div>
        `;

        this.showModal('quickViewModal');
    }

    toggleWishlist(productId) {
        const button = document.querySelector(`[data-product-id="${productId}"] .wishlist`);
        
        if (this.wishlist.has(productId)) {
            this.wishlist.delete(productId);
            button?.classList.remove('active');
        } else {
            this.wishlist.add(productId);
            button?.classList.add('active');
        }

        this.saveWishlist();
    }

    toggleCompare(productId) {
        const button = document.querySelector(`[data-product-id="${productId}"] .compare`);
        
        if (this.compareList.has(productId)) {
            this.compareList.delete(productId);
            button?.classList.remove('active');
        } else {
            if (this.compareList.size >= 4) {
                this.showError('You can compare up to 4 products');
                return;
            }
            this.compareList.add(productId);
            button?.classList.add('active');
        }

        this.updateCompareButton();
    }

    updateCompareButton() {
        // Add floating compare button if items in compare list
        let compareFloating = document.getElementById('compareFloating');
        
        if (this.compareList.size > 1) {
            if (!compareFloating) {
                compareFloating = document.createElement('div');
                compareFloating.id = 'compareFloating';
                compareFloating.className = 'compare-floating';
                compareFloating.innerHTML = `
                    <span class="compare-count">${this.compareList.size}</span>
                    <span class="compare-text">Compare Products</span>
                    <button class="btn btn-primary" onclick="productDisplay.showCompare()">
                        Compare
                    </button>
                `;
                document.body.appendChild(compareFloating);
            } else {
                compareFloating.querySelector('.compare-count').textContent = this.compareList.size;
            }
        } else if (compareFloating) {
            compareFloating.remove();
        }
    }

    showCompare() {
        if (this.compareList.size < 2) {
            this.showError('Select at least 2 products to compare');
            return;
        }

        const compareProducts = Array.from(this.compareList)
            .map(id => this.products.find(p => p.id === id))
            .filter(product => product);

        const tableContainer = document.getElementById('compareTableContainer');
        if (!tableContainer) return;

        tableContainer.innerHTML = `
            <table class="compare-table">
                <thead>
                    <tr>
                        <th>Feature</th>
                        ${compareProducts.map(product => `
                            <th>
                                <img src="${product.image}" alt="${product.title}" class="compare-product-image">
                                <h4>${product.title}</h4>
                                <button class="remove-from-compare" onclick="productDisplay.removeFromCompare('${product.id}')">
                                    Remove
                                </button>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Price</strong></td>
                        ${compareProducts.map(product => `
                            <td>$${product.price.toFixed(2)}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td><strong>Author</strong></td>
                        ${compareProducts.map(product => `
                            <td>${product.author}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td><strong>Category</strong></td>
                        ${compareProducts.map(product => `
                            <td>${product.category}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td><strong>Rating</strong></td>
                        ${compareProducts.map(product => `
                            <td>${product.rating ? this.renderStars(product.rating) : 'Not rated'}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td><strong>Stock</strong></td>
                        ${compareProducts.map(product => `
                            <td>${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td><strong>Actions</strong></td>
                        ${compareProducts.map(product => `
                            <td>
                                <button class="btn btn-primary btn-sm" onclick="productDisplay.addToCart('${product.id}')">
                                    Add to Cart
                                </button>
                            </td>
                        `).join('')}
                    </tr>
                </tbody>
            </table>
        `;

        this.showModal('compareModal');
    }

    removeFromCompare(productId) {
        this.compareList.delete(productId);
        
        const button = document.querySelector(`[data-product-id="${productId}"] .compare`);
        if (button) button.classList.remove('active');
        
        this.updateCompareButton();
        
        if (this.compareList.size >= 2) {
            this.showCompare(); // Refresh compare modal
        } else {
            this.closeModals();
        }
    }

    lazyLoadImages() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    loadUserPreferences() {
        // Load saved view mode
        const savedView = localStorage.getItem('productViewMode');
        if (savedView && ['grid', 'list'].includes(savedView)) {
            this.changeView(savedView);
        }

        // Load wishlist
        const savedWishlist = localStorage.getItem('productWishlist');
        if (savedWishlist) {
            try {
                const wishlistArray = JSON.parse(savedWishlist);
                this.wishlist = new Set(wishlistArray);
            } catch (error) {
                console.error('Error loading wishlist:', error);
            }
        }
    }

    saveWishlist() {
        localStorage.setItem('productWishlist', JSON.stringify(Array.from(this.wishlist)));
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    }

    closeModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.classList.remove('modal-open');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize product display
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productDisplay')) {
        window.productDisplay = new ProductDisplay();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductDisplay;
}
