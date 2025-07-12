/* ===================================
   PAGINATION FUNCTIONALITY
   File: assets/js/pagination.js
   =================================== */

class Pagination {
    constructor(options = {}) {
        this.container = options.container || '.pagination-container';
        this.itemsPerPage = options.itemsPerPage || 10;
        this.maxVisiblePages = options.maxVisiblePages || 5;
        this.currentPage = options.currentPage || 1;
        this.totalItems = options.totalItems || 0;
        this.showFirstLast = options.showFirstLast !== false;
        this.showPrevNext = options.showPrevNext !== false;
        this.showPageNumbers = options.showPageNumbers !== false;
        this.showInfo = options.showInfo !== false;
        this.enableKeyboard = options.enableKeyboard !== false;
        this.enableUrlUpdate = options.enableUrlUpdate !== false;
        this.onPageChange = options.onPageChange || (() => {});
        this.templates = {
            wrapper: options.wrapper || 'nav',
            ...options.templates
        };
        this.labels = {
            first: 'First',
            previous: 'Previous',
            next: 'Next',
            last: 'Last',
            info: 'Showing {start} to {end} of {total} entries',
            ...options.labels
        };
        
        this.init();
    }

    init() {
        this.containerElement = document.querySelector(this.container);
        if (!this.containerElement) {
            console.warn('Pagination container not found');
            return;
        }

        this.render();
        this.bindEvents();
        
        if (this.enableKeyboard) {
            this.bindKeyboardEvents();
        }
        
        if (this.enableUrlUpdate) {
            this.loadFromUrl();
        }
    }

    render() {
        const totalPages = this.getTotalPages();
        
        if (totalPages <= 1 && !this.showInfo) {
            this.containerElement.style.display = 'none';
            return;
        }

        this.containerElement.style.display = 'block';
        this.containerElement.innerHTML = this.generateHTML();
        this.updateActiveStates();
    }

    generateHTML() {
        const totalPages = this.getTotalPages();
        let html = '';

        // Info section
        if (this.showInfo) {
            html += this.generateInfoHTML();
        }

        // Pagination controls
        if (totalPages > 1) {
            html += `<${this.templates.wrapper} class="pagination" role="navigation" aria-label="Pagination">`;
            
            // First page
            if (this.showFirstLast) {
                html += this.generateFirstPageHTML();
            }
            
            // Previous page
            if (this.showPrevNext) {
                html += this.generatePreviousPageHTML();
            }
            
            // Page numbers
            if (this.showPageNumbers) {
                html += this.generatePageNumbersHTML();
            }
            
            // Next page
            if (this.showPrevNext) {
                html += this.generateNextPageHTML();
            }
            
            // Last page
            if (this.showFirstLast) {
                html += this.generateLastPageHTML();
            }
            
            html += `</${this.templates.wrapper}>`;
        }

        return html;
    }

    generateInfoHTML() {
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
        
        const info = this.labels.info
            .replace('{start}', start)
            .replace('{end}', end)
            .replace('{total}', this.totalItems);

        return `<div class="pagination-info">${info}</div>`;
    }

    generateFirstPageHTML() {
        const disabled = this.currentPage === 1 ? 'disabled' : '';
        const ariaCurrent = this.currentPage === 1 ? 'aria-current="page"' : '';
        
        return `
            <button class="pagination-btn first-page ${disabled}" 
                    data-page="1" 
                    ${ariaCurrent}
                    ${disabled ? 'disabled' : ''}>
                <i class="fas fa-angle-double-left"></i>
                <span class="sr-only">${this.labels.first}</span>
            </button>
        `;
    }

    generatePreviousPageHTML() {
        const disabled = this.currentPage === 1 ? 'disabled' : '';
        const prevPage = Math.max(1, this.currentPage - 1);
        
        return `
            <button class="pagination-btn prev-page ${disabled}" 
                    data-page="${prevPage}" 
                    ${disabled ? 'disabled' : ''}>
                <i class="fas fa-angle-left"></i>
                <span>${this.labels.previous}</span>
            </button>
        `;
    }

    generateNextPageHTML() {
        const totalPages = this.getTotalPages();
        const disabled = this.currentPage === totalPages ? 'disabled' : '';
        const nextPage = Math.min(totalPages, this.currentPage + 1);
        
        return `
            <button class="pagination-btn next-page ${disabled}" 
                    data-page="${nextPage}" 
                    ${disabled ? 'disabled' : ''}>
                <span>${this.labels.next}</span>
                <i class="fas fa-angle-right"></i>
            </button>
        `;
    }

