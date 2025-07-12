/* ===================================
   DATABASE CONFIGURATION
   File: config/database-config.js
   =================================== */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Database Configuration for Brian M. Shoemaker Author Website
 * 
 * This file contains database connection settings and configuration
 * for the author website's backend functionality including:
 * - Contact form submissions
 * - Newsletter subscriptions
 * - Blog comments
 * - Review submissions
 * - Analytics data
 */

// Environment-based configuration
const environment = process.env.NODE_ENV || 'development';

// Database configuration based on environment
const getDatabaseConfig = () => {
    switch (environment) {
        case 'production':
            return {
                host: process.env.DB_HOST || 'localhost',
                database: process.env.DB_NAME || 'brianmshoemaker_prod',
                user: process.env.DB_USER || '',
                password: process.env.DB_PASS || '',
                port: process.env.DB_PORT || 5432,
                ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
                max: 20, // Maximum number of clients in the pool
                idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
                connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
            };
            
        case 'staging':
            return {
                host: process.env.DB_HOST || 'localhost',
                database: process.env.DB_NAME || 'brianmshoemaker_staging',
                user: process.env.DB_USER || '',
                password: process.env.DB_PASS || '',
                port: process.env.DB_PORT || 5432,
                ssl: false,
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            };
            
        default: // development
            return {
                host: 'localhost',
                database: 'brianmshoemaker_dev',
                user: 'postgres',
                password: '',
                port: 5432,
                ssl: false,
                max: 5,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            };
    }
};

/**
 * Database connection singleton
 */
class DatabaseConnection {
    constructor() {
        if (DatabaseConnection.instance) {
            return DatabaseConnection.instance;
        }
        
        this.pool = new Pool(getDatabaseConfig());
        
        // Handle pool errors
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
        
        DatabaseConnection.instance = this;
    }
    
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    
    getPool() {
        return this.pool;
    }
    
    async query(text, params) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(text, params);
            return result;
        } finally {
            client.release();
        }
    }
    
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    async close() {
        await this.pool.end();
    }
}

/**
 * Database table schemas
 */
const tableSchemas = {
    contact_submissions: `
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            newsletter_signup BOOLEAN DEFAULT FALSE,
            ip_address INET,
            user_agent TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_submissions(email);
        CREATE INDEX IF NOT EXISTS idx_contact_submitted_at ON contact_submissions(submitted_at);
        CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);
    `,
    
    newsletter_subscribers: `
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            subscription_source VARCHAR(100),
            confirmed BOOLEAN DEFAULT FALSE,
            confirmation_token VARCHAR(255),
            confirmation_sent_at TIMESTAMP,
            confirmed_at TIMESTAMP,
            unsubscribed_at TIMESTAMP,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
        CREATE INDEX IF NOT EXISTS idx_newsletter_confirmed ON newsletter_subscribers(confirmed);
        CREATE INDEX IF NOT EXISTS idx_newsletter_created_at ON newsletter_subscribers(created_at);
    `,
    
    book_reviews: `
        CREATE TABLE IF NOT EXISTS book_reviews (
            id SERIAL PRIMARY KEY,
            reviewer_name VARCHAR(255) NOT NULL,
            reviewer_location VARCHAR(255),
            reviewer_email VARCHAR(255),
            book_title VARCHAR(255) NOT NULL,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            review_title VARCHAR(255) NOT NULL,
            review_text TEXT NOT NULL,
            verified_purchase BOOLEAN DEFAULT FALSE,
            helpful_votes INTEGER DEFAULT 0,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'featured')),
            ip_address INET,
            user_agent TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_reviews_book_title ON book_reviews(book_title);
        CREATE INDEX IF NOT EXISTS idx_reviews_rating ON book_reviews(rating);
        CREATE INDEX IF NOT EXISTS idx_reviews_status ON book_reviews(status);
        CREATE INDEX IF NOT EXISTS idx_reviews_submitted_at ON book_reviews(submitted_at);
    `,
    
    blog_comments: `
        CREATE TABLE IF NOT EXISTS blog_comments (
            id SERIAL PRIMARY KEY,
            post_slug VARCHAR(255) NOT NULL,
            commenter_name VARCHAR(255) NOT NULL,
            commenter_email VARCHAR(255) NOT NULL,
            commenter_website VARCHAR(255),
            comment_text TEXT NOT NULL,
            parent_comment_id INTEGER REFERENCES blog_comments(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'rejected')),
            ip_address INET,
            user_agent TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON blog_comments(post_slug);
        CREATE INDEX IF NOT EXISTS idx_comments_status ON blog_comments(status);
        CREATE INDEX IF NOT EXISTS idx_comments_submitted_at ON blog_comments(submitted_at);
    `,
    
    analytics_events: `
        CREATE TABLE IF NOT EXISTS analytics_events (
            id SERIAL PRIMARY KEY,
            event_type VARCHAR(100) NOT NULL,
            event_data JSONB,
            page_url VARCHAR(500),
            referrer_url VARCHAR(500),
            user_session VARCHAR(255),
            ip_address INET,
            user_agent TEXT,
            country_code VARCHAR(2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
        CREATE INDEX IF NOT EXISTS idx_analytics_user_session ON analytics_events(user_session);
        CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
    `
};

