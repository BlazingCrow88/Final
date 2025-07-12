// File Location: /api/users.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { authenticateToken, requireAdmin } = require('./middleware');
const db = require('./database-config');
const emailService = require('../assets/js/email-service');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset requests per hour
    message: 'Too many password reset attempts, please try again later'
});

// User registration
router.post('/register', authLimiter, [
    body('first_name').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required and must be less than 50 characters'),
    body('last_name').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required and must be less than 50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('phone').optional().trim().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number format'),
    body('date_of_birth').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { first_name, last_name, email, password, phone, date_of_birth } = req.body;

        // Check if user already exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate email verification token
        const verificationToken = jwt.sign(
            { email, type: 'email_verification' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Create user
        const query = `
            INSERT INTO users (
                first_name, last_name, email, password, phone, date_of_birth,
                email_verification_token, role, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, first_name, last_name, email, role, status, created_at
        `;

        const values = [
            first_name, last_name, email, hashedPassword,
            phone || null, date_of_birth || null,
            verificationToken, 'user', 'pending_verification'
        ];

        const result = await db.query(query, values);
        const user = result.rows[0];

        // Send verification email
        try {
            await emailService.sendVerificationEmail(email, verificationToken, first_name);
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// User login
router.post('/login', authLimiter, [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const userResult = await db.query(
            'SELECT id, first_name, last_name, email, password, role, status, email_verified_at FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        // Check if account is active
        if (user.status === 'suspended') {
            return res.status(403).json({ message: 'Account suspended. Please contact support.' });
        }

        if (user.status === 'deleted') {
            return res.status(403).json({ message: 'Account not found' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { id: user.id, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Store refresh token
        await db.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
        );

        // Update last login
        await db.query('UPDATE users SET last_login = $1 WHERE id = $2', [new Date(), user.id]);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                status: user.status,
                email_verified: !!user.email_verified_at
            },
            token: accessToken,
            refreshToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Refresh token
router.post('/refresh', [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { refreshToken } = req.body;

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Check if token exists in database
        const tokenResult = await db.query(
            'SELECT rt.*, u.email, u.role FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token = $1 AND rt.expires_at > $2',
            [refreshToken, new Date()]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const tokenData = tokenResult.rows[0];

        // Generate new access token
        const accessToken = jwt.sign(
            { id: tokenData.user_id, email: tokenData.email, role: tokenData.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Generate new refresh token
        const newRefreshToken = jwt.sign(
            { id: tokenData.user_id, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Update refresh token in database
        await db.query(
            'UPDATE refresh_tokens SET token = $1, expires_at = $2 WHERE id = $3',
            [newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), tokenData.id]
        );

        res.json({
            token: accessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        // Remove refresh tokens for this user
        await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);

        // Add token to blacklist (optional - for extra security)
        try {
            await db.query(
                'INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2)',
                [token, new Date(Date.now() + 60 * 60 * 1000)] // 1 hour
            );
        } catch (blacklistError) {
            // Ignore blacklist errors
        }

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT id, first_name, last_name, email, phone, date_of_birth,
                   role, status, email_verified_at, created_at, last_login
            FROM users WHERE id = $1
        `;

        const result = await db.query(query, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            user: {
                ...user,
                email_verified: !!user.email_verified_at
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, [
    body('first_name').optional().trim().isLength({ min: 1, max: 50 }),
    body('last_name').optional().trim().isLength({ min: 1, max: 50 }),
    body('phone').optional().trim().matches(/^\+?[\d\s\-\(\)]+$/),
    body('date_of_birth').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        // Build dynamic update query
        for (const [key, value] of Object.entries(req.body)) {
            if (value !== undefined && ['first_name', 'last_name', 'phone', 'date_of_birth'].includes(key)) {
                updates.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        updates.push(`updated_at = $${paramIndex}`);
        values.push(new Date());
        values.push(req.user.id);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex + 1} RETURNING id, first_name, last_name, email, phone, date_of_birth`;
        const result = await db.query(query, values);

        res.json({
            message: 'Profile updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Change password
router.put('/change-password', authenticateToken, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;

        // Get current password hash
        const userResult = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.rows[0];

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await db.query(
            'UPDATE users SET password = $1, updated_at = $2 WHERE id = $3',
            [hashedNewPassword, new Date(), req.user.id]
        );

        // Invalidate all refresh tokens
        await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);

        res.json({ message: 'Password changed successfully. Please log in again.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Request password reset
router.post('/reset-password', passwordResetLimiter, [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { email } = req.body;

        // Check if user exists
        const userResult = await db.query('SELECT id, first_name FROM users WHERE email = $1', [email]);
        
        // Always return success to prevent email enumeration
        if (userResult.rows.length === 0) {
            return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        const user = userResult.rows[0];

        // Generate reset token
        const resetToken = jwt.sign(
            { id: user.id, email, type: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Store reset token
        await db.query(
            'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
            [resetToken, new Date(Date.now() + 60 * 60 * 1000), user.id]
        );

        // Send reset email
        try {
            await emailService.sendPasswordResetEmail(email, resetToken, user.first_name);
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);
        }

        res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Verify email
router.post('/verify-email', [
    body('token').notEmpty().withMessage('Verification token is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { token } = req.body;

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'email_verification') {
            return res.status(400).json({ message: 'Invalid verification token' });
        }

        // Find user with this token
        const userResult = await db.query(
            'SELECT id FROM users WHERE email = $1 AND email_verification_token = $2',
            [decoded.email, token]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Update user as verified
        await db.query(
            'UPDATE users SET email_verified_at = $1, email_verification_token = NULL, status = $2 WHERE id = $3',
            [new Date(), 'active', userResult.rows[0].id]
        );

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all users (admin only)
router.get('/', requireAdmin, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('role').optional().isIn(['user', 'moderator', 'admin', 'super_admin']),
    query('status').optional().isIn(['active', 'pending_verification', 'suspended', 'deleted'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid query parameters', errors: errors.array() });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { search, role, status } = req.query;

        let query = `
            SELECT id, first_name, last_name, email, role, status,
                   email_verified_at, created_at, last_login
            FROM users
            WHERE 1=1
        `;

        const queryParams = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND (LOWER(first_name) LIKE LOWER($${paramIndex}) OR LOWER(last_name) LIKE LOWER($${paramIndex}) OR LOWER(email) LIKE LOWER($${paramIndex}))`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (role) {
            query += ` AND role = $${paramIndex}`;
            queryParams.push(role);
            paramIndex++;
        }

        if (status) {
            query += ` AND status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const users = await db.query(query, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;

        if (search) {
            countQuery += ` AND (LOWER(first_name) LIKE LOWER($${countParamIndex}) OR LOWER(last_name) LIKE LOWER($${countParamIndex}) OR LOWER(email) LIKE LOWER($${countParamIndex}))`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        if (role) {
            countQuery += ` AND role = $${countParamIndex}`;
            countParams.push(role);
            countParamIndex++;
        }

        if (status) {
            countQuery += ` AND status = $${countParamIndex}`;
            countParams.push(status);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            users: users.rows.map(user => ({
                ...user,
                email_verified: !!user.email_verified_at
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user role/status (admin only)
router.patch('/:id', requireAdmin, [
    param('id').isInt().withMessage('User ID must be an integer'),
    body('role').optional().isIn(['user', 'moderator', 'admin']),
    body('status').optional().isIn(['active', 'suspended', 'deleted'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { id } = req.params;
        const { role, status } = req.body;

        // Prevent users from modifying super_admin accounts
        if (req.user.role !== 'super_admin') {
            const targetUser = await db.query('SELECT role FROM users WHERE id = $1', [id]);
            if (targetUser.rows.length > 0 && targetUser.rows[0].role === 'super_admin') {
                return res.status(403).json({ message: 'Cannot modify super admin accounts' });
            }
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (role) {
            updates.push(`role = $${paramIndex}`);
            values.push(role);
            paramIndex++;
        }

        if (status) {
            updates.push(`status = $${paramIndex}`);
            values.push(status);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        updates.push(`updated_at = $${paramIndex}`);
        values.push(new Date());
        values.push(id);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex + 1} RETURNING id, first_name, last_name, email, role, status`;
        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'User updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
