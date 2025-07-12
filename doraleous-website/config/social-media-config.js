/* ===================================
   SOCIAL MEDIA CONFIGURATION
   File: config/social-media-config.js
   =================================== */

const axios = require('axios');
const crypto = require('crypto');

/**
 * Social Media API Keys and Configuration
 * 
 * This file contains API keys, access tokens, and configuration settings
 * for various social media platforms and integrations used on the
 * Brian M. Shoemaker author website.
 * 
 * SECURITY NOTE: 
 * - Store sensitive keys in environment variables in production
 * - Never commit actual API keys to version control
 * - Use placeholder values in this template
 */

// Environment-based configuration
const environment = process.env.NODE_ENV || 'development';

/**
 * Twitter/X API Configuration
 */
const twitterConfig = {
    apiKey: process.env.TWITTER_API_KEY || 'your_twitter_api_key_here',
    apiSecret: process.env.TWITTER_API_SECRET || 'your_twitter_api_secret_here',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || 'your_twitter_access_token_here',
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || 'your_twitter_access_token_secret_here',
    bearerToken: process.env.TWITTER_BEARER_TOKEN || 'your_twitter_bearer_token_here',
    
    // Account information
    username: 'brianmshoemaker',
    userId: '1234567890', // Replace with actual Twitter user ID
    
    // API settings
    apiVersion: '2',
    rateLimitWindow: 900, // 15 minutes in seconds
    maxRequestsPerWindow: 300,
    
    // Content settings
    hashtags: [
        '#fantasybooks',
        '#epicfantasy',
        '#fantasyauthor',
        '#booklovers',
        '#reading',
        '#doraleousandassociates'
    ],
    autoPost: environment === 'production',
    includeImages: true
};

/**
 * Facebook API Configuration
 */
const facebookConfig = {
    appId: process.env.FACEBOOK_APP_ID || 'your_facebook_app_id_here',
    appSecret: process.env.FACEBOOK_APP_SECRET || 'your_facebook_app_secret_here',
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN || 'your_facebook_access_token_here',
    pageId: process.env.FACEBOOK_PAGE_ID || 'your_facebook_page_id_here',
    
    // Account information
    pageUsername: 'brianmshoemaker',
    pageName: 'Brian M. Shoemaker - Fantasy Author',
    
    // API settings
    apiVersion: 'v18.0',
    permissions: [
        'pages_manage_posts',
        'pages_read_engagement',
        'pages_show_list'
    ],
    
    // Content settings
    autoPost: environment === 'production',
    postTypes: ['status', 'photo', 'link'],
    includeCallToAction: true
};

/**
 * Instagram API Configuration
 */
const instagramConfig = {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || 'your_instagram_access_token_here',
    businessAccountId: process.env.INSTAGRAM_BUSINESS_ID || 'your_instagram_business_id_here',
    userId: process.env.INSTAGRAM_USER_ID || 'your_instagram_user_id_here',
    
    // Account information
    username: 'brianmshoemaker',
    displayName: 'Brian M. Shoemaker',
    
    // API settings
    apiVersion: 'v18.0',
    mediaTypes: ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'],
    
    // Content settings
    hashtags: [
        '#fantasyauthor',
        '#bookstagram',
        '#fantasybooks',
        '#authorlife',
        '#writinglife',
        '#epicfantasy',
        '#booklovers',
        '#fantasyreads'
    ],
    maxHashtags: 30,
    autoPost: false, // Manual approval for Instagram
    imageRequirements: {
        minWidth: 320,
        minHeight: 320,
        maxSizeMB: 8,
        formats: ['jpg', 'png']
    }
};

/**
 * YouTube API Configuration
 */
const youtubeConfig = {
    apiKey: process.env.YOUTUBE_API_KEY || 'your_youtube_api_key_here',
    clientId: process.env.YOUTUBE_CLIENT_ID || 'your_youtube_client_id_here',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || 'your_youtube_client_secret_here',
    refreshToken: process.env.YOUTUBE_REFRESH_TOKEN || 'your_youtube_refresh_token_here',
    
    // Channel information
    channelId: 'your_youtube_channel_id_here',
    channelHandle: '@brianmshoemaker',
    
    // API settings
    apiVersion: 'v3',
    scopes: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube'
    ],
    
    // Content settings
    defaultCategory: '27', // Education category
    defaultPrivacy: 'public',
    autoPublish: false, // Manual review required
    tags: [
        'fantasy books',
        'author interview',
        'book reading',
        'epic fantasy',
        'doraleous and associates'
    ]
};

