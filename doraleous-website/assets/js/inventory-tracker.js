/* ===================================
   INVENTORY TRACKER
   File: assets/js/inventory-tracker.js
   =================================== */

class InventoryTracker {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || '/api/inventory';
        this.lowStockThreshold = options.lowStockThreshold || 10;
        this.criticalStockThreshold = options.criticalStockThreshold || 5;
        this.enableRealTimeUpdates = options.enableRealTimeUpdates !== false;
        this.enableLowStockAlerts = options.enableLowStockAlerts !== false;
        this.autoSaveChanges = options.autoSaveChanges !== false;
        
        this.inventory = new Map();
        this.pendingChanges = new Map();
        this.stockMovements = [];
        this.saveTimer = null;
        this.alertsShown = new Set();
        
        this.init();
    }

    init() {
        this.setupInterface();
        this.bindEvents();
        this.loadInventory();
        this.setupAutoSave();
        this.setupStockAlerts();
        
        if (this.enableRealTimeUpdates) {
            this.setupRealTimeUpdates();
        }
    }

    setupInterface() {
        const container = document.getElementById('inventoryTracker');
        if (!container) return;

        container.innerHTML = `
            <div class="inventory-header">
                <h2>Inventory Management</h2>
                <div class="inventory-stats" id="inventoryStats">
                    <!-- Stats will be populated -->
                </div>
            </div>

            <div class="inventory-controls">
                <div class="control-group">
                    <button class="btn btn-primary" id="addNewProduct">
                        <i class="fas fa-plus"></i> Add Product
                    </button>
                    <button class="btn btn-secondary" id="bulkUpdate">
                        <i class="fas fa-upload"></i> Bulk Update
                    </button>
                    <button class="btn btn-info" id="exportInventory">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn btn-warning" id="lowStockReport">
                        <i class="fas fa-exclamation-triangle"></i> Low Stock Report
                    </button>
                </div>

                <div class="search-filter-group">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="productSearch" placeholder="Search products...">
                    </div>
                    <select id="categoryFilter" class="filter-select">
                        <option value="">All Categories</option>
                        <!-- Categories will be populated -->
                    </select>
                    <select id="stockStatusFilter" class="filter-select">
                        <option value="">All Stock Levels</option>
                        <option value="in-stock">In Stock</option>
                        <option value="low-stock">Low Stock</option>
                        <option value="out-of-stock">Out of Stock</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
            </div>

            <div class="inventory-alerts" id="inventoryAlerts">
                <!-- Alerts will be displayed here -->
            </div>

            <div class="inventory-table-container">
                <table class="inventory-table">
                    <thead>
                        <tr>
                            <th class="sortable" data-sort="title">Product</th>
                            <th class="sortable" data-sort="sku">SKU</th>
                            <th class="sortable" data-sort="category">Category</th>
                            <th class="sortable" data-sort="current_stock">Stock</th>
                            <th class="sortable" data-sort="reserved_stock">Reserved</th>
                            <th class="sortable" data-sort="available_stock">Available</th>
                            <th class="sortable" data-sort="price">Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="inventoryTableBody">
                        <!-- Inventory items will be populated here -->
                    </tbody>
                </table>
            </div>

            <div class="quick-actions" id="quickActions">
                <div class="quick-action-card">
                    <h4>Quick Stock Adjustment</h4>
                    <form id="quickStockForm">
                        <div class="form-row">
                            <select id="quickProductSelect" required>
                                <option value="">Select Product</option>
                            </select>
                            <select id="quickActionType" required>
                                <option value="add">Add Stock</option>
                                <option value="remove">Remove Stock</option>
                                <option value="set">Set Stock</option>
                            </select>
                            <input type="number" id="quickQuantity" placeholder="Quantity" min="0" required>
                            <input type="text" id="quickReason" placeholder="Reason (optional)">
                            <button type="submit" class="btn btn-primary">Update</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Stock Movement Modal -->
            <div class="modal" id="stockMovementModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Stock Movement History</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body" id="stockMovementBody">
                        <!-- Movement history will be populated -->
                    </div>
                </div>
            </div>

            <!-- Add/Edit Product Modal -->
            <div class="modal" id="productModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="productModalTitle">Add Product</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="productForm">
                            <div class="form-group">
                                <label for="productTitle">Product Title *</label>
                                <input type="text" id="productTitle" required>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="productSku">SKU *</label>
                                    <input type="text" id="productSku" required>
                                </div>
                                <div class="form-group">
                                    <label for="productCategory">Category</label>
                                    <select id="productCategory">
                                        <option value="">Select Category</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="productPrice">Price</label>
                                    <input type="number" id="productPrice" step="0.01" min="0">
                                </div>
                                <div class="form-group">
                                    <label for="productWeight">Weight (lbs)</label>
                                    <input type="number" id="productWeight" step="0.1" min="0">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="initialStock">Initial Stock</label>
                                    <input type="number" id="initialStock" min="0" value="0">
                                </div>
                                <div class="form-group">
                                    <label for="minStockLevel">Minimum Stock Level</label>
                                    <input type="number" id="minStockLevel" min="0" value="10">
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="productDescription">Description</label>
                                <textarea id="productDescription" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancelProduct">Cancel</button>
                        <button class="btn btn-primary" id="saveProduct">Save Product</button>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Control buttons
        document.getElementById('addNewProduct')?.addEventListener('click', () => this.showProductModal());
        document.getElementById('bulkUpdate')?.addEventListener('click', () => this.showBulkUpdateDialog());
        document.getElementById('exportInventory')?.addEventListener('click', () => this.exportInventory());
        document.getElementById('lowStockReport')?.addEventListener('click', () => this.generateLowStockReport());

        // Search and filters
        document.getElementById('productSearch')?.addEventListener('input', (e) => {
            this.debounce(() => this.filterInventory(), 300)();
        });

        document.getElementById('categoryFilter')?.addEventListener('change', () => this.filterInventory());
        document.getElementById('stockStatusFilter')?.addEventListener('change', () => this.filterInventory());

        // Quick stock form
        document.getElementById('quickStockForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleQuickStockAdjustment();
        });

        // Product form
        document.getElementById('productForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProductForm();
        });

        // Table events
        const tableBody = document.getElementById('inventoryTableBody');
        if (tableBody) {
            tableBody.addEventListener('click', (e) => this.handleTableClick(e));
            tableBody.addEventListener('change', (e) => this.handleStockChange(e));
            tableBody.addEventListener('blur', (e) => this.handleStockBlur(e), true);
        }

        // Modal events
        this.bindModalEvents();

        // Sorting
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('sortable')) {
                const sortBy = e.target.dataset.sort;
                this.sortInventory(sortBy);
            }
        });
    }

    bindModalEvents() {
        // Close modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });

        // Product modal buttons
        document.getElementById('cancelProduct')?.addEventListener('click', () => this.closeModals());
        document.getElementById('saveProduct')?.addEventListener('click', () => this.saveProductForm());
    }

    async loadInventory() {
        try {
            this.showLoading();
            
            const response = await fetch(this.apiEndpoint);
            if (!response.ok) {
                throw new Error('Failed to load inventory');
            }

            const data = await response.json();
            this.inventory.clear();
            
            data.products.forEach(product => {
                this.inventory.set(product.id, product);
            });

            this.renderInventory();
            this.updateStats(data.stats);
            this.populateFilters(data.categories);
            this.populateQuickSelects();
            this.checkStockLevels();

        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showError('Failed to load inventory: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    renderInventory() {
        const tableBody = document.getElementById('inventoryTableBody');
        if (!tableBody) return;

        const products = Array.from(this.inventory.values());
        
        if (products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-inventory">
                        <i class="fas fa-boxes"></i>
                        <p>No products found</p>
                        <button class="btn btn-primary" onclick="inventoryTracker.showProductModal()">
                            Add Your First Product
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = products.map(product => this.renderProductRow(product)).join('');
    }

    renderProductRow(product) {
        const stockStatus = this.getStockStatus(product);
        const availableStock = product.current_stock - product.reserved_stock;
        
        return `
            <tr data-product-id="${product.id}" class="product-row ${stockStatus.class}">
                <td>
                    <div class="product-info">
                        <img src="${product.image || '/assets/images/product-placeholder.png'}" 
                             alt="${product.title}" class="product-thumbnail">
                        <div class="product-details">
                            <div class="product-title">${product.title}</div>
                            <div class="product-meta">${product.description || ''}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="product-sku">${product.sku}</span>
                </td>
                <td>
                    <span class="product-category">${product.category || 'Uncategorized'}</span>
                </td>
                <td>
                    <div class="stock-input-group">
                        <input type="number" class="stock-input" 
                               data-field="current_stock" 
                               value="${product.current_stock}" 
                               min="0">
                        <div class="stock-controls">
                            <button class="stock-btn plus" data-action="increment-stock">+</button>
                            <button class="stock-btn minus" data-action="decrement-stock">-</button>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="reserved-stock">${product.reserved_stock}</span>
                </td>
                <td>
                    <div class="available-stock ${availableStock <= 0 ? 'zero' : ''}">
                        ${availableStock}
                    </div>
                </td>
                <td>
                    <div class="price-input-group">
                        <span class="currency">$</span>
                        <input type="number" class="price-input" 
                               data-field="price" 
                               value="${product.price}" 
                               step="0.01" min="0">
                    </div>
                </td>
                <td>
                    <span class="stock-status ${stockStatus.class}" title="${stockStatus.message}">
                        <i class="fas ${stockStatus.icon}"></i>
                        ${stockStatus.label}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" data-action="view-movements" 
                                title="View Stock Movements">
                            <i class="fas fa-history"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" data-action="edit-product" 
                                title="Edit Product">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" data-action="adjust-stock" 
                                title="Adjust Stock">
                            <i class="fas fa-plus-minus"></i>
                        </button>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline dropdown-toggle">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu">
                                <a href="#" data-action="duplicate-product">Duplicate</a>
                                <a href="#" data-action="archive-product">Archive</a>
                                <a href="#" data-action="delete-product" class="danger">Delete</a>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    getStockStatus(product) {
        const available = product.current_stock - product.reserved_stock;
        
        if (available <= 0) {
            return {
                class: 'out-of-stock',
                label: 'Out of Stock',
                icon: 'fa-times-circle',
                message: 'No stock available'
            };
        } else if (available <= this.criticalStockThreshold) {
            return {
                class: 'critical-stock',
                label: 'Critical',
                icon: 'fa-exclamation-triangle',
                message: 'Critical stock level'
            };
        } else if (available <= this.lowStockThreshold) {
            return {
                class: 'low-stock',
                label: 'Low Stock',
                icon: 'fa-exclamation-circle',
                message: 'Low stock level'
            };
        } else {
            return {
                class: 'in-stock',
                label: 'In Stock',
                icon: 'fa-check-circle',
                message: 'Good stock level'
            };
        }
    }

    handleTableClick(e) {
        const action = e.target.closest('[data-action]')?.dataset.action;
        const productId = e.target.closest('.product-row')?.dataset.productId;

        if (!action || !productId) return;

        e.preventDefault();

        switch (action) {
            case 'increment-stock':
                this.adjustStock(productId, 1);
                break;
            case 'decrement-stock':
                this.adjustStock(productId, -1);
                break;
            case 'view-movements':
                this.showStockMovements(productId);
                break;
            case 'edit-product':
                this.editProduct(productId);
                break;
            case 'adjust-stock':
                this.showStockAdjustmentDialog(productId);
                break;
            case 'duplicate-product':
                this.duplicateProduct(productId);
                break;
            case 'archive-product':
                this.archiveProduct(productId);
                break;
            case 'delete-product':
                this.deleteProduct(productId);
                break;
        }
    }

    handleStockChange(e) {
        if (!e.target.classList.contains('stock-input') && !e.target.classList.contains('price-input')) {
            return;
        }

        const productId = e.target.closest('.product-row').dataset.productId;
        const field = e.target.dataset.field;
        const value = parseFloat(e.target.value) || 0;

        this.pendingChanges.set(productId, {
            ...this.pendingChanges.get(productId),
            [field]: value
        });

        this.markRowAsChanged(productId);
        this.scheduleAutoSave();
    }

    handleStockBlur(e) {
        if (e.target.classList.contains('stock-input')) {
            const productId = e.target.closest('.product-row').dataset.productId;
            const oldValue = this.inventory.get(productId)?.current_stock || 0;
            const newValue = parseInt(e.target.value) || 0;
            
            if (oldValue !== newValue) {
                this.recordStockMovement(productId, newValue - oldValue, 'Manual adjustment');
            }
        }
    }

    async adjustStock(productId, adjustment) {
        const product = this.inventory.get(productId);
        if (!product) return;

        const newStock = Math.max(0, product.current_stock + adjustment);
        
        try {
            await this.updateProductStock(productId, newStock);
            this.recordStockMovement(productId, adjustment, 'Quick adjustment');
            
            // Update UI
            const stockInput = document.querySelector(`[data-product-id="${productId}"] .stock-input`);
            if (stockInput) {
                stockInput.value = newStock;
            }

        } catch (error) {
            console.error('Error adjusting stock:', error);
            this.showError('Failed to adjust stock: ' + error.message);
        }
    }

    async updateProductStock(productId, newStock) {
        const response = await fetch(`${this.apiEndpoint}/${productId}/stock`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ current_stock: newStock })
        });

        if (!response.ok) {
            throw new Error('Failed to update stock');
        }

        // Update local data
        const product = this.inventory.get(productId);
        if (product) {
            product.current_stock = newStock;
            this.inventory.set(productId, product);
        }

        return response.json();
    }

    recordStockMovement(productId, change, reason) {
        const product = this.inventory.get(productId);
        if (!product) return;

        const movement = {
            product_id: productId,
            product_title: product.title,
            change: change,
            reason: reason,
            timestamp: new Date().toISOString(),
            user: 'Current User' // Would be actual user in real implementation
        };

        this.stockMovements.unshift(movement);
        
        // Keep only last 100 movements in memory
        if (this.stockMovements.length > 100) {
            this.stockMovements = this.stockMovements.slice(0, 100);
        }

        // Send to server
        this.saveStockMovement(movement);
    }

    async saveStockMovement(movement) {
        try {
            await fetch(`${this.apiEndpoint}/movements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(movement)
            });
        } catch (error) {
            console.error('Error saving stock movement:', error);
        }
    }

    async handleQuickStockAdjustment() {
        const productId = document.getElementById('quickProductSelect').value;
        const actionType = document.getElementById('quickActionType').value;
        const quantity = parseInt(document.getElementById('quickQuantity').value);
        const reason = document.getElementById('quickReason').value || 'Quick adjustment';

        if (!productId || !actionType || isNaN(quantity)) {
            this.showError('Please fill in all required fields');
            return;
        }

        const product = this.inventory.get(productId);
        if (!product) {
            this.showError('Product not found');
            return;
        }

        let newStock;
        let change;

        switch (actionType) {
            case 'add':
                newStock = product.current_stock + quantity;
                change = quantity;
                break;
            case 'remove':
                newStock = Math.max(0, product.current_stock - quantity);
                change = -quantity;
                break;
            case 'set':
                newStock = quantity;
                change = quantity - product.current_stock;
                break;
        }

        try {
            await this.updateProductStock(productId, newStock);
            this.recordStockMovement(productId, change, reason);
            
            // Update UI
            this.renderInventory();
            this.checkStockLevels();
            
            // Reset form
            document.getElementById('quickStockForm').reset();
            
            this.showSuccess(`Stock updated for ${product.title}`);

        } catch (error) {
            console.error('Error updating stock:', error);
            this.showError('Failed to update stock: ' + error.message);
        }
    }

    showStockMovements(productId) {
        const product = this.inventory.get(productId);
        if (!product) return;

        const movements = this.stockMovements.filter(m => m.product_id === productId);
        
        const modalBody = document.getElementById('stockMovementBody');
        if (modalBody) {
            modalBody.innerHTML = `
                <h4>Stock Movements for ${product.title}</h4>
                <div class="movements-list">
                    ${movements.length === 0 ? 
                        '<p>No stock movements recorded yet.</p>' :
                        movements.map(movement => `
                            <div class="movement-item ${movement.change > 0 ? 'increase' : 'decrease'}">
                                <div class="movement-change">
                                    ${movement.change > 0 ? '+' : ''}${movement.change}
                                </div>
                                <div class="movement-details">
                                    <div class="movement-reason">${movement.reason}</div>
                                    <div class="movement-meta">
                                        ${new Date(movement.timestamp).toLocaleString()} by ${movement.user}
                                    </div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            `;
        }

        this.showModal('stockMovementModal');
    }

    showProductModal(productId = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        
        if (productId) {
            const product = this.inventory.get(productId);
            if (product) {
                title.textContent = 'Edit Product';
                this.populateProductForm(product);
            }
        } else {
            title.textContent = 'Add Product';
            document.getElementById('productForm').reset();
        }

        this.showModal('productModal');
    }

    populateProductForm(product) {
        document.getElementById('productTitle').value = product.title || '';
        document.getElementById('productSku').value = product.sku || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productWeight').value = product.weight || '';
        document.getElementById('initialStock').value = product.current_stock || '';
        document.getElementById('minStockLevel').value = product.min_stock_level || '';
        document.getElementById('productDescription').value = product.description || '';
    }

    async saveProductForm() {
        const formData = {
            title: document.getElementById('productTitle').value,
            sku: document.getElementById('productSku').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value) || 0,
            weight: parseFloat(document.getElementById('productWeight').value) || 0,
            current_stock: parseInt(document.getElementById('initialStock').value) || 0,
            min_stock_level: parseInt(document.getElementById('minStockLevel').value) || 0,
            description: document.getElementById('productDescription').value
        };

        if (!formData.title || !formData.sku) {
            this.showError('Please fill in required fields');
            return;
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to save product');
            }

            const savedProduct = await response.json();
            this.inventory.set(savedProduct.id, savedProduct);
            
            this.renderInventory();
            this.populateQuickSelects();
            this.closeModals();
            
            this.showSuccess('Product saved successfully');

        } catch (error) {
            console.error('Error saving product:', error);
            this.showError('Failed to save product: ' + error.message);
        }
    }

    checkStockLevels() {
        const alerts = [];
        
        this.inventory.forEach(product => {
            const available = product.current_stock - product.reserved_stock;
            
            if (available <= 0) {
                alerts.push({
                    type: 'critical',
                    message: `${product.title} is out of stock`,
                    product: product
                });
            } else if (available <= this.criticalStockThreshold) {
                alerts.push({
                    type: 'critical',
                    message: `${product.title} has critical stock level (${available} left)`,
                    product: product
                });
            } else if (available <= this.lowStockThreshold) {
                alerts.push({
                    type: 'warning',
                    message: `${product.title} has low stock (${available} left)`,
                    product: product
                });
            }
        });

        this.displayAlerts(alerts);
        
        if (this.enableLowStockAlerts) {
            this.showStockAlerts(alerts);
        }
    }

    displayAlerts(alerts) {
        const alertsContainer = document.getElementById('inventoryAlerts');
        if (!alertsContainer) return;

        if (alerts.length === 0) {
            alertsContainer.innerHTML = '';
            return;
        }

        alertsContainer.innerHTML = `
            <div class="alerts-header">
                <h4><i class="fas fa-exclamation-triangle"></i> Stock Alerts (${alerts.length})</h4>
                <button class="btn btn-sm btn-secondary" onclick="inventoryTracker.dismissAllAlerts()">
                    Dismiss All
                </button>
            </div>
            <div class="alerts-list">
                ${alerts.map(alert => `
                    <div class="alert alert-${alert.type}">
                        <span class="alert-message">${alert.message}</span>
                        <div class="alert-actions">
                            <button class="btn btn-xs btn-primary" 
                                    onclick="inventoryTracker.quickRestock('${alert.product.id}')">
                                Quick Restock
                            </button>
                            <button class="btn btn-xs btn-secondary" 
                                    onclick="this.parentElement.parentElement.remove()">
                                Dismiss
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupAutoSave() {
        if (!this.autoSaveChanges) return;

        this.saveTimer = null;
    }

    scheduleAutoSave() {
        if (!this.autoSaveChanges) return;

        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.saveAllPendingChanges();
        }, 2000);
    }

    async saveAllPendingChanges() {
        if (this.pendingChanges.size === 0) return;

        try {
            const updates = Array.from(this.pendingChanges.entries()).map(([productId, changes]) => ({
                id: productId,
                ...changes
            }));

            const response = await fetch(`${this.apiEndpoint}/bulk-update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ updates })
            });

            if (!response.ok) {
                throw new Error('Failed to save changes');
            }

            // Clear pending changes
            this.pendingChanges.clear();
            
            // Remove changed indicators
            document.querySelectorAll('.product-row.changed').forEach(row => {
                row.classList.remove('changed');
            });

            this.showAutoSaved();

        } catch (error) {
            console.error('Error saving changes:', error);
            this.showError('Failed to save changes: ' + error.message);
        }
    }

    markRowAsChanged(productId) {
        const row = document.querySelector(`[data-product-id="${productId}"]`);
        if (row) {
            row.classList.add('changed');
        }
    }

    filterInventory() {
        const search = document.getElementById('productSearch')?.value.toLowerCase() || '';
        const category = document.getElementById('categoryFilter')?.value || '';
        const stockStatus = document.getElementById('stockStatusFilter')?.value || '';

        const rows = document.querySelectorAll('.product-row');
        
        rows.forEach(row => {
            const productId = row.dataset.productId;
            const product = this.inventory.get(productId);
            
            if (!product) {
                row.style.display = 'none';
                return;
            }

            let show = true;

            // Search filter
            if (search && !product.title.toLowerCase().includes(search) && 
                !product.sku.toLowerCase().includes(search)) {
                show = false;
            }

            // Category filter
            if (category && product.category !== category) {
                show = false;
            }

            // Stock status filter
            if (stockStatus) {
                const status = this.getStockStatus(product);
                const available = product.current_stock - product.reserved_stock;
                
                switch (stockStatus) {
                    case 'in-stock':
                        if (available <= this.lowStockThreshold) show = false;
                        break;
                    case 'low-stock':
                        if (available > this.lowStockThreshold || available <= this.criticalStockThreshold) show = false;
                        break;
                    case 'critical':
                        if (available > this.criticalStockThreshold) show = false;
                        break;
                    case 'out-of-stock':
                        if (available > 0) show = false;
                        break;
                }
            }

            row.style.display = show ? '' : 'none';
        });
    }

    updateStats(stats) {
        const statsContainer = document.getElementById('inventoryStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.total_products}</div>
                <div class="stat-label">Total Products</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">$${stats.total_value.toFixed(2)}</div>
                <div class="stat-label">Inventory Value</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-value">${stats.low_stock_count}</div>
                <div class="stat-label">Low Stock Items</div>
            </div>
            <div class="stat-card critical">
                <div class="stat-value">${stats.out_of_stock_count}</div>
                <div class="stat-label">Out of Stock</div>
            </div>
        `;
    }

    populateFilters(categories) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter && categories) {
            const currentValue = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
            categoryFilter.value = currentValue;
        }
    }

    populateQuickSelects() {
        const quickSelect = document.getElementById('quickProductSelect');
        if (quickSelect) {
            const currentValue = quickSelect.value;
            quickSelect.innerHTML = '<option value="">Select Product</option>' +
                Array.from(this.inventory.values())
                    .map(product => `<option value="${product.id}">${product.title} (${product.sku})</option>`)
                    .join('');
            quickSelect.value = currentValue;
        }
    }

    setupRealTimeUpdates() {
        // WebSocket connection for real-time inventory updates
        // Implementation would depend on your backend setup
    }

    setupStockAlerts() {
        // Setup browser notifications for critical stock levels
        if ('Notification' in window && this.enableLowStockAlerts) {
            Notification.requestPermission();
        }
    }

    showStockAlerts(alerts) {
        alerts.forEach(alert => {
            if (alert.type === 'critical' && !this.alertsShown.has(alert.product.id)) {
                this.alertsShown.add(alert.product.id);
                
                if (Notification.permission === 'granted') {
                    new Notification('Critical Stock Alert', {
                        body: alert.message,
                        icon: '/assets/images/warning-icon.png'
                    });
                }
            }
        });
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

    showLoading() {
        const tableBody = document.getElementById('inventoryTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading inventory...
                    </td>
                </tr>
            `;
        }
    }

    hideLoading() {
        // Loading will be replaced by actual content
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showAutoSaved() {
        this.showNotification('Changes auto-saved', 'info', 2000);
    }

    showNotification(message, type, duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);

        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
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

    // Public API methods
    async exportInventory() {
        try {
            const response = await fetch(`${this.apiEndpoint}/export`);
            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            this.showError('Export failed: ' + error.message);
        }
    }

    destroy() {
        clearTimeout(this.saveTimer);
    }
}

// Initialize inventory tracker
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('inventoryTracker')) {
        window.inventoryTracker = new InventoryTracker();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryTracker;
}
