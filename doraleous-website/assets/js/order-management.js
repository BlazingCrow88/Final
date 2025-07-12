/* ===================================
   ORDER MANAGEMENT SYSTEM
   File: assets/js/order-management.js
   =================================== */

class OrderManager {
    constructor() {
        this.apiEndpoint = '/api/orders';
        this.currentOrders = new Map();
        this.orderFilters = {
            status: '',
            dateRange: '',
            customer: '',
            product: ''
        };
        this.sortBy = 'created_at';
        this.sortOrder = 'desc';
        this.currentPage = 1;
        this.ordersPerPage = 20;
        this.autoRefreshInterval = 30000; // 30 seconds
        this.autoRefreshTimer = null;
        
        this.orderStatuses = {
            'pending': { label: 'Pending Payment', color: '#ffc107' },
            'processing': { label: 'Processing', color: '#17a2b8' },
            'shipped': { label: 'Shipped', color: '#007bff' },
            'delivered': { label: 'Delivered', color: '#28a745' },
            'cancelled': { label: 'Cancelled', color: '#dc3545' },
            'refunded': { label: 'Refunded', color: '#6c757d' }
        };

        this.init();
    }

    init() {
        this.setupInterface();
        this.bindEvents();
        this.loadOrders();
        this.startAutoRefresh();
        this.setupNotifications();
    }