/**
 * Initialize database tables
 */
const initializeDatabaseTables = async () => {
    try {
        const db = DatabaseConnection.getInstance();
        
        for (const [tableName, schema] of Object.entries(tableSchemas)) {
            await db.query(schema);
            console.log(`Table '${tableName}' initialized successfully`);
        }
        
        return true;
        
    } catch (error) {
        console.error('Failed to initialize database tables:', error.message);
        return false;
    }
};

/**
 * Database utility functions
 */
class DatabaseUtils {
    
    /**
     * Sanitize input for database insertion
     */
    static sanitizeInput(input) {
        if (Array.isArray(input)) {
            return input.map(item => DatabaseUtils.sanitizeInput(item));
        }
        
        if (typeof input === 'object' && input !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(input)) {
                sanitized[key] = DatabaseUtils.sanitizeInput(value);
            }
            return sanitized;
        }
        
        if (typeof input === 'string') {
            return input.trim().replace(/[<>]/g, '');
        }
        
        return input;
    }
    
    /**
     * Validate email address
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Generate secure token
     */
    static generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    
    /**
     * Hash password
     */
    static async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }
    
    /**
     * Verify password
     */
    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
    
    /**
     * Log database operation
     */
    static logOperation(operation, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            data,
            environment
        };
        
        console.log('DB Operation:', JSON.stringify(logEntry));
    }
    
    /**
     * Check database connection health
     */
    static async checkConnectionHealth() {
        try {
            const db = DatabaseConnection.getInstance();
            const result = await db.query('SELECT 1 as health');
            return result.rows.length > 0;
        } catch (error) {
            console.error('Database health check failed:', error.message);
            return false;
        }
    }
    
    /**
     * Get client IP address from request
     */
    static getClientIP(req) {
        return req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null);
    }
    
    /**
     * Get user agent from request
     */
    static getUserAgent(req) {
        return req.get('User-Agent') || 'Unknown';
    }
}

/**
 * Contact form submission handler
 */
class ContactFormHandler {
    
    static async submitForm(data, req) {
        try {
            const db = DatabaseConnection.getInstance();
            
            // Sanitize input data
            const sanitizedData = DatabaseUtils.sanitizeInput(data);
            
            // Validate required fields
            const requiredFields = ['firstName', 'lastName', 'email', 'subject', 'message'];
            for (const field of requiredFields) {
                if (!sanitizedData[field] || sanitizedData[field].trim() === '') {
                    throw new Error(`Required field '${field}' is missing`);
                }
            }
            
            // Validate email
            if (!DatabaseUtils.validateEmail(sanitizedData.email)) {
                throw new Error('Invalid email address');
            }
            
            // Get client information
            const ipAddress = DatabaseUtils.getClientIP(req);
            const userAgent = DatabaseUtils.getUserAgent(req);
            
            // Insert submission
            const query = `
                INSERT INTO contact_submissions 
                (first_name, last_name, email, phone, subject, message, newsletter_signup, ip_address, user_agent) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id, created_at
            `;
            
            const values = [
                sanitizedData.firstName,
                sanitizedData.lastName,
                sanitizedData.email,
                sanitizedData.phone || null,
                sanitizedData.subject,
                sanitizedData.message,
                sanitizedData.newsletter || false,
                ipAddress,
                userAgent
            ];
            
            const result = await db.query(query, values);
            
            if (result.rows.length > 0) {
                // If newsletter signup requested, add to newsletter
                if (sanitizedData.newsletter) {
                    await NewsletterHandler.subscribe(
                        sanitizedData.email, 
                        sanitizedData.firstName, 
                        sanitizedData.lastName,
                        'contact_form',
                        req
                    );
                }
                
                DatabaseUtils.logOperation('contact_form_submitted', { 
                    email: sanitizedData.email,
                    id: result.rows[0].id 
                });
                
                return { 
                    success: true, 
                    message: 'Form submitted successfully',
                    submissionId: result.rows[0].id
                };
            }
            
            throw new Error('Failed to insert form submission');
            
        } catch (error) {
            console.error('Contact form submission error:', error.message);
            return { success: false, message: error.message };
        }
    }
}

