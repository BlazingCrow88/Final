// File Location: /api/contact.js

const express = require('express');
const router = express.Router();
const { body, validationResult, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { requireAdmin } = require('./middleware');
const db = require('./database-config');
const emailService = require('../assets/js/email-service');

// Rate limiting for contact form
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 contact form submissions per 15 minutes
    message: 'Too many contact form submissions, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

// Submit contact form
router.post('/submit', contactLimiter, [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Subject is required and must be less than 200 characters'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters'),
    body('phone').optional().trim().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number format'),
    body('company').optional().trim().isLength({ max: 100 }).withMessage('Company name must be less than 100 characters'),
    body('inquiry_type').optional().isIn(['general', 'support', 'sales', 'partnership', 'media', 'other']).withMessage('Invalid inquiry type')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const {
            name, email, subject, message, phone, company,
            inquiry_type = 'general'
        } = req.body;

        // Get client IP for tracking
        const clientIp = req.ip || req.connection.remoteAddress;

        // Store contact submission in database
        const query = `
            INSERT INTO contact_submissions (
                name, email, subject, message, phone, company,
                inquiry_type, ip_address, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, created_at
        `;

        const values = [
            name, email, subject, message,
            phone || null, company || null,
            inquiry_type, clientIp, 'new'
        ];

        const result = await db.query(query, values);
        const submissionId = result.rows[0].id;

        // Send notification email to admin
        try {
            await emailService.sendContactNotification({
                submissionId,
                name,
                email,
                subject,
                message,
                phone,
                company,
                inquiry_type,
                created_at: result.rows[0].created_at
            });
        } catch (emailError) {
            console.error('Error sending contact notification:', emailError);
            // Don't fail the submission if email fails
        }

        // Send auto-reply to user
        try {
            await emailService.sendContactAutoReply(email, name, subject, submissionId);
        } catch (emailError) {
            console.error('Error sending auto-reply email:', emailError);
        }

        res.status(201).json({
            message: 'Thank you for your message. We will get back to you soon!',
            submissionId
        });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all contact submissions (admin only)
router.get('/submissions', requireAdmin, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['new', 'in_progress', 'resolved', 'closed']),
    query('inquiry_type').optional().isIn(['general', 'support', 'sales', 'partnership', 'media', 'other']),
    query('search').optional().trim(),
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601(),
    query('sort').optional().isIn(['created_at', 'name', 'email', 'subject', 'status']),
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
            status, inquiry_type, search, date_from, date_to,
            sort = 'created_at', order = 'desc'
        } = req.query;

        let query = `
            SELECT cs.*, u.first_name as resolved_by_name
            FROM contact_submissions cs
            LEFT JOIN users u ON cs.resolved_by = u.id
            WHERE 1=1
        `;

        const queryParams = [];
        let paramIndex = 1;

        // Add filters
        if (status) {
            query += ` AND cs.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        if (inquiry_type) {
            query += ` AND cs.inquiry_type = $${paramIndex}`;
            queryParams.push(inquiry_type);
            paramIndex++;
        }

        if (search) {
            query += ` AND (LOWER(cs.name) LIKE LOWER($${paramIndex}) OR LOWER(cs.email) LIKE LOWER($${paramIndex}) OR LOWER(cs.subject) LIKE LOWER($${paramIndex}) OR LOWER(cs.message) LIKE LOWER($${paramIndex}))`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (date_from) {
            query += ` AND cs.created_at >= $${paramIndex}`;
            queryParams.push(date_from);
            paramIndex++;
        }

        if (date_to) {
            query += ` AND cs.created_at <= $${paramIndex}`;
            queryParams.push(date_to);
            paramIndex++;
        }

        query += ` ORDER BY cs.${sort} ${order.toUpperCase()}`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const submissions = await db.query(query, queryParams);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total
            FROM contact_submissions cs
            WHERE 1=1
        `;

        const countParams = [];
        let countParamIndex = 1;

        if (status) {
            countQuery += ` AND cs.status = $${countParamIndex}`;
            countParams.push(status);
            countParamIndex++;
        }

        if (inquiry_type) {
            countQuery += ` AND cs.inquiry_type = $${countParamIndex}`;
            countParams.push(inquiry_type);
            countParamIndex++;
        }

        if (search) {
            countQuery += ` AND (LOWER(cs.name) LIKE LOWER($${countParamIndex}) OR LOWER(cs.email) LIKE LOWER($${countParamIndex}) OR LOWER(cs.subject) LIKE LOWER($${countParamIndex}) OR LOWER(cs.message) LIKE LOWER($${countParamIndex}))`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        if (date_from) {
            countQuery += ` AND cs.created_at >= $${countParamIndex}`;
            countParams.push(date_from);
            countParamIndex++;
        }

        if (date_to) {
            countQuery += ` AND cs.created_at <= $${countParamIndex}`;
            countParams.push(date_to);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            submissions: submissions.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching contact submissions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get single contact submission (admin only)
router.get('/submissions/:id', requireAdmin, [
    param('id').isInt().withMessage('Submission ID must be an integer')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid submission ID', errors: errors.array() });
        }

        const { id } = req.params;

        const query = `
            SELECT cs.*, 
                   u1.first_name as resolved_by_name,
                   u2.first_name as assigned_to_name
            FROM contact_submissions cs
            LEFT JOIN users u1 ON cs.resolved_by = u1.id
            LEFT JOIN users u2 ON cs.assigned_to = u2.id
            WHERE cs.id = $1
        `;

        const submission = await db.query(query, [id]);

        if (submission.rows.length === 0) {
            return res.status(404).json({ message: 'Contact submission not found' });
        }

        // Get submission notes
        const notesQuery = `
            SELECT csn.*, u.first_name, u.last_name
            FROM contact_submission_notes csn
            JOIN users u ON csn.created_by = u.id
            WHERE csn.submission_id = $1
            ORDER BY csn.created_at DESC
        `;

        const notes = await db.query(notesQuery, [id]);

        res.json({
            submission: submission.rows[0],
            notes: notes.rows
        });
    } catch (error) {
        console.error('Error fetching contact submission:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update contact submission status (admin only)
router.patch('/submissions/:id/status', requireAdmin, [
    param('id').isInt().withMessage('Submission ID must be an integer'),
    body('status').isIn(['new', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
    body('assigned_to').optional().isInt().withMessage('Assigned to must be a user ID'),
    body('resolution_notes').optional().trim().isLength({ max: 1000 }).withMessage('Resolution notes must be less than 1000 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { id } = req.params;
        const { status, assigned_to, resolution_notes } = req.body;

        // Check if submission exists
        const existingSubmission = await db.query('SELECT * FROM contact_submissions WHERE id = $1', [id]);
        if (existingSubmission.rows.length === 0) {
            return res.status(404).json({ message: 'Contact submission not found' });
        }

        const updates = ['status = $2', 'updated_at = $3'];
        const values = [id, status, new Date()];
        let paramIndex = 4;

        if (assigned_to !== undefined) {
            updates.push(`assigned_to = $${paramIndex}`);
            values.push(assigned_to);
            paramIndex++;
        }

        if (status === 'resolved' || status === 'closed') {
            updates.push(`resolved_by = $${paramIndex}`, `resolved_at = $${paramIndex + 1}`);
            values.push(req.user.id, new Date());
            paramIndex += 2;

            if (resolution_notes) {
                updates.push(`resolution_notes = $${paramIndex}`);
                values.push(resolution_notes);
                paramIndex++;
            }
        }

        const query = `UPDATE contact_submissions SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
        const result = await db.query(query, values);

        // Log status change
        await db.query(
            'INSERT INTO contact_submission_notes (submission_id, note, created_by) VALUES ($1, $2, $3)',
            [id, `Status changed to: ${status}`, req.user.id]
        );

        res.json({
            message: 'Contact submission updated successfully',
            submission: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating contact submission:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add note to contact submission (admin only)
router.post('/submissions/:id/notes', requireAdmin, [
    param('id').isInt().withMessage('Submission ID must be an integer'),
    body('note').trim().isLength({ min: 1, max: 1000 }).withMessage('Note is required and must be less than 1000 characters'),
    body('is_internal').optional().isBoolean().withMessage('is_internal must be a boolean')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { id } = req.params;
        const { note, is_internal = true } = req.body;

        // Check if submission exists
        const submission = await db.query('SELECT id FROM contact_submissions WHERE id = $1', [id]);
        if (submission.rows.length === 0) {
            return res.status(404).json({ message: 'Contact submission not found' });
        }

        const query = `
            INSERT INTO contact_submission_notes (submission_id, note, created_by, is_internal)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const result = await db.query(query, [id, note, req.user.id, is_internal]);

        res.status(201).json({
            message: 'Note added successfully',
            note: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Reply to contact submission (admin only)
router.post('/submissions/:id/reply', requireAdmin, [
    param('id').isInt().withMessage('Submission ID must be an integer'),
    body('reply_message').trim().isLength({ min: 1, max: 2000 }).withMessage('Reply message is required and must be less than 2000 characters'),
    body('reply_subject').optional().trim().isLength({ max: 200 }).withMessage('Reply subject must be less than 200 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { id } = req.params;
        const { reply_message, reply_subject } = req.body;

        // Get submission details
        const submissionQuery = await db.query(
            'SELECT * FROM contact_submissions WHERE id = $1',
            [id]
        );

        if (submissionQuery.rows.length === 0) {
            return res.status(404).json({ message: 'Contact submission not found' });
        }

        const submission = submissionQuery.rows[0];

        // Generate reply subject if not provided
        const finalSubject = reply_subject || `Re: ${submission.subject}`;

        // Send reply email
        try {
            await emailService.sendContactReply(
                submission.email,
                submission.name,
                finalSubject,
                reply_message,
                submission.id
            );

            // Log the reply
            await db.query(
                'INSERT INTO contact_submission_notes (submission_id, note, created_by, is_internal) VALUES ($1, $2, $3, $4)',
                [id, `Reply sent: ${reply_message}`, req.user.id, false]
            );

            // Update submission status if it's still new
            if (submission.status === 'new') {
                await db.query(
                    'UPDATE contact_submissions SET status = $1, updated_at = $2 WHERE id = $3',
                    ['in_progress', new Date(), id]
                );
            }

            res.json({ message: 'Reply sent successfully' });
        } catch (emailError) {
            console.error('Error sending reply email:', emailError);
            res.status(500).json({ message: 'Failed to send reply email' });
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get contact statistics (admin only)
router.get('/stats/overview', requireAdmin, async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_submissions,
                COUNT(CASE WHEN status = 'new' THEN 1 END) as new_submissions,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_submissions,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_submissions,
                COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_submissions,
                COUNT(CASE WHEN inquiry_type = 'general' THEN 1 END) as general_inquiries,
                COUNT(CASE WHEN inquiry_type = 'support' THEN 1 END) as support_inquiries,
                COUNT(CASE WHEN inquiry_type = 'sales' THEN 1 END) as sales_inquiries
            FROM contact_submissions
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        `);

        const responseTime = await db.query(`
            SELECT 
                AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_response_time_hours
            FROM contact_submissions
            WHERE resolved_at IS NOT NULL 
            AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        `);

        res.json({ 
            stats: {
                ...stats.rows[0],
                avg_response_time_hours: parseFloat(responseTime.rows[0].avg_response_time_hours) || 0
            }
        });
    } catch (error) {
        console.error('Error fetching contact stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Check if there are new contact submissions (admin only)
router.get('/stats/new-count', requireAdmin, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT COUNT(*) as new_count FROM contact_submissions WHERE status = 'new'"
        );

        res.json({ newCount: parseInt(result.rows[0].new_count) });
    } catch (error) {
        console.error('Error fetching new contact count:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