/**
 * Goodreads Configuration
 */
const goodreadsConfig = {
    apiKey: process.env.GOODREADS_API_KEY || 'your_goodreads_api_key_here',
    apiSecret: process.env.GOODREADS_API_SECRET || 'your_goodreads_api_secret_here',
    accessToken: process.env.GOODREADS_ACCESS_TOKEN || 'your_goodreads_access_token_here',
    accessTokenSecret: process.env.GOODREADS_ACCESS_TOKEN_SECRET || 'your_goodreads_access_token_secret_here',
    
    // Account information
    authorId: 'your_goodreads_author_id_here',
    profileUrl: 'https://www.goodreads.com/author/show/your_author_id',
    
    // Book information
    books: {
        doraleousAndAssociates: {
            goodreadsId: 'book_id_here',
            isbn: '978-0-XXXXX-XXX-X',
            title: 'Doraleous and Associates: A Tale of Glory'
        }
    },
    
    // API settings
    rateLimit: 1, // 1 request per second
    autoSyncReviews: true,
    reviewSyncInterval: 3600 // 1 hour in seconds
};

/**
 * Newsletter/Email Marketing Configuration
 */
const newsletterConfig = {
    // Mailchimp
    mailchimp: {
        apiKey: process.env.MAILCHIMP_API_KEY || 'your_mailchimp_api_key_here',
        serverPrefix: process.env.MAILCHIMP_SERVER || 'us1', // Extract from API key
        listId: process.env.MAILCHIMP_LIST_ID || 'your_mailchimp_list_id_here',
        
        listSettings: {
            doubleOptin: true,
            sendWelcome: true,
            mergeFields: {
                FNAME: 'First Name',
                LNAME: 'Last Name',
                BOOKSREAD: 'Books Read'
            }
        }
    },
    
    // ConvertKit (alternative)
    convertkit: {
        apiKey: process.env.CONVERTKIT_API_KEY || 'your_convertkit_api_key_here',
        apiSecret: process.env.CONVERTKIT_API_SECRET || 'your_convertkit_api_secret_here',
        formId: process.env.CONVERTKIT_FORM_ID || 'your_convertkit_form_id_here',
        
        tags: [
            'fantasy_reader',
            'book_lover',
            'newsletter_subscriber',
            'doraleous_fan'
        ]
    }
};

/**
 * Analytics and Tracking Configuration
 */
const analyticsConfig = {
    // Google Analytics
    googleAnalytics: {
        measurementId: process.env.GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
        propertyId: process.env.GA_PROPERTY_ID || 'your_property_id_here',
        serviceAccountPath: process.env.GA_SERVICE_ACCOUNT_PATH || '/path/to/service-account.json'
    },
    
    // Facebook Pixel
    facebookPixel: {
        pixelId: process.env.FACEBOOK_PIXEL_ID || 'your_facebook_pixel_id_here',
        accessToken: process.env.FACEBOOK_PIXEL_TOKEN || 'your_facebook_pixel_token_here'
    },
    
    // Twitter Analytics
    twitterAnalytics: {
        enabled: true,
        trackConversions: true
    }
};

/**
 * Content Syndication Settings
 */
const syndicationConfig = {
    autoPostNewBlogs: environment === 'production',
    autoPostBookUpdates: true,
    crossPostReviews: true,
    shareMediaMentions: true,
    
    postingSchedule: {
        twitter: {
            frequency: 'daily',
            optimalTimes: ['09:00', '15:00', '19:00']
        },
        facebook: {
            frequency: 'every_other_day',
            optimalTimes: ['10:00', '14:00', '20:00']
        },
        instagram: {
            frequency: 'weekly',
            optimalTimes: ['11:00', '17:00']
        }
    }
};

/**
 * Social Media Integration Class
 */
class SocialMediaIntegration {
    constructor() {
        this.platformConfigs = {
            twitter: twitterConfig,
            facebook: facebookConfig,
            instagram: instagramConfig,
            youtube: youtubeConfig,
            goodreads: goodreadsConfig,
            newsletter: newsletterConfig
        };
    }
    
