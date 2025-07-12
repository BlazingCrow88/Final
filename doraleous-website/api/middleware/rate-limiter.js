// File Location: /api/middleware/rate-limiter.js

const rateLimit = require('express-rate-limit');

// Contact form rate limiting - prevent spam
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Maximum 3 contact form submissions per 15 minutes
    message: {
        success: false,
        message: 'Too many contact form submissions. Please wait before sending another message.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for admin IPs (optional)
        const adminIPs = process.env.ADMIN_IPS ? process.env.ADMIN_IPS.split(',') : [];
        return adminIPs.includes(req.ip);
    }
});

// Newsletter signup rate limiting
const newsletterLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Maximum 5 newsletter signups per hour per IP
    message: {
        success: false,
        message: 'Too many newsletter signup attempts. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// General API rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Maximum 50 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many requests. Please slow down.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Analytics tracking rate limiting
const analyticsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Maximum 20 analytics events per minute
    message: {
        success: false,
        message: 'Analytics rate limit exceeded.'
    },
    standardHeaders: false,
    legacyHeaders: false,
    skip: (req) => {
        // Skip for development environment
        return process.env.NODE_ENV === 'development';
    }
});

// Export rate limiters
const rateLimiter = {
    contact: contactLimiter,
    newsletter: newsletterLimiter,
    general: generalLimiter,
    analytics: analyticsLimiter
};

module.exports = { rateLimiter };