    generateLastPageHTML() {
        const totalPages = this.getTotalPages();
        const disabled = this.currentPage === totalPages ? 'disabled' : '';
        const ariaCurrent = this.currentPage === totalPages ? 'aria-current="page"' : '';
        
        return `
            <button class="pagination-btn last-page ${disabled}" 
                    data-page="${totalPages}" 
                    ${ariaCurrent}
                    ${disabled ? 'disabled' : ''}>
                <span class="sr-only">${this.labels.last}</span>
                <i class="fas fa-angle-double-right"></i>
            </button>
        `;
    }

    generatePageNumbersHTML() {
        const totalPages = this.getTotalPages();
        const pageNumbers = this.getVisiblePageNumbers();
        let html = '<div class="pagination-numbers">';

        pageNumbers.forEach(page => {
            if (page === '...') {
                html += '<span class="pagination-ellipsis">...</span>';
            } else {
                const isActive = page === this.currentPage;
                const ariaCurrent = isActive ? 'aria-current="page"' : '';
                const activeClass = isActive ? 'active' : '';
                
                html += `
                    <button class="pagination-number ${activeClass}" 
                            data-page="${page}" 
                            ${ariaCurrent}>
                        ${page}
                    </button>
                `;
            }
        });

        html += '</div>';
        return html;
    }

    getVisiblePageNumbers() {
        const totalPages = this.getTotalPages();
        const maxVisible = this.maxVisiblePages;
        const current = this.currentPage;
        
        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages = [];
        const halfVisible = Math.floor(maxVisible / 2);
        
        let start = Math.max(1, current - halfVisible);
        let end = Math.min(totalPages, current + halfVisible);

        // Adjust if we're near the beginning or end
        if (current <= halfVisible) {
            end = maxVisible;
        } else if (current >= totalPages - halfVisible) {
            start = totalPages - maxVisible + 1;
        }

        // Always show first page
        if (start > 1) {
            pages.push(1);
            if (start > 2) {
                pages.push('...');
            }
        }

        // Add visible pages
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        // Always show last page
        if (end < totalPages) {
            if (end < totalPages - 1) {
                pages.push('...');
            }
            pages.push(totalPages);
        }

        return pages;
    }

    bindEvents() {
        this.containerElement.addEventListener('click', (e) => {
            const button = e.target.closest('[data-page]');
            if (!button || button.disabled) return;

            e.preventDefault();
            const page = parseInt(button.dataset.page);
            this.goToPage(page);
        });
    }

    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Only activate when pagination is focused or no input is focused
            const activeElement = document.activeElement;
            const isInputFocused = activeElement.tagName === 'INPUT' || 
                                 activeElement.tagName === 'TEXTAREA' || 
                                 activeElement.isContentEditable;

            if (isInputFocused) return;