    /**
     * Get configuration for a specific platform
     */
    getConfig(platform) {
        return this.platformConfigs[platform] || null;
    }
    
    /**
     * Validate API credentials for a platform
     */
    validateCredentials(platform) {
        const config = this.getConfig(platform);
        if (!config) {
            return false;
        }
        
        switch (platform) {
            case 'twitter':
                return !!(config.apiKey && config.apiSecret);
            case 'facebook':
                return !!(config.appId && config.appSecret);
            case 'instagram':
                return !!config.accessToken;
            case 'youtube':
                return !!(config.apiKey && config.clientId);
            case 'goodreads':
                return !!config.apiKey;
            default:
                return false;
        }
    }
    
    /**
     * Post content to multiple platforms
     */
    async crossPost(content, platforms = ['twitter', 'facebook']) {
        const results = {};
        
        for (const platform of platforms) {
            if (!this.validateCredentials(platform)) {
                results[platform] = { success: false, error: 'Invalid credentials' };
                continue;
            }
            
            try {
                const result = await this.postToPlatform(platform, content);
                results[platform] = result;
            } catch (error) {
                results[platform] = { success: false, error: error.message };
            }
        }
        
        return results;
    }
    
    /**
     * Post content to a specific platform
     */
    async postToPlatform(platform, content) {
        // Platform-specific posting logic would go here
        // This is a simplified example
        
        switch (platform) {
            case 'twitter':
                return await this.postToTwitter(content);
            case 'facebook':
                return await this.postToFacebook(content);
            case 'instagram':
                return await this.postToInstagram(content);
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }
    
    /**
     * Platform-specific posting methods
     * (These would contain actual API calls)
     */
    async postToTwitter(content) {
        // Twitter API implementation would go here
        // Example structure:
        /*
        const response = await axios.post('https://api.twitter.com/2/tweets', {
            text: content.text
        }, {
            headers: {
                'Authorization': `Bearer ${twitterConfig.bearerToken}`,
                'Content-Type': 'application/json'
            }
        });
        */
        
        return { success: true, postId: 'twitter_post_id' };
    }
    
    async postToFacebook(content) {
        // Facebook API implementation would go here
        return { success: true, postId: 'facebook_post_id' };
    }
    
    async postToInstagram(content) {
        // Instagram API implementation would go here
        return { success: true, postId: 'instagram_post_id' };
    }
    
    /**
     * Schedule post for later
     */
    async schedulePost(platform, content, scheduleTime) {
        // Implementation for scheduling posts
        // This could use a job queue or cron system
        
        const job = {
            platform,
            content,
            scheduleTime,
            createdAt: new Date().toISOString()
        };
        
        // Store in database or queue system
        return await this.storeScheduledPost(job);
    }
    
    async storeScheduledPost(job) {
        // Database storage implementation
        return { success: true, jobId: crypto.randomUUID() };
    }
}

/**
 * Utility functions for social media operations
 */
class SocialMediaUtils {
    
    /**
     * Generate appropriate hashtags for content
     */
    static generateHashtags(contentType, platform = 'twitter') {
        let baseHashtags = [];
        
        switch (contentType) {
            case 'book_announcement':
                baseHashtags = ['#fantasybooks', '#newrelease', '#epicfantasy'];
                break;
            case 'blog_post':
                baseHashtags = ['#writing', '#fantasyauthor', '#writingtips'];
                break;
            case 'character_spotlight':
                baseHashtags = ['#characterart', '#fantasy', '#bookcharacters'];
                break;
            default:
                baseHashtags = ['#fantasyauthor', '#books'];
        }
        
        // Add platform-specific hashtags
        let platformHashtags = [];
        if (platform === 'twitter') {
            platformHashtags = twitterConfig.hashtags;
        } else if (platform === 'instagram') {
            platformHashtags = instagramConfig.hashtags;
        }
        
        const allHashtags = [...new Set([...baseHashtags, ...platformHashtags])];
        
        // Limit hashtags based on platform
        const maxHashtags = platform === 'instagram' ? 30 : 5;
        
        return allHashtags.slice(0, maxHashtags);
    }
    
    /**
     * Optimize content for platform
     */
    static optimizeContentForPlatform(content, platform) {
        switch (platform) {
            case 'twitter':
                return SocialMediaUtils.optimizeForTwitter(content);
            case 'facebook':
                return SocialMediaUtils.optimizeForFacebook(content);
            case 'instagram':
                return SocialMediaUtils.optimizeForInstagram(content);
            default:
                return content;
        }
    }
    
