/* ===================================
   STRIPE PAYMENT INTEGRATION
   File: assets/js/stripe-integration.js
   =================================== */

let stripe;
let elements;
let cardElement;

// Initialize Stripe
function initializeStripe() {
    // Replace with your actual Stripe publishable key
    const stripePublishableKey = 'pk_test_your_stripe_publishable_key_here';
    
    stripe = Stripe(stripePublishableKey);
    elements = stripe.elements();

    // Create card element
    cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            invalid: {
                color: '#9e2146',
            },
        },
    });

    // Mount card element
    const cardElementContainer = document.getElementById('card-element');
    if (cardElementContainer) {
        cardElement.mount('#card-element');
    }

    // Handle real-time validation errors from the card Element
    cardElement.on('change', ({error}) => {
        const displayError = document.getElementById('card-errors');
        if (error) {
            displayError.textContent = error.message;
        } else {
            displayError.textContent = '';
        }
    });
}

// Process Stripe payment
async function processStripePayment(orderData) {
    try {
        // Create payment intent on server
        const paymentIntentResponse = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: Math.round(orderData.totals.total * 100), // Convert to cents
                currency: 'usd',
                orderData: orderData
            }),
        });

        if (!paymentIntentResponse.ok) {
            throw new Error('Failed to create payment intent');
        }

        const {clientSecret} = await paymentIntentResponse.json();

        // Confirm payment with Stripe
        const {error, paymentIntent} = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: `${orderData.shipping.firstName} ${orderData.shipping.lastName}`,
                    email: orderData.shipping.email,
                    address: {
                        line1: orderData.shipping.address,
                        city: orderData.shipping.city,
                        state: orderData.shipping.state,
                        postal_code: orderData.shipping.zipCode,
                        country: orderData.shipping.country,
                    },
                },
            },
        });

        if (error) {
            throw new Error(error.message);
        }

        if (paymentIntent.status === 'succeeded') {
            return {
                success: true,
                paymentId: paymentIntent.id,
                orderId: paymentIntent.metadata.orderId
            };
        } else {
            throw new Error('Payment was not successful');
        }

    } catch (error) {
        console.error('Stripe payment error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Handle 3D Secure authentication if required
async function handle3DSecure(paymentIntent) {
    if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_source_action') {
        const {error, paymentIntent: updatedPaymentIntent} = await stripe.handleCardAction(
            paymentIntent.client_secret
        );

        if (error) {
            throw new Error(error.message);
        }

        return updatedPaymentIntent;
    }
    
    return paymentIntent;
}

// Validate card element
function validateStripeCard() {
    return new Promise((resolve) => {
        stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        }).then((result) => {
            if (result.error) {
                resolve(false);
                document.getElementById('card-errors').textContent = result.error.message;
            } else {
                resolve(true);
                document.getElementById('card-errors').textContent = '';
            }
        });
    });
}

// Format currency for display
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}

// Handle Stripe webhook events (this would be server-side)
function handleStripeWebhook(event) {
    switch (event.type) {
        case 'payment_intent.succeeded':
            console.log('Payment succeeded:', event.data.object);
            // Update order status in database
            break;
        case 'payment_intent.payment_failed':
            console.log('Payment failed:', event.data.object);
            // Handle failed payment
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
}

// Create customer in Stripe (for returning customers)
async function createStripeCustomer(customerData) {
    try {
        const response = await fetch('/api/create-customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData),
        });

        if (!response.ok) {
            throw new Error('Failed to create customer');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating customer:', error);
        throw error;
    }
}

// Save payment method for future use
async function savePaymentMethod(customerId, paymentMethodId) {
    try {
        const response = await fetch('/api/save-payment-method', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerId,
                paymentMethodId,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to save payment method');
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving payment method:', error);
        throw error;
    }
}

// Retrieve saved payment methods
async function getCustomerPaymentMethods(customerId) {
    try {
        const response = await fetch(`/api/customer-payment-methods/${customerId}`);
        
        if (!response.ok) {
            throw new Error('Failed to retrieve payment methods');
        }

        return await response.json();
    } catch (error) {
        console.error('Error retrieving payment methods:', error);
        throw error;
    }
}

// Handle recurring payments/subscriptions
async function createSubscription(customerId, priceId) {
    try {
        const response = await fetch('/api/create-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerId,
                priceId,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create subscription');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating subscription:', error);
        throw error;
    }
}

// Process refund
async function processRefund(paymentIntentId, amount = null) {
    try {
        const response = await fetch('/api/process-refund', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentIntentId,
                amount: amount ? Math.round(amount * 100) : null, // Convert to cents if partial refund
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to process refund');
        }

        return await response.json();
    } catch (error) {
        console.error('Error processing refund:', error);
        throw error;
    }
}

// Make functions available globally
window.initializeStripe = initializeStripe;
window.processStripePayment = processStripePayment;
window.validateStripeCard = validateStripeCard;
window.formatCurrency = formatCurrency;
