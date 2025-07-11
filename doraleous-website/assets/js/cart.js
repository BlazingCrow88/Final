/* ===================================
   SHOPPING CART FUNCTIONALITY
   File: assets/js/cart.js
   =================================== */

class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.shippingRate = 4.99;
        this.taxRate = 0.08;
        this.freeShippingThreshold = 50;
        this.init();
    }

    init() {
        this.updateCartCount();
        this.renderCart();
        this.bindEvents();
    }

    bindEvents() {
        // Quantity change events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quantity-btn')) {
                const action = e.target.dataset.action;
                const itemId = e.target.dataset.itemId;
                this.updateQuantity(itemId, action);
            }
            
            if (e.target.classList.contains('remove-item')) {
                const itemId = e.target.dataset.itemId;
                this.removeItem(itemId);
            }
        });

        // Quantity input change
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                const itemId = e.target.dataset.itemId;
                const newQuantity = parseInt(e.target.value);
                this.setQuantity(itemId, newQuantity);
            }
        });
    }

    addItem(book) {
        const existingItem = this.items.find(item => item.id === book.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: book.id,
                title: book.title,
                author: book.author,
                price: book.price,
                image: book.image,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
        this.showAddedNotification(book.title);
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
    }

    updateQuantity(itemId, action) {
        const item = this.items.find(item => item.id === itemId);
        if (!item) return;

        if (action === 'increase') {
            item.quantity += 1;
        } else if (action === 'decrease') {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                this.removeItem(itemId);
                return;
            }
        }

        this.saveCart();
        this.updateCartCount();
        this.renderCart();
    }

    setQuantity(itemId, quantity) {
        if (quantity <= 0) {
            this.removeItem(itemId);
            return;
        }

        const item = this.items.find(item => item.id === itemId);
        if (item) {
            item.quantity = quantity;
            this.saveCart();
            this.updateCartCount();
            this.renderCart();
        }
    }

    getSubtotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getShipping() {
        const subtotal = this.getSubtotal();
        return subtotal >= this.freeShippingThreshold ? 0 : this.shippingRate;
    }

    getTax() {
        return this.getSubtotal() * this.taxRate;
    }

    getTotal() {
        return this.getSubtotal() + this.getShipping() + this.getTax();
    }

    updateCartCount() {
        const count = this.items.reduce((total, item) => total + item.quantity, 0);
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = count;
            element.style.display = count > 0 ? 'inline' : 'none';
        });
    }

    renderCart() {
        const cartItemsContainer = document.getElementById('cartItems');
        const emptyCart = document.getElementById('emptyCart');
        
        if (!cartItemsContainer) return;

        if (this.items.length === 0) {
            cartItemsContainer.style.display = 'none';
            if (emptyCart) emptyCart.style.display = 'block';
            document.querySelector('.cart-summary')?.style.display = 'none';
        } else {
            cartItemsContainer.style.display = 'block';
            if (emptyCart) emptyCart.style.display = 'none';
            document.querySelector('.cart-summary')?.style.display = 'block';
            
            cartItemsContainer.innerHTML = this.items.map(item => `
                <div class="cart-item" data-item-id="${item.id}">
                    <div class="item-image">
                        <img src="${item.image}" alt="${item.title}">
                    </div>
                    <div class="item-details">
                        <h4>${item.title}</h4>
                        <p>by ${item.author}</p>
                        <p class="item-price">$${item.price.toFixed(2)}</p>
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn" data-action="decrease" data-item-id="${item.id}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-item-id="${item.id}">
                        <button class="quantity-btn" data-action="increase" data-item-id="${item.id}">+</button>
                    </div>
                    <div class="item-total">
                        $${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button class="remove-item" data-item-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }

        this.updateSummary();
    }

    updateSummary() {
        const subtotal = this.getSubtotal();
        const shipping = this.getShipping();
        const tax = this.getTax();
        const total = this.getTotal();

        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = `$${value.toFixed(2)}`;
        };

        updateElement('subtotal', subtotal);
        updateElement('shipping', shipping);
        updateElement('tax', tax);
        updateElement('total', total);

        // Update checkout summary if on checkout page
        updateElement('checkoutSubtotal', subtotal);
        updateElement('checkoutShipping', shipping);
        updateElement('checkoutTax', tax);
        updateElement('checkoutTotal', total);
    }

    showAddedNotification(title) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>"${title}" added to cart</span>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    saveCart() {
        try {
            const cartData = JSON.stringify(this.items);
            localStorage.setItem('authorWebsiteCart', cartData);
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    loadCart() {
        try {
            const cartData = localStorage.getItem('authorWebsiteCart');
            return cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
    }

    getCartData() {
        return {
            items: this.items,
            subtotal: this.getSubtotal(),
            shipping: this.getShipping(),
            tax: this.getTax(),
            total: this.getTotal()
        };
    }
}

// Initialize cart
const cart = new ShoppingCart();

// Global functions for easy access
function addToCart(book) {
    cart.addItem(book);
}

function proceedToCheckout() {
    if (cart.items.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    window.location.href = 'checkout.html';
}

// Make cart available globally
window.cart = cart;