            switch (e.key) {
                case 'ArrowLeft':
                    if (e.altKey) {
                        e.preventDefault();
                        this.previousPage();
                    }
                    break;
                case 'ArrowRight':
                    if (e.altKey) {
                        e.preventDefault();
                        this.nextPage();
                    }
                    break;
                case 'Home':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.firstPage();
                    }
                    break;
                case 'End':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.lastPage();
                    }
                    break;
            }
        });
    }

    updateActiveStates() {
        const buttons = this.containerElement.querySelectorAll('[data-page]');
        buttons.forEach(button => {
            const page = parseInt(button.dataset.page);
            const isActive = page === this.currentPage;
            
            button.classList.toggle('active', isActive);
            
            if (isActive) {
                button.setAttribute('aria-current', 'page');
            } else {
                button.removeAttribute('aria-current');
            }
        });

        // Update disabled states
        const totalPages = this.getTotalPages();
        
        const firstBtn = this.containerElement.querySelector('.first-page');
        const prevBtn = this.containerElement.querySelector('.prev-page');
        const nextBtn = this.containerElement.querySelector('.next-page');
        const lastBtn = this.containerElement.querySelector('.last-page');

        if (firstBtn) {
            firstBtn.disabled = this.currentPage === 1;
            firstBtn.classList.toggle('disabled', this.currentPage === 1);
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
            prevBtn.classList.toggle('disabled', this.currentPage === 1);
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages;
            nextBtn.classList.toggle('disabled', this.currentPage === totalPages);
        }
        
        if (lastBtn) {
            lastBtn.disabled = this.currentPage === totalPages;
            lastBtn.classList.toggle('disabled', this.currentPage === totalPages);
        }
    }

    goToPage(page) {
        const totalPages = this.getTotalPages();
        
        if (page < 1 || page > totalPages || page === this.currentPage) {
            return;
        }

        const oldPage = this.currentPage;
        this.currentPage = page;
        
        this.render();
        
        if (this.enableUrlUpdate) {
            this.updateUrl();
        }

        // Trigger callback
        this.onPageChange({
            currentPage: this.currentPage,
            previousPage: oldPage,
            totalPages: totalPages,
            itemsPerPage: this.itemsPerPage,
            startIndex: (this.currentPage - 1) * this.itemsPerPage,
            endIndex: Math.min(this.currentPage * this.itemsPerPage - 1, this.totalItems - 1)
        });

        // Announce page change for screen readers
        this.announcePageChange();
    }

    nextPage() {
        this.goToPage(this.currentPage + 1);
    }

    previousPage() {
        this.goToPage(this.currentPage - 1);
    }

    firstPage() {
        this.goToPage(1);
    }

    lastPage() {
        this.goToPage(this.getTotalPages());
    }

    getTotalPages() {
        return Math.ceil(this.totalItems / this.itemsPerPage);
    }

    updateUrl() {
        const url = new URL(window.location);
        
        if (this.currentPage === 1) {
            url.searchParams.delete('page');
        } else {
            url.searchParams.set('page', this.currentPage);
        }
        
        history.replaceState(null, '', url);
    }

    loadFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const page = parseInt(urlParams.get('page')) || 1;
        
        if (page !== this.currentPage) {
            this.currentPage = page;
            this.render();
        }
    }

    announcePageChange() {
        // Create live region for screen reader announcements
        let announcer = document.getElementById('pagination-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'pagination-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'sr-only';
            document.body.appendChild(announcer);
        }

        const totalPages = this.getTotalPages();
        announcer.textContent = `Page ${this.currentPage} of ${totalPages}`;
    }

    // Public API methods
    setPage(page) {
        this.goToPage(page);
    }

    setItemsPerPage(itemsPerPage) {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.render();
    }

    setTotalItems(totalItems) {
        const oldTotalPages = this.getTotalPages();
        this.totalItems = totalItems;
        const newTotalPages = this.getTotalPages();

        // Adjust current page if it's now out of range
        if (this.currentPage > newTotalPages) {
            this.currentPage = Math.max(1, newTotalPages);
        }

        this.render();
    }

    getCurrentPageInfo() {
        return {
            currentPage: this.currentPage,
            totalPages: this.getTotalPages(),
            itemsPerPage: this.itemsPerPage,
            totalItems: this.totalItems,
            startIndex: (this.currentPage - 1) * this.itemsPerPage,
            endIndex: Math.min(this.currentPage * this.itemsPerPage - 1, this.totalItems - 1)
        };
    }

    destroy() {
        if (this.containerElement) {
            this.containerElement.innerHTML = '';
        }
        
        const announcer = document.getElementById('pagination-announcer');
        if (announcer) {
            announcer.remove();
        }
    }

    // Static method to create pagination from data attributes
    static fromElement(element) {
        const options = {
            container: element,
            itemsPerPage: parseInt(element.dataset.itemsPerPage) || 10,
            maxVisiblePages: parseInt(element.dataset.maxVisiblePages) || 5,
            currentPage: parseInt(element.dataset.currentPage) || 1,
            totalItems: parseInt(element.dataset.totalItems) || 0,
            showFirstLast: element.dataset.showFirstLast !== 'false',
            showPrevNext: element.dataset.showPrevNext !== 'false',
            showPageNumbers: element.dataset.showPageNumbers !== 'false',
            showInfo: element.dataset.showInfo !== 'false',
            enableKeyboard: element.dataset.enableKeyboard !== 'false',
            enableUrlUpdate: element.dataset.enableUrlUpdate !== 'false'
        };

        return new Pagination(options);
    }
}

// Auto-initialize pagination elements
document.addEventListener('DOMContentLoaded', () => {
    const paginationElements = document.querySelectorAll('[data-pagination]');
    paginationElements.forEach(element => {
        new Pagination({ container: element });
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pagination;
} else {
    window.Pagination = Pagination;
}