    static optimizeForTwitter(content) {
        // Truncate to Twitter's character limit
        const maxLength = 280 - 50; // Reserve space for hashtags and links
        
        if (content.length > maxLength) {
            content = content.substring(0, maxLength - 3) + '...';
        }
        
        return content;
    }
    
    static optimizeForFacebook(content) {
        // Facebook allows longer content, but engagement is better with shorter posts
        const optimalLength = 400;
        
        if (content.length > optimalLength) {
            // Don't truncate, but suggest it might be too long
            console.warn('Facebook post might be too long for optimal engagement');
        }
        
        return content;
    }
    
    static optimizeForInstagram(content) {
        // Instagram captions can be long, but first 125 characters are most important
        const previewLength = 125;
        
        if (content.length > previewLength) {
            // Make sure the first part is compelling
            let firstPart = content.substring(0, previewLength);
            if (firstPart.charAt(firstPart.length - 1) !== ' ') {
                // Try to end at a word boundary
                const lastSpace = firstPart.lastIndexOf(' ');
                if (lastSpace !== -1) {
                    firstPart = firstPart.substring(0, lastSpace);
                }
            }
            
            // Add continuation indicator
            content = firstPart + '... [continued in comments or full post]';
        }
        
        return content;
    }
    
    /**
     * Log social media activity
     */
    static logActivity(platform, action, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            platform,
            action,
            data,
            environment
        };
        
        console.log('Social Media Activity:', JSON.stringify(logEntry));
    }
    
    /**
     * Generate engagement metrics
     */
    static async getEngagementMetrics(platform, postId) {
        // This would implement actual API calls to get metrics
        return {
            likes: 0,
            shares: 0,
            comments: 0,
            reach: 0,
            impressions: 0
        };
    }
    
    /**
     * Validate post content
     */
    static validatePostContent(content, platform) {
        const errors = [];
        
        if (!content || content.trim() === '') {
            errors.push('Content cannot be empty');
        }
        
        switch (platform) {
            case 'twitter':
                if (content.length > 280) {
                    errors.push('Twitter content exceeds 280 characters');
                }
                break;
            case 'instagram':
                if (content.length > 2200) {
                    errors.push('Instagram content exceeds 2200 characters');
                }
                break;
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

/**
 * Rate limiting utility
 */
class RateLimiter {
    constructor() {
        this.requests = new Map();
    }
    
    async checkRateLimit(platform, action) {
        const key = `${platform}:${action}`;
        const now = Date.now();
        const config = this.getRateLimitConfig(platform);
        
        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }
        
        const requests = this.requests.get(key);
        
        // Remove old requests outside the window
        const validRequests = requests.filter(
            time => now - time < config.window * 1000
        );
        
        this.requests.set(key, validRequests);
        
        if (validRequests.length >= config.maxRequests) {
            throw new Error(`Rate limit exceeded for ${platform}:${action}`);
        }
        
        validRequests.push(now);
        return true;
    }
    
    getRateLimitConfig(platform) {
        const configs = {
            twitter: { window: 900, maxRequests: 300 },
            facebook: { window: 3600, maxRequests: 200 },
            instagram: { window: 3600, maxRequests: 100 },
            default: { window: 3600, maxRequests: 100 }
        };
        
        return configs[platform] || configs.default;
    }
}

// Create instances
const socialMediaIntegration = new SocialMediaIntegration();
const rateLimiter = new RateLimiter();

// Export configuration and classes
module.exports = {
    // Configurations
    twitterConfig,
    facebookConfig,
    instagramConfig,
    youtubeConfig,
    goodreadsConfig,
    newsletterConfig,
    analyticsConfig,
    syndicationConfig,
    
    // Classes
    SocialMediaIntegration,
    SocialMediaUtils,
    RateLimiter,
    
    // Instances
    socialMediaIntegration,
    rateLimiter,
    
    // Complete config object
    socialMediaConfig: {
        twitter: twitterConfig,
        facebook: facebookConfig,
        instagram: instagramConfig,
        youtube: youtubeConfig,
        goodreads: goodreadsConfig,
        newsletter: newsletterConfig,
        analytics: analyticsConfig,
        syndication: syndicationConfig
    }
};