/**
 * Newsletter subscription handler
 */
class NewsletterHandler {
    
    static async subscribe(email, firstName = '', lastName = '', source = 'website', req = null) {
        try {
            const db = DatabaseConnection.getInstance();
            
            // Validate email
            if (!DatabaseUtils.validateEmail(email)) {
                throw new Error('Invalid email address');
            }
            
            // Check if already subscribed
            const existingQuery = 'SELECT id FROM newsletter_subscribers WHERE email = $1';
            const existingResult = await db.query(existingQuery, [email]);
            
            if (existingResult.rows.length > 0) {
                return { success: false, message: 'Email already subscribed' };
            }
            
            // Generate confirmation token
            const token = DatabaseUtils.generateSecureToken();
            
            // Get client information
            const ipAddress = req ? DatabaseUtils.getClientIP(req) : null;
            const userAgent = req ? DatabaseUtils.getUserAgent(req) : null;
            
            // Insert subscription
            const insertQuery = `
                INSERT INTO newsletter_subscribers 
                (email, first_name, last_name, subscription_source, confirmation_token, ip_address, user_agent) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;
            
            const values = [
                email,
                firstName,
                lastName,
                source,
                token,
                ipAddress,
                userAgent
            ];
            
            const result = await db.query(insertQuery, values);
            
            if (result.rows.length > 0) {
                // TODO: Send confirmation email
                DatabaseUtils.logOperation('newsletter_subscription', { 
                    email,
                    id: result.rows[0].id 
                });
                
                return { 
                    success: true, 
                    message: 'Subscription successful',
                    token,
                    subscriberId: result.rows[0].id
                };
            }
            
            throw new Error('Failed to create subscription');
            
        } catch (error) {
            console.error('Newsletter subscription error:', error.message);
            return { success: false, message: error.message };
        }
    }
    
    static async confirmSubscription(token) {
        try {
            const db = DatabaseConnection.getInstance();
            
            const query = `
                UPDATE newsletter_subscribers 
                SET confirmed = TRUE, confirmed_at = CURRENT_TIMESTAMP 
                WHERE confirmation_token = $1 AND confirmed = FALSE
                RETURNING id, email
            `;
            
            const result = await db.query(query, [token]);
            
            if (result.rows.length > 0) {
                DatabaseUtils.logOperation('newsletter_confirmed', { 
                    token,
                    email: result.rows[0].email 
                });
                
                return { 
                    success: true, 
                    message: 'Subscription confirmed',
                    subscriberId: result.rows[0].id
                };
            }
            
            return { success: false, message: 'Invalid or expired confirmation token' };
            
        } catch (error) {
            console.error('Newsletter confirmation error:', error.message);
            return { success: false, message: error.message };
        }
    }
    
    static async unsubscribe(email) {
        try {
            const db = DatabaseConnection.getInstance();
            
            const query = `
                UPDATE newsletter_subscribers 
                SET unsubscribed_at = CURRENT_TIMESTAMP 
                WHERE email = $1 AND unsubscribed_at IS NULL
                RETURNING id
            `;
            
            const result = await db.query(query, [email]);
            
            if (result.rows.length > 0) {
                DatabaseUtils.logOperation('newsletter_unsubscribed', { email });
                return { success: true, message: 'Successfully unsubscribed' };
            }
            
            return { success: false, message: 'Email not found or already unsubscribed' };
            
        } catch (error) {
            console.error('Newsletter unsubscribe error:', error.message);
            return { success: false, message: error.message };
        }
    }
}

// Create database instance
const db = DatabaseConnection.getInstance();

// Export everything
module.exports = {
    DatabaseConnection,
    DatabaseUtils,
    ContactFormHandler,
    NewsletterHandler,
    initializeDatabaseTables,
    db
};

// Initialize database tables if this script is run directly
if (require.main === module) {
    initializeDatabaseTables()
        .then((success) => {
            if (success) {
                console.log('Database tables initialized successfully');
                process.exit(0);
            } else {
                console.log('Failed to initialize database tables');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('Error initializing database:', error);
            process.exit(1);
        });
}
