/* ===================================
   PAYPAL PAYMENT INTEGRATION
   File: assets/js/paypal-integration.js
   =================================== */

let paypalLoaded = false;

// Initialize PayPal
function initializePayPal() {
    if (paypalLoaded) return;

    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=USD&intent=capture';
    script.onload = () => {
        paypalLoaded = true;
        setupPayPalButtons();
    };
    document.head.appendChild(script);
}

// Setup PayPal buttons
function setupPayPalButtons() {
    const paypalContainer = document.getElementById('paypal-button-container');
    if (!paypalContainer || !window.paypal) return;

    window.paypal.Buttons({
        style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal'
        },

        // Create order
        createOrder: async function(data, actions) {
            try {
                const orderData = window.paymentProcessor ? window.paymentProcessor.orderData : {};
                const cartData = window.cart ? window.cart.getCartData() : {};

                const response = await fetch('/api/paypal/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: cartData.total,
                        currency: 'USD',
                        orderData: orderData,
                        items: cartData.items
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create PayPal order');
                }

                const order = await response.json();
                return order.id;

            } catch (error) {
                console.error('PayPal create order error:', error);
                throw error;
            }
        },

        // Approve payment
        onApprove: async function(data, actions) {
            try {
                const response = await fetch('/api/paypal/capture-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        orderID: data.orderID
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to capture PayPal payment');
                }

                const orderDetails = await response.json();
                
                // Process successful payment
                await handlePayPalSuccess(orderDetails);

            } catch (error) {
                console.error('PayPal approval error:', error);
                handlePayPalError(error.message);
            }
        },

        // Handle errors
        onError: function(err) {
            console.error('PayPal error:', err);
            handlePayPalError('PayPal payment failed. Please try again.');
        },

        // Handle cancellation
        onCancel: function(data) {
            console.log('PayPal payment cancelled:', data);
            handlePayPalCancel();
        }

    }).render('#paypal-button-container');
}

// Process PayPal payment (called by payment.js)
async function processPayPalPayment(orderData) {
    return new Promise((resolve, reject) => {
        // Set up temporary handlers for this payment
        window.paypalResolve = resolve;
        window.paypalReject = reject;
        
        // PayPal button handles the actual payment flow
        // Resolution happens in handlePayPalSuccess or handlePayPalError
    });
}

// Handle successful PayPal payment
async function handlePayPalSuccess(orderDetails) {
    try {
        const result = {
            success: true,
            paymentId: orderDetails.id,
            orderId: orderDetails.purchase_units[0].reference_id,
            payerInfo: orderDetails.payer
        };

        if (window.paypalResolve) {
            window.paypalResolve(result);
        }

    } catch (error) {
        console.error('Error handling PayPal success:', error);
        handlePayPalError(error.message);
    }
}

// Handle PayPal errors
function handlePayPalError(errorMessage) {
    const error = {
        success: false,
        error: errorMessage
    };

    if (window.paypalReject) {
        window.paypalReject(error);
    }
}

// Handle PayPal cancellation
function handlePayPalCancel() {
    const error = {
        success: false,
        error: 'Payment was cancelled'
    };

    if (window.paypalReject) {
        window.paypalReject(error);
    }
}

// Create PayPal subscription
async function createPayPalSubscription(planId, orderData) {
    try {
        const response = await fetch('/api/paypal/create-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                planId: planId,
                subscriber: {
                    name: {
                        given_name: orderData.shipping.firstName,
                        surname: orderData.shipping.lastName
                    },
                    email_address: orderData.shipping.email,
                    shipping_address: {
                        name: {
                            full_name: `${orderData.shipping.firstName} ${orderData.shipping.lastName}`
                        },
                        address: {
                            address_line_1: orderData.shipping.address,
                            admin_area_2: orderData.shipping.city,
                            admin_area_1: orderData.shipping.state,
                            postal_code: orderData.shipping.zipCode,
                            country_code: orderData.shipping.country
                        }
                    }
                }
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create PayPal subscription');
        }

        return await response.json();

    } catch (error) {
        console.error('PayPal subscription error:', error);
        throw error;
    }
}

// Process PayPal refund
async function processPayPalRefund(captureId, amount = null) {
    try {
        const response = await fetch('/api/paypal/refund', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                captureId: captureId,
                amount: amount ? {
                    currency_code: 'USD',
                    value: amount.toFixed(2)
                } : null
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to process PayPal refund');
        }

        return await response.json();

    } catch (error) {
        console.error('PayPal refund error:', error);
        throw error;
    }
}

// Get PayPal order details
async function getPayPalOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/paypal/order/${orderId}`);
        
        if (!response.ok) {
            throw new Error('Failed to get PayPal order details');
        }

        return await response.json();

    } catch (error) {
        console.error('Error getting PayPal order details:', error);
        throw error;
    }
}

// Handle PayPal webhooks (server-side)
function handlePayPalWebhook(event) {
    switch (event.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
            console.log('PayPal payment completed:', event.resource);
            // Update order status in database
            break;
        case 'PAYMENT.CAPTURE.DENIED':
            console.log('PayPal payment denied:', event.resource);
            // Handle denied payment
            break;
        case 'BILLING.SUBSCRIPTION.CREATED':
            console.log('PayPal subscription created:', event.resource);
            // Handle subscription creation
            break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
            console.log('PayPal subscription cancelled:', event.resource);
            // Handle subscription cancellation
            break;
        default:
            console.log(`Unhandled PayPal event type ${event.event_type}`);
    }
}

// Validate PayPal payment data
function validatePayPalPayment(orderData) {
    const required = ['shipping', 'totals'];
    
    for (const field of required) {
        if (!orderData[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    if (!orderData.totals.total || orderData.totals.total <= 0) {
        throw new Error('Invalid payment amount');
    }

    return true;
}

// Format PayPal amount object
function formatPayPalAmount(amount, currency = 'USD') {
    return {
        currency_code: currency,
        value: amount.toFixed(2)
    };
}

// Setup PayPal Express Checkout
function setupPayPalExpress() {
    return window.paypal.Buttons({
        style: {
            layout: 'horizontal',
            color: 'gold',
            shape: 'pill',
            label: 'checkout'
        },
        
        createOrder: function(data, actions) {
            const cartData = window.cart ? window.cart.getCartData() : {};
            
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: cartData.total.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: 'USD',
                                value: cartData.subtotal.toFixed(2)
                            },
                            shipping: {
                                currency_code: 'USD',
                                value: cartData.shipping.toFixed(2)
                            },
                            tax_total: {
                                currency_code: 'USD',
                                value: cartData.tax.toFixed(2)
                            }
                        }
                    },
                    items: cartData.items.map(item => ({
                        name: item.title,
                        unit_amount: {
                            currency_code: 'USD',
                            value: item.price.toFixed(2)
                        },
                        quantity: item.quantity.toString(),
                        category: 'DIGITAL_GOODS'
                    }))
                }]
            });
        },
        
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(orderData) {
                // Redirect to checkout page with PayPal info
                window.location.href = `checkout.html?paypal=1&token=${data.orderID}`;
            });
        }
    });
}

// Make functions available globally
window.initializePayPal = initializePayPal;
window.processPayPalPayment = processPayPalPayment;
window.createPayPalSubscription = createPayPalSubscription;
window.processPayPalRefund = processPayPalRefund;
