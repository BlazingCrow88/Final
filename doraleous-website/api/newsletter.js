// File Location: /api/newsletter.js

const express = require('express');
const router = express.Router();
const { body, validationResult, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { requireAdmin } = require('./middleware');
const db = require('./database-config');
const emailService = require('../assets/js/email-service');

// Rate limiting for newsletter subscription
const subscriptionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 subscription attempts per 15 minutes
    message: 'Too many subscription attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

// Subscribe to newsletter
router.post('/subscribe', subscriptionLimiter, [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('first_name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be less than 50 characters'),
    body('preferences').optional().isObject().withMessage('Preferences must be an object'),
    body('source').optional().trim().isLength({ max: 50 }).withMessage('Source must be less than 50 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { email, first_name, preferences = {}, source = 'website' } = req.body;

        // Check if email is already subscribed
        const existing = await db.query(
            'SELECT id, status, unsubscribe_token FROM newsletter_subscribers WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            const subscriber = existing.rows[0];
            
            if (subscriber.status === 'active') {
                return res.status(400).json({ message: 'Email is already subscribed to our newsletter' });
            }
            
            if (subscriber.status === 'unsubscribed') {
                // Reactivate subscription
                await db.query(
                    'UPDATE newsletter_subscribers SET status = $1, subscribed_at = $2, preferences = $3, source = $4 WHERE id = $5',
                    ['pending', new Date(), JSON.stringify(preferences), source, subscriber.id]
                );

                // Send confirmation email
                try {
                    await emailService.sendNewsletterConfirmation(email, first_name, subscriber.unsubscribe_token);
                } catch (emailError) {
                    console.error('Error sending confirmation email:', emailError);
                }

                return res.json({ message: 'Please check your email to confirm your subscription' });
            }
        }

        // Generate unsubscribe token
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');

        // Create new subscription
        const query = `
            INSERT INTO newsletter_subscribers (
                email, first_name, status, preferences, source, 
                unsubscribe_token, ip_address
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;

        const values = [
            email,
            first_name || null,
            'pending',
            JSON.stringify(preferences),
            source,
            unsubscribeToken,
            req.ip || req.connection.remoteAddress
        ];

        const result = await db.query(query, values);

        // Send confirmation email
        try {
            await emailService.sendNewsletterConfirmation(email, first_name, unsubscribeToken);
        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Don't fail subscription if email fails
        }

        res.status(201).json({
            message: 'Thank you for subscribing! Please check your email to confirm your subscription.',
            subscriberId: result.rows[0].id
        });
    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Confirm newsletter subscription
router.get('/confirm/:token', [
    param('token').isLength({ min: 1 }).withMessage('Confirmation token is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid confirmation token', errors: errors.array() });
        }

        const { token } = req.params;

        // Find subscriber with this token
        const subscriber = await db.query(
            'SELECT id, email, first_name, status FROM newsletter_subscribers WHERE unsubscribe_token = $1',
            [token]
        );

        if (subscriber.rows.length === 0) {
            return res.status(404).json({ message: 'Invalid confirmation link' });
        }

        const sub = subscriber.rows[0];

        if (sub.status === 'active') {
            return res.json({ message: 'Email is already confirmed' });
        }

        // Activate subscription
        await db.query(
            'UPDATE newsletter_subscribers SET status = $1, confirmed_at = $2 WHERE id = $3',
            ['active', new Date(), sub.id]
        );

        // Send welcome email
        try {
            await emailService.sendNewsletterWelcome(sub.email, sub.first_name);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
        }

        res.json({ message: 'Thank you! Your subscription has been confirmed.' });
    } catch (error) {
        console.error('Error confirming subscription:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Unsubscribe from newsletter
router.get('/unsubscribe/:token', [
    param('token').isLength({ min: 1 }).withMessage('Unsubscribe token is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid unsubscribe token', errors: errors.array() });
        }

        const { token } = req.params;

        // Find subscriber with this token
        const subscriber = await db.query(
            'SELECT id, email, status FROM newsletter_subscribers WHERE unsubscribe_token = $1',
            [token]
        );

        if (subscriber.rows.length === 0) {
            return res.status(404).json({ message: 'Invalid unsubscribe link' });
        }

        const sub = subscriber.rows[0];

        if (sub.status === 'unsubscribed') {
            return res.json({ message: 'You are already unsubscribed' });
        }

        // Unsubscribe
        await db.query(
            'UPDATE newsletter_subscribers SET status = $1, unsubscribed_at = $2 WHERE id = $3',
            ['unsubscribed', new Date(), sub.id]
        );

        res.json({ message: 'You have been successfully unsubscribed from our newsletter' });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update subscription preferences
router.post('/preferences/:token', [
    param('token').isLength({ min: 1 }).withMessage('Token is required'),
    body('preferences').isObject().withMessage('Preferences must be an object'),
    body('frequency').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid frequency')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { token } = req.params;
        const { preferences, frequency } = req.body;

        // Find subscriber
        const subscriber = await db.query(
            'SELECT id, status FROM newsletter_subscribers WHERE unsubscribe_token = $1',
            [token]
        );

        if (subscriber.rows.length === 0) {
            return res.status(404).json({ message: 'Subscriber not found' });
        }

        const sub = subscriber.rows[0];

        if (sub.status !== 'active') {
            return res.status(400).json({ message: 'Subscription is not active' });
        }

        // Update preferences
        const updates = ['preferences = $2', 'updated_at = $3'];
        const values = [sub.id, JSON.stringify(preferences), new Date()];
        let paramIndex = 4;

        if (frequency) {
            updates.push(`frequency = $${paramIndex}`);
            values.push(frequency);
            paramIndex++;
        }

        const query = `UPDATE newsletter_subscribers SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
        const result = await db.query(query, values);

        res.json({
            message: 'Preferences updated successfully',
            preferences: JSON.parse(result.rows[0].preferences)
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all subscribers (admin only)
router.get('/subscribers', requireAdmin, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'pending', 'unsubscribed', 'bounced']),
    query('search').optional().trim(),
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601(),
    query('source').optional().trim(),
    query('sort').optional().isIn(['subscribed_at', 'email', 'first_name', 'status']),
    query('order').optional().isIn(['asc', 'desc'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid query parameters', errors: errors.array() });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const {
            status, search, date_from, date_to, source,
            sort = 'subscribed_at', order = 'desc'
        } = req.query;

        let query = `
            SELECT id, email, first_name, status, source, frequency,
                   subscribed_at, confirmed_at, unsubscribed_at, last_sent_at,
                   bounce_count, ip_address
            FROM newsletter_subscribers
            WHERE 1=1
        `;

        const queryParams = [];
        let paramIndex = 1;

        // Add filters
        if (status) {
            query += ` AND status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        if (search) {
            query += ` AND (LOWER(email) LIKE LOWER($${paramIndex}) OR LOWER(first_name) LIKE LOWER($${paramIndex}))`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (date_from) {
            query += ` AND subscribed_at >= $${paramIndex}`;
            queryParams.push(date_from);
            paramIndex++;
        }

        if (date_to) {
            query += ` AND subscribed_at <= $${paramIndex}`;
            queryParams.push(date_to);
            paramIndex++;
        }

        if (source) {
            query += ` AND source = $${paramIndex}`;
            queryParams.push(source);
            paramIndex++;
        }

        query += ` ORDER BY ${sort} ${order.toUpperCase()}`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const subscribers = await db.query(query, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM newsletter_subscribers WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;

        if (status) {
            countQuery += ` AND status = $${countParamIndex}`;
            countParams.push(status);
            countParamIndex++;
        }

        if (search) {
            countQuery += ` AND (LOWER(email) LIKE LOWER($${countParamIndex}) OR LOWER(first_name) LIKE LOWER($${countParamIndex}))`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        if (date_from) {
            countQuery += ` AND subscribed_at >= $${countParamIndex}`;
            countParams.push(date_from);
            countParamIndex++;
        }

        if (date_to) {
            countQuery += ` AND subscribed_at <= $${countParamIndex}`;
            countParams.push(date_to);
            countParamIndex++;
        }

        if (source) {
            countQuery += ` AND source = $${countParamIndex}`;
            countParams.push(source);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            subscribers: subscribers.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create newsletter campaign (admin only)
router.post('/campaigns', requireAdmin, [
    body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Subject is required and must be less than 200 characters'),
    body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
    body('template').optional().trim().isLength({ max: 50 }).withMessage('Template name must be less than 50 characters'),
    body('segment').optional().isIn(['all', 'active', 'recent']).withMessage('Invalid segment'),
    body('scheduled_at').optional().isISO8601().withMessage('Scheduled date must be valid'),
    body('test_recipients').optional().isArray().withMessage('Test recipients must be an array')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const {
            subject, content, template = 'default', segment = 'active',
            scheduled_at, test_recipients = []
        } = req.body;

        // Create campaign
        const query = `
            INSERT INTO newsletter_campaigns (
                subject, content, template, segment, status,
                scheduled_at, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const status = scheduled_at ? 'scheduled' : 'draft';
        const values = [
            subject, content, template, segment, status,
            scheduled_at || null, req.user.id
        ];

        const result = await db.query(query, values);
        const campaign = result.rows[0];

        // Send test emails if provided
        if (test_recipients.length > 0) {
            try {
                await emailService.sendNewsletterTest(campaign, test_recipients);
            } catch (emailError) {
                console.error('Error sending test emails:', emailError);
            }
        }

        res.status(201).json({
            message: 'Newsletter campaign created successfully',
            campaign
        });
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Send newsletter campaign (admin only)
router.post('/campaigns/:id/send', requireAdmin, [
    param('id').isInt().withMessage('Campaign ID must be an integer')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid campaign ID', errors: errors.array() });
        }

        const { id } = req.params;

        // Get campaign
        const campaign = await db.query('SELECT * FROM newsletter_campaigns WHERE id = $1', [id]);
        
        if (campaign.rows.length === 0) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        const campaignData = campaign.rows[0];

        if (campaignData.status === 'sent') {
            return res.status(400).json({ message: 'Campaign has already been sent' });
        }

        if (campaignData.status === 'sending') {
            return res.status(400).json({ message: 'Campaign is currently being sent' });
        }

        // Update campaign status
        await db.query(
            'UPDATE newsletter_campaigns SET status = $1, sent_at = $2 WHERE id = $3',
            ['sending', new Date(), id]
        );

        // Get subscribers based on segment
        let subscriberQuery = "SELECT email, first_name, unsubscribe_token FROM newsletter_subscribers WHERE status = 'active'";
        
        if (campaignData.segment === 'recent') {
            subscriberQuery += " AND subscribed_at >= CURRENT_DATE - INTERVAL '30 days'";
        }

        const subscribers = await db.query(subscriberQuery);

        // Send emails (in background)
        setImmediate(async () => {
            try {
                let sentCount = 0;
                let failedCount = 0;

                for (const subscriber of subscribers.rows) {
                    try {
                        await emailService.sendNewsletter(campaignData, subscriber);
                        sentCount++;
                        
                        // Update last sent date
                        await db.query(
                            'UPDATE newsletter_subscribers SET last_sent_at = $1 WHERE email = $2',
                            [new Date(), subscriber.email]
                        );
                    } catch (emailError) {
                        console.error(`Error sending to ${subscriber.email}:`, emailError);
                        failedCount++;
                    }

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                // Update campaign with results
                await db.query(
                    'UPDATE newsletter_campaigns SET status = $1, sent_count = $2, failed_count = $3 WHERE id = $4',
                    ['sent', sentCount, failedCount, id]
                );

                console.log(`Campaign ${id} sent: ${sentCount} successful, ${failedCount} failed`);
            } catch (error) {
                console.error('Error in background email sending:', error);
                await db.query(
                    'UPDATE newsletter_campaigns SET status = $1 WHERE id = $2',
                    ['failed', id]
                );
            }
        });

        res.json({ message: 'Newsletter campaign is being sent' });
    } catch (error) {
        console.error('Error sending campaign:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get newsletter statistics (admin only)
router.get('/stats/overview', requireAdmin, async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_subscribers,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscribers,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_subscribers,
                COUNT(CASE WHEN status = 'unsubscribed' THEN 1 END) as unsubscribed_subscribers,
                COUNT(CASE WHEN subscribed_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_subscribers_30_days,
                COUNT(CASE WHEN unsubscribed_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as unsubscribed_30_days
            FROM newsletter_subscribers
        `);

        const campaignStats = await db.query(`
            SELECT 
                COUNT(*) as total_campaigns,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_campaigns,
                SUM(sent_count) as total_emails_sent,
                AVG(sent_count) as avg_emails_per_campaign
            FROM newsletter_campaigns
        `);

        res.json({ 
            stats: {
                ...stats.rows[0],
                ...campaignStats.rows[0]
            }
        });
    } catch (error) {
        console.error('Error fetching newsletter stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
