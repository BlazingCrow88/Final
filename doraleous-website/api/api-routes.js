// File Location: /api/api-routes.js

const express = require('express');
const { ContactFormHandler, NewsletterHandler, db } = require('../config/database-config');
const { rateLimiter } = require('./middleware/rate-limiter');

const router = express.Router();

// API Information endpoint
router.get('/', (req, res) => {
    res.json({
        name: 'Brian M. Shoemaker Author Website API',
        version: '1.0.0',
        description: 'API for author promotional website',
        author: 'Brian M. Shoemaker',
        book: 'Doraleous and Associates: A Tale of Glory',
        endpoints: {
            contact: {
                'POST /api/contact/submit': 'Submit contact form'
            },
            newsletter: {
                'POST /api/newsletter/subscribe': 'Subscribe to newsletter',
                'GET /api/newsletter/confirm/:token': 'Confirm subscription',
                'POST /api/newsletter/unsubscribe': 'Unsubscribe from newsletter'
            },
            reviews: {
                'POST /api/reviews/submit': 'Submit book review',
                'GET /api/reviews': 'Get approved reviews'
            },
            blog: {
                'GET /api/blog/posts': 'Get blog posts',
                'GET /api/blog/posts/:slug': 'Get single blog post'
            },
            analytics: {
                'POST /api/analytics/event': 'Track analytics event'
            }
        },
        status: 'operational'
    });
});

// Contact Form Routes
router.post('/contact/submit', rateLimiter.contact, async (req, res) => {
    try {
        const result = await ContactFormHandler.submitForm(req.body, req);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Your message has been sent successfully! We\'ll get back to you soon.',
                submissionId: result.submissionId
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to send message. Please try again later.'
        });
    }
});

// Newsletter Routes
router.post('/newsletter/subscribe', rateLimiter.newsletter, async (req, res) => {
    try {
        const { email, firstName, lastName } = req.body;
        
        const result = await NewsletterHandler.subscribe(
            email, 
            firstName, 
            lastName, 
            'website_signup', 
            req
        );
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Successfully subscribed! Please check your email to confirm.',
                subscriberId: result.subscriberId
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to subscribe. Please try again later.'
        });
    }
});

router.get('/newsletter/confirm/:token', async (req, res) => {
    try {
        const result = await NewsletterHandler.confirmSubscription(req.params.token);
        
        if (result.success) {
            res.redirect('/newsletter-confirmed.html?status=success');
        } else {
            res.redirect('/newsletter-confirmed.html?status=error');
        }
    } catch (error) {
        console.error('Newsletter confirmation error:', error);
        res.redirect('/newsletter-confirmed.html?status=error');
    }
});

router.post('/newsletter/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body;
        const result = await NewsletterHandler.unsubscribe(email);
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to unsubscribe. Please try again later.'
        });
    }
});

// Book Reviews Routes
router.post('/reviews/submit', rateLimiter.general, async (req, res) => {
    try {
        const {
            reviewerName,
            reviewerLocation,
            reviewerEmail,
            bookTitle,
            rating,
            reviewTitle,
            reviewText,
            verifiedPurchase
        } = req.body;

        // Validate required fields
        if (!reviewerName || !bookTitle || !rating || !reviewTitle || !reviewText) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const query = `
            INSERT INTO book_reviews 
            (reviewer_name, reviewer_location, reviewer_email, book_title, rating, 
             review_title, review_text, verified_purchase, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, created_at
        `;

        const values = [
            reviewerName,
            reviewerLocation || null,
            reviewerEmail || null,
            bookTitle,
            rating,
            reviewTitle,
            reviewText,
            verifiedPurchase || false,
            req.ip,
            req.get('User-Agent')
        ];

        const result = await db.query(query, values);

        res.status(200).json({
            success: true,
            message: 'Review submitted successfully! It will be published after moderation.',
            reviewId: result.rows[0].id
        });

    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to submit review. Please try again later.'
        });
    }
});

router.get('/reviews', async (req, res) => {
    try {
        const { book = 'Doraleous and Associates: A Tale of Glory', limit = 10, status = 'approved' } = req.query;

        const query = `
            SELECT reviewer_name, reviewer_location, rating, review_title, 
                   review_text, helpful_votes, submitted_at
            FROM book_reviews 
            WHERE book_title = $1 AND status = $2
            ORDER BY 
                CASE WHEN status = 'featured' THEN 1 ELSE 2 END,
                helpful_votes DESC,
                submitted_at DESC
            LIMIT $3
        `;

        const result = await db.query(query, [book, status, limit]);

        res.status(200).json({
            success: true,
            reviews: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('Reviews fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to fetch reviews'
        });
    }
});

// Blog Routes (if you have a blog)
router.get('/blog/posts', async (req, res) => {
    try {
        // Since this is a static site, you might not need this
        // But here's a simple implementation if you add blog functionality later
        res.status(200).json({
            success: true,
            message: 'Blog API not implemented - using static blog pages',
            posts: []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Blog API error'
        });
    }
});

// Analytics Event Tracking
router.post('/analytics/event', rateLimiter.analytics, async (req, res) => {
    try {
        const {
            eventType,
            eventData,
            pageUrl,
            referrerUrl,
            userSession
        } = req.body;

        if (!eventType) {
            return res.status(400).json({
                success: false,
                message: 'Event type is required'
            });
        }

        const query = `
            INSERT INTO analytics_events 
            (event_type, event_data, page_url, referrer_url, user_session, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;

        const values = [
            eventType,
            JSON.stringify(eventData || {}),
            pageUrl || req.get('Referer'),
            referrerUrl,
            userSession,
            req.ip,
            req.get('User-Agent')
        ];

        await db.query(query, values);

        res.status(200).json({
            success: true,
            message: 'Event tracked successfully'
        });

    } catch (error) {
        console.error('Analytics tracking error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to track event'
        });
    }
});

// Simple stats endpoint (public data only)
router.get('/stats', async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM contact_submissions WHERE status != 'archived') as total_contacts,
                (SELECT COUNT(*) FROM newsletter_subscribers WHERE confirmed = true) as newsletter_subscribers,
                (SELECT COUNT(*) FROM book_reviews WHERE status = 'approved') as approved_reviews,
                (SELECT ROUND(AVG(rating), 1) FROM book_reviews WHERE status = 'approved') as average_rating
        `);

        res.status(200).json({
            success: true,
            stats: stats.rows[0],
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to fetch statistics'
        });
    }
});

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected'
        });
    }
});

module.exports = router;