    setupInterface() {
        const container = document.getElementById('orderManagement');
        if (!container) return;

        container.innerHTML = `
            <div class="order-management-header">
                <h2>Order Management</h2>
                <div class="order-stats" id="orderStats">
                    <!-- Stats will be populated -->
                </div>
            </div>

            <div class="order-filters">
                <div class="filter-group">
                    <select id="statusFilter" class="filter-select">
                        <option value="">All Statuses</option>
                        ${Object.entries(this.orderStatuses).map(([value, config]) => 
                            `<option value="${value}">${config.label}</option>`
                        ).join('')}
                    </select>

                    <select id="dateRangeFilter" class="filter-select">
                        <option value="">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    <input type="text" id="customerFilter" placeholder="Search by customer..." class="filter-input">
                    <input type="text" id="orderIdFilter" placeholder="Search by order ID..." class="filter-input">
                </div>

                <div class="filter-actions">
                    <button class="btn btn-secondary" id="clearFilters">Clear Filters</button>
                    <button class="btn btn-primary" id="exportOrders">Export</button>
                    <button class="btn btn-outline" id="refreshOrders">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            <div class="bulk-actions" id="bulkActions" style="display: none;">
                <select id="bulkActionSelect">
                    <option value="">Bulk Actions</option>
                    <option value="mark-processing">Mark as Processing</option>
                    <option value="mark-shipped">Mark as Shipped</option>
                    <option value="mark-delivered">Mark as Delivered</option>
                    <option value="export-selected">Export Selected</option>
                    <option value="send-notification">Send Notification</option>
                </select>
                <button class="btn btn-secondary" id="applyBulkAction">Apply</button>
                <span class="selected-count" id="selectedCount">0 selected</span>
            </div>

            <div class="orders-table-container">
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th class="select-column">
                                <input type="checkbox" id="selectAllOrders">
                            </th>
                            <th class="sortable" data-sort="order_number">Order #</th>
                            <th class="sortable" data-sort="customer_name">Customer</th>
                            <th class="sortable" data-sort="total">Total</th>
                            <th class="sortable" data-sort="status">Status</th>
                            <th class="sortable" data-sort="created_at">Date</th>
                            <th>Items</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="ordersTableBody">
                        <!-- Orders will be populated here -->
                    </tbody>
                </table>
            </div>

            <div class="pagination-container" id="ordersPagination">
                <!-- Pagination will be rendered here -->
            </div>

            <!-- Order Details Modal -->
            <div class="modal" id="orderDetailsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="orderDetailsTitle">Order Details</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body" id="orderDetailsBody">
                        <!-- Order details will be populated -->
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="closeOrderDetails">Close</button>
                        <button class="btn btn-primary" id="updateOrderStatus">Update Status</button>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Filter events
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('filter-select')) {
                this.applyFilters();
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('filter-input')) {
                this.debounce(() => this.applyFilters(), 500)();
            }
        });

        // Action buttons
        const refreshBtn = document.getElementById('refreshOrders');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadOrders());
        }

        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        const exportBtn = document.getElementById('exportOrders');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportOrders());
        }

        // Bulk actions
        const selectAllCheckbox = document.getElementById('selectAllOrders');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        const applyBulkActionBtn = document.getElementById('applyBulkAction');
        if (applyBulkActionBtn) {
            applyBulkActionBtn.addEventListener('click', () => this.applyBulkAction());
        }

        // Table events
        const tableBody = document.getElementById('ordersTableBody');
        if (tableBody) {
            tableBody.addEventListener('click', (e) => this.handleTableClick(e));
            tableBody.addEventListener('change', (e) => this.handleTableChange(e));
        }

        // Sorting
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('sortable')) {
                const sortBy = e.target.dataset.sort;
                this.toggleSort(sortBy);
            }
        });

        // Modal events
        this.bindModalEvents();
    }

    bindModalEvents() {
        const modal = document.getElementById('orderDetailsModal');
        const closeBtn = modal?.querySelector('.modal-close');
        const closeOrderDetailsBtn = document.getElementById('closeOrderDetails');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (closeOrderDetailsBtn) {
            closeOrderDetailsBtn.addEventListener('click', () => this.closeModal());
        }

        // Close modal on background click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    async loadOrders() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.ordersPerPage,
                sort: this.sortBy,
                order: this.sortOrder,
                ...this.orderFilters
            });

            const response = await fetch(`${this.apiEndpoint}?${params}`);
            if (!response.ok) {
                throw new Error('Failed to load orders');
            }

            const data = await response.json();
            this.renderOrders(data.orders);
            this.updateStats(data.stats);
            this.renderPagination(data.pagination);
            
            // Update current orders map
            data.orders.forEach(order => {
                this.currentOrders.set(order.id, order);
            });

        } catch (error) {
            console.error('Error loading orders:', error);
            this.showError('Failed to load orders: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    renderOrders(orders) {
        const tableBody = document.getElementById('ordersTableBody');
        if (!tableBody) return;

        if (orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-orders">
                        <i class="fas fa-shopping-cart"></i>
                        <p>No orders found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = orders.map(order => this.renderOrderRow(order)).join('');
    }

    renderOrderRow(order) {
        const statusConfig = this.orderStatuses[order.status] || { label: order.status, color: '#6c757d' };
        
        return `
            <tr data-order-id="${order.id}" class="order-row">
                <td>
                    <input type="checkbox" class="select-order" value="${order.id}">
                </td>
                <td>
                    <a href="#" class="order-number" data-action="view-details">
                        #${order.order_number}
                    </a>
                </td>
                <td>
                    <div class="customer-info">
                        <div class="customer-name">${order.customer_name}</div>
                        <div class="customer-email">${order.customer_email}</div>
                    </div>
                </td>
                <td>
                    <div class="order-total">
                        <strong>$${order.total.toFixed(2)}</strong>
                        <small>${order.items_count} items</small>
                    </div>
                </td>
                <td>
                    <select class="status-select" data-order-id="${order.id}">
                        ${Object.entries(this.orderStatuses).map(([value, config]) => 
                            `<option value="${value}" ${value === order.status ? 'selected' : ''}>${config.label}</option>`
                        ).join('')}
                    </select>
                </td>
                <td>
                    <div class="order-date">
                        <div>${order.formatted_date}</div>
                        <small>${order.time_ago}</small>
                    </div>
                </td>
                <td>
                    <div class="order-items">
                        ${order.items.slice(0, 2).map(item => 
                            `<div class="item-preview">${item.title} × ${item.quantity}</div>`
                        ).join('')}
                        ${order.items.length > 2 ? `<div class="more-items">+${order.items.length - 2} more</div>` : ''}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" data-action="view-details" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" data-action="print-invoice" title="Print Invoice">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn btn-sm btn-info" data-action="send-email" title="Send Email">
                            <i class="fas fa-envelope"></i>
                        </button>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline dropdown-toggle" data-action="more-actions">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu">
                                <a href="#" data-action="duplicate-order">Duplicate Order</a>
                                <a href="#" data-action="refund-order">Process Refund</a>
                                <a href="#" data-action="track-shipment">Track Shipment</a>
                                <a href="#" data-action="delete-order" class="danger">Delete Order</a>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    handleTableClick(e) {
        const action = e.target.closest('[data-action]')?.dataset.action;
        const orderId = e.target.closest('[data-order-id]')?.dataset.orderId || 
                       e.target.closest('.order-row')?.dataset.orderId;

        if (!action || !orderId) return;

        e.preventDefault();

        switch (action) {
            case 'view-details':
                this.viewOrderDetails(orderId);
                break;
            case 'print-invoice':
                this.printInvoice(orderId);
                break;
            case 'send-email':
                this.sendOrderEmail(orderId);
                break;
            case 'duplicate-order':
                this.duplicateOrder(orderId);
                break;
            case 'refund-order':
                this.processRefund(orderId);
                break;
            case 'track-shipment':
                this.trackShipment(orderId);
                break;
            case 'delete-order':
                this.deleteOrder(orderId);
                break;
        }
    }

    handleTableChange(e) {
        if (e.target.classList.contains('select-order')) {
            this.updateBulkActionsVisibility();
        }

        if (e.target.classList.contains('status-select')) {
            const orderId = e.target.dataset.orderId;
            const newStatus = e.target.value;
            this.updateOrderStatus(orderId, newStatus);
        }
    }

    async viewOrderDetails(orderId) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${orderId}`);
            if (!response.ok) {
                throw new Error('Failed to load order details');
            }

            const order = await response.json();
            this.renderOrderDetails(order);
            this.showModal('orderDetailsModal');

        } catch (error) {
            console.error('Error loading order details:', error);
            this.showError('Failed to load order details: ' + error.message);
        }
    }

    renderOrderDetails(order) {
        const titleElement = document.getElementById('orderDetailsTitle');
        const bodyElement = document.getElementById('orderDetailsBody');

        if (titleElement) {
            titleElement.textContent = `Order #${order.order_number}`;
        }

