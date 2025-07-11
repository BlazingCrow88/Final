/* ===================================
   PAYMENT PROCESSING
   File: assets/js/payment.js
   =================================== */

class PaymentProcessor {
    constructor() {
        this.currentStep = 1;
        this.maxSteps = 3;
        this.orderData = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadOrderSummary();
        this.initializePaymentMethods();
    }

    bindEvents() {
        const nextBtn = document.getElementById('nextBtn');
        const backBtn = document.getElementById('backBtn');
        const checkoutForm = document.getElementById('checkoutForm');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => this.prevStep());
        }

        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => this.processOrder(e));
        }

        // Payment method change
        document.addEventListener('change', (e) => {
            if (e.target.name === 'paymentMethod') {
                this.switchPaymentMethod(e.target.value);
            }
        });
    }

    nextStep() {
        if (this.currentStep < this.maxSteps) {
            if (this.validateCurrentStep()) {
                this.currentStep++;
                this.updateStepDisplay();
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    updateStepDisplay() {
        // Update step indicators
        const steps = document.querySelectorAll('.step');
        steps.forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.currentStep);
            step.classList.toggle('completed', index + 1 < this.currentStep);
        });

        // Show/hide sections
        const sections = ['shippingSection', 'paymentSection', 'reviewSection'];
        sections.forEach((sectionId, index) => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = (index + 1 === this.currentStep) ? 'block' : 'none';
            }
        });

        // Update buttons
        const nextBtn = document.getElementById('nextBtn');
        const backBtn = document.getElementById('backBtn');
        const placeOrderBtn = document.getElementById('placeOrderBtn');

        if (backBtn) {
            backBtn.style.display = this.currentStep > 1 ? 'inline-block' : 'none';
        }

        if (nextBtn && placeOrderBtn) {
            if (this.currentStep < this.maxSteps) {
                nextBtn.style.display = 'inline-block';
                placeOrderBtn.style.display = 'none';
                nextBtn.textContent = this.currentStep === 1 ? 'Continue to Payment' : 'Review Order';
            } else {
                nextBtn.style.display = 'none';
                placeOrderBtn.style.display = 'inline-block';
            }
        }

        // Load review data if on review step
        if (this.currentStep === 3) {
            this.loadOrderReview();
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateShippingInfo();
            case 2:
                return this.validatePaymentInfo();
            default:
                return true;
        }
    }

    validateShippingInfo() {
        const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zipCode', 'country'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            const value = field?.value.trim();
            
            if (!value) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);
                
                // Email validation
                if (fieldName === 'email' && !this.isValidEmail(value)) {
                    this.showFieldError(field, 'Please enter a valid email');
                    isValid = false;
                }
            }
        });

        // Store shipping data if valid
        if (isValid) {
            this.orderData.shipping = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zipCode: document.getElementById('zipCode').value,
                country: document.getElementById('country').value
            };
        }

        return isValid;
    }

    validatePaymentInfo() {
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
        
        if (paymentMethod === 'stripe') {
            // Stripe validation will be handled by Stripe Elements
            return true;
        } else if (paymentMethod === 'paypal') {
            // PayPal validation will be handled by PayPal SDK
            return true;
        }

        return false;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    switchPaymentMethod(method) {
        const stripePayment = document.getElementById('stripePayment');
        const paypalPayment = document.getElementById('paypalPayment');

        if (stripePayment && paypalPayment) {
            if (method === 'stripe') {
                stripePayment.style.display = 'block';
                paypalPayment.style.display = 'none';
            } else if (method === 'paypal') {
                stripePayment.style.display = 'none';
                paypalPayment.style.display = 'block';
            }
        }
    }

    initializePaymentMethods() {
        // Initialize Stripe (handled in stripe-integration.js)
        if (window.initializeStripe) {
            window.initializeStripe();
        }

        // Initialize PayPal (handled in paypal-integration.js)
        if (window.initializePayPal) {
            window.initializePayPal();
        }
    }

    loadOrderSummary() {
        if (!window.cart) return;

        const checkoutItems = document.getElementById('checkoutItems');
        if (!checkoutItems) return;

        const cartData = window.cart.getCartData();
        
        checkoutItems.innerHTML = cartData.items.map(item => `
            <div class="checkout-item">
                <img src="${item.image}" alt="${item.title}">
                <div class="item-info">
                    <h4>${item.title}</h4>
                    <p>Qty: ${item.quantity}</p>
                </div>
                <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `).join('');

        // Update totals
        document.getElementById('checkoutSubtotal').textContent = `$${cartData.subtotal.toFixed(2)}`;
        document.getElementById('checkoutShipping').textContent = `$${cartData.shipping.toFixed(2)}`;
        document.getElementById('checkoutTax').textContent = `$${cartData.tax.toFixed(2)}`;
        document.getElementById('checkoutTotal').textContent = `$${cartData.total.toFixed(2)}`;
    }

    loadOrderReview() {
        const reviewContainer = document.getElementById('orderReview');
        if (!reviewContainer || !this.orderData.shipping) return;

        const cartData = window.cart.getCartData();
        
        reviewContainer.innerHTML = `
            <div class="review-section">
                <h4>Shipping Address</h4>
                <p>${this.orderData.shipping.firstName} ${this.orderData.shipping.lastName}</p>
                <p>${this.orderData.shipping.address}</p>
                <p>${this.orderData.shipping.city}, ${this.orderData.shipping.state} ${this.orderData.shipping.zipCode}</p>
                <p>${this.orderData.shipping.country}</p>
                <p>Email: ${this.orderData.shipping.email}</p>
            </div>
            
            <div class="review-section">
                <h4>Payment Method</h4>
                <p>${this.getPaymentMethodDisplay()}</p>
            </div>
            
            <div class="review-section">
                <h4>Order Items</h4>
                ${cartData.items.map(item => `
                    <div class="review-item">
                        <span>${item.title} × ${item.quantity}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getPaymentMethodDisplay() {
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
        return paymentMethod === 'stripe' ? 'Credit Card' : 'PayPal';
    }

    async processOrder(e) {
        e.preventDefault();
        
        try {
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
            const cartData = window.cart.getCartData();
            
            this.orderData.items = cartData.items;
            this.orderData.totals = {
                subtotal: cartData.subtotal,
                shipping: cartData.shipping,
                tax: cartData.tax,
                total: cartData.total
            };
            this.orderData.paymentMethod = paymentMethod;

            // Show loading state
            this.setProcessingState(true);

            let paymentResult;
            
            if (paymentMethod === 'stripe') {
                paymentResult = await window.processStripePayment(this.orderData);
            } else if (paymentMethod === 'paypal') {
                paymentResult = await window.processPayPalPayment(this.orderData);
            }

            if (paymentResult.success) {
                await this.createOrder(paymentResult);
                this.redirectToSuccess(paymentResult.orderId);
            } else {
                throw new Error(paymentResult.error || 'Payment failed');
            }

        } catch (error) {
            console.error('Order processing error:', error);
            this.showError(error.message || 'An error occurred while processing your order');
        } finally {
            this.setProcessingState(false);
        }
    }

    async createOrder(paymentResult) {
        const orderData = {
            ...this.orderData,
            paymentId: paymentResult.paymentId,
            status: 'completed',
            createdAt: new Date().toISOString()
        };

        // Send order to backend
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error('Failed to create order');
        }

        return response.json();
    }

    setProcessingState(processing) {
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.disabled = processing;
            placeOrderBtn.textContent = processing ? 'Processing...' : 'Place Order';
        }
    }

    showError(message) {
        // Create or update error display
        let errorDiv = document.querySelector('.checkout-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'checkout-error alert alert-error';
            document.querySelector('.checkout-form').prepend(errorDiv);
        }
        errorDiv.textContent = message;
        errorDiv.scrollIntoView({ behavior: 'smooth' });
    }

    redirectToSuccess(orderId) {
        // Clear cart
        if (window.cart) {
            window.cart.clearCart();
        }
        
        // Redirect to success page
        window.location.href = `order-success.html?orderId=${orderId}`;
    }
}

// Initialize payment processor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('checkoutForm')) {
        window.paymentProcessor = new PaymentProcessor();
    }
});