        if (bodyElement) {
            bodyElement.innerHTML = `
                <div class="order-details-content">
                    <div class="details-section">
                        <h4>Customer Information</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <label>Name:</label>
                                <span>${order.shipping_address.name}</span>
                            </div>
                            <div class="detail-item">
                                <label>Email:</label>
                                <span>${order.customer_email}</span>
                            </div>
                            <div class="detail-item">
                                <label>Phone:</label>
                                <span>${order.shipping_address.phone || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="details-section">
                        <h4>Shipping Address</h4>
                        <div class="address">
                            ${order.shipping_address.address}<br>
                            ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}<br>
                            ${order.shipping_address.country}
                        </div>
                    </div>

                    <div class="details-section">
                        <h4>Order Items</h4>
                        <div class="order-items-list">
                            ${order.items.map(item => `
                                <div class="order-item">
                                    <img src="${item.image}" alt="${item.title}" class="item-image">
                                    <div class="item-info">
                                        <h5>${item.title}</h5>
                                        <p>Quantity: ${item.quantity}</p>
                                        <p>Price: $${item.price.toFixed(2)}</p>
                                        <p>Total: $${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="details-section">
                        <h4>Order Summary</h4>
                        <div class="order-summary">
                            <div class="summary-line">
                                <span>Subtotal:</span>
                                <span>$${order.subtotal.toFixed(2)}</span>
                            </div>
                            <div class="summary-line">
                                <span>Shipping:</span>
                                <span>$${order.shipping.toFixed(2)}</span>
                            </div>
                            <div class="summary-line">
                                <span>Tax:</span>
                                <span>$${order.tax.toFixed(2)}</span>
                            </div>
                            <div class="summary-line total">
                                <span>Total:</span>
                                <span>$${order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="details-section">
                        <h4>Payment Information</h4>
                        <div class="payment-info">
                            <p><strong>Method:</strong> ${order.payment_method}</p>
                            <p><strong>Transaction ID:</strong> ${order.transaction_id}</p>
                            <p><strong>Status:</strong> ${order.payment_status}</p>
                        </div>
                    </div>

                    <div class="details-section">
                        <h4>Order Timeline</h4>
                        <div class="order-timeline">
                            ${order.timeline.map(event => `
                                <div class="timeline-event">
                                    <div class="event-date">${event.formatted_date}</div>
                                    <div class="event-description">${event.description}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update order status');
            }

            const result = await response.json();
            
            // Update local order data
            const order = this.currentOrders.get(orderId);
            if (order) {
                order.status = newStatus;
                this.currentOrders.set(orderId, order);
            }

            this.showSuccess(`Order status updated to ${this.orderStatuses[newStatus].label}`);
            
            // Send notification email if configured
            if (result.emailSent) {
                this.showInfo('Customer notification email sent');
            }

        } catch (error) {
            console.error('Error updating order status:', error);
            this.showError('Failed to update order status: ' + error.message);
            
            // Revert the select dropdown
            const statusSelect = document.querySelector(`[data-order-id="${orderId}"].status-select`);
            if (statusSelect && this.currentOrders.has(orderId)) {
                statusSelect.value = this.currentOrders.get(orderId).status;
            }
        }
    }

    async printInvoice(orderId) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${orderId}/invoice`);
            if (!response.ok) {
                throw new Error('Failed to generate invoice');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const printWindow = window.open(url, '_blank');
            printWindow.onload = () => {
                printWindow.print();
                window.URL.revokeObjectURL(url);
            };

        } catch (error) {
            console.error('Error printing invoice:', error);
            this.showError('Failed to print invoice: ' + error.message);
        }
    }

    async sendOrderEmail(orderId) {
        const emailType = prompt('Select email type:\n1. Order Confirmation\n2. Shipping Notification\n3. Custom Message\n\nEnter number (1-3):');
        
        if (!emailType || !['1', '2', '3'].includes(emailType)) {
            return;
        }

        const emailTypes = {
            '1': 'confirmation',
            '2': 'shipping',
            '3': 'custom'
        };

        try {
            const response = await fetch(`${this.apiEndpoint}/${orderId}/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type: emailTypes[emailType] })
            });

            if (!response.ok) {
                throw new Error('Failed to send email');
            }

            this.showSuccess('Email sent successfully');

        } catch (error) {
            console.error('Error sending email:', error);
            this.showError('Failed to send email: ' + error.message);
        }
    }

    updateStats(stats) {
        const statsContainer = document.getElementById('orderStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.total_orders}</div>
                <div class="stat-label">Total Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">$${stats.total_revenue.toFixed(2)}</div>
                <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.pending_orders}</div>
                <div class="stat-label">Pending Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">$${stats.average_order_value.toFixed(2)}</div>
                <div class="stat-label">Avg Order Value</div>
            </div>
        `;
    }

    updateBulkActionsVisibility() {
        const selectedOrders = document.querySelectorAll('.select-order:checked');
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');

        if (bulkActions) {
            bulkActions.style.display = selectedOrders.length > 0 ? 'block' : 'none';
        }

        if (selectedCount) {
            selectedCount.textContent = `${selectedOrders.length} selected`;
        }
    }

    toggleSelectAll(checked) {
        const orderCheckboxes = document.querySelectorAll('.select-order');
        orderCheckboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateBulkActionsVisibility();
    }

    async applyBulkAction() {
        const action = document.getElementById('bulkActionSelect')?.value;
        const selectedOrders = Array.from(document.querySelectorAll('.select-order:checked'))
            .map(checkbox => checkbox.value);

        if (!action || selectedOrders.length === 0) {
            this.showError('Please select an action and orders');
            return;
        }

        if (!confirm(`Apply ${action} to ${selectedOrders.length} orders?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: action,
                    order_ids: selectedOrders
                })
            });

            if (!response.ok) {
                throw new Error('Bulk action failed');
            }

            this.showSuccess(`Bulk action applied to ${selectedOrders.length} orders`);
            this.loadOrders(); // Reload to reflect changes

        } catch (error) {
            console.error('Error applying bulk action:', error);
            this.showError('Bulk action failed: ' + error.message);
        }
    }

    applyFilters() {
        // Collect filter values
        this.orderFilters.status = document.getElementById('statusFilter')?.value || '';
        this.orderFilters.dateRange = document.getElementById('dateRangeFilter')?.value || '';
        this.orderFilters.customer = document.getElementById('customerFilter')?.value || '';
        this.orderFilters.orderId = document.getElementById('orderIdFilter')?.value || '';

        this.currentPage = 1;
        this.loadOrders();
    }

    clearFilters() {
        this.orderFilters = {
            status: '',
            dateRange: '',
            customer: '',
            orderId: ''
        };

        // Reset form elements
        const filterElements = document.querySelectorAll('.filter-select, .filter-input');
        filterElements.forEach(element => {
            element.value = '';
        });

        this.currentPage = 1;
        this.loadOrders();
    }

    toggleSort(sortBy) {
        if (this.sortBy === sortBy) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = sortBy;
            this.sortOrder = 'desc';
        }

        // Update sort indicators
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.dataset.sort === sortBy) {
                header.classList.add(`sort-${this.sortOrder}`);
            }
        });

        this.loadOrders();
    }

    async exportOrders() {
        try {
            const params = new URLSearchParams({
                format: 'csv',
                ...this.orderFilters
            });

            const response = await fetch(`${this.apiEndpoint}/export?${params}`);
            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.showSuccess('Orders exported successfully');

        } catch (error) {
            console.error('Error exporting orders:', error);
            this.showError('Export failed: ' + error.message);
        }
    }

    startAutoRefresh() {
        this.autoRefreshTimer = setInterval(() => {
            this.loadOrders();
        }, this.autoRefreshInterval);
    }

    stopAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
            this.autoRefreshTimer = null;
        }
    }

    setupNotifications() {
        // Setup real-time notifications for new orders
        if ('Notification' in window) {
            Notification.requestPermission();
        }

        // WebSocket connection for real-time updates would go here
        // this.connectWebSocket();
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.classList.remove('modal-open');
    }

    renderPagination(pagination) {
        const container = document.getElementById('ordersPagination');
        if (!container || !pagination) return;

        // Implementation would use the Pagination class we created earlier
        // container.innerHTML = pagination HTML
    }

    showLoading() {
        const tableBody = document.getElementById('ordersTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading orders...
                    </td>
                </tr>
            `;
        }
    }

    hideLoading() {
        // Loading state will be replaced by actual content
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type) {
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
        }, 5000);

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

    destroy() {
        this.stopAutoRefresh();
    }
}

// Initialize order manager
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('orderManagement')) {
        window.orderManager = new OrderManager();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderManager;
}
