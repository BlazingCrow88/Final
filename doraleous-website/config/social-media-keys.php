<?php
/* ===================================
   SOCIAL MEDIA KEYS CONFIGURATION
   File: config/social-media-keys.php
   =================================== */

// Prevent direct access
if (!defined('INCLUDED_FROM_MAIN')) {
    die('Direct access not permitted');
}

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
$environment = $_ENV['ENVIRONMENT'] ?? 'development';

/**
 * Twitter/X API Configuration
 */
$twitter_config = [
    'api_key' => $_ENV['TWITTER_API_KEY'] ?? 'your_twitter_api_key_here',
    'api_secret' => $_ENV['TWITTER_API_SECRET'] ?? 'your_twitter_api_secret_here',
    'access_token' => $_ENV['TWITTER_ACCESS_TOKEN'] ?? 'your_twitter_access_token_here',
    'access_token_secret' => $_ENV['TWITTER_ACCESS_TOKEN_SECRET'] ?? 'your_twitter_access_token_secret_here',
    'bearer_token' => $_ENV['TWITTER_BEARER_TOKEN'] ?? 'your_twitter_bearer_token_here',
    
    // Account information
    'username' => 'brianmshoemaker',
    'user_id' => '1234567890', // Replace with actual Twitter user ID
    
    // API settings
    'api_version' => '2',
    'rate_limit_window' => 900, // 15 minutes in seconds
    'max_requests_per_window' => 300,
    
    // Content settings
    'hashtags' => [
        '#fantasybooks',
        '#epicfantasy',
        '#fantasyauthor',
        '#booklovers',
        '#reading',
        '#doraleousandassociates'
    ],
    'auto_post' => $environment === 'production',
    'include_images' => true
];

/**
 * Facebook API Configuration
 */
$facebook_config = [
    'app_id' => $_ENV['FACEBOOK_APP_ID'] ?? 'your_facebook_app_id_here',
    'app_secret' => $_ENV['FACEBOOK_APP_SECRET'] ?? 'your_facebook_app_secret_here',
    'access_token' => $_ENV['FACEBOOK_ACCESS_TOKEN'] ?? 'your_facebook_access_token_here',
    'page_id' => $_ENV['FACEBOOK_PAGE_ID'] ?? 'your_facebook_page_id_here',
    
    // Account information
    'page_username' => 'brianmshoemaker',
    'page_name' => 'Brian M. Shoemaker - Fantasy Author',
    
    // API settings
    'api_version' => 'v18.0',
    'permissions' => [
        'pages_manage_posts',
        'pages_read_engagement',
        'pages_show_list'
    ],
    
    // Content settings
    'auto_post' => $environment === 'production',
    'post_types' => ['status', 'photo', 'link'],
    'include_call_to_action' => true
];

/**
 * Instagram API Configuration
 */
$instagram_config = [
    'access_token' => $_ENV['INSTAGRAM_ACCESS_TOKEN'] ?? 'your_instagram_access_token_here',
    'business_account_id' => $_ENV['INSTAGRAM_BUSINESS_ID'] ?? 'your_instagram_business_id_here',
    'user_id' => $_ENV['INSTAGRAM_USER_ID'] ?? 'your_instagram_user_id_here',
    
    // Account information
    'username' => 'brianmshoemaker',
    'display_name' => 'Brian M. Shoemaker',
    
    // API settings
    'api_version' => 'v18.0',
    'media_types' => ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'],
    
    // Content settings
    'hashtags' => [
        '#fantasyauthor',
        '#bookstagram',
        '#fantasybooks',
        '#authorlife',
        '#writinglife',
        '#epicfantasy',
        '#booklovers',
        '#fantasyreads'
    ],
    'max_hashtags' => 30,
    'auto_post' => false, // Manual approval for Instagram
    'image_requirements' => [
        'min_width' => 320,
        'min_height' => 320,
        'max_size_mb' => 8,
        'formats' => ['jpg', 'png']
    ]
];

/**
 * YouTube API Configuration
 */
$youtube_config = [
    'api_key' => $_ENV['YOUTUBE_API_KEY'] ?? 'your_youtube_api_key_here',
    'client_id' => $_ENV['YOUTUBE_CLIENT_ID'] ?? 'your_youtube_client_id_here',
    'client_secret' => $_ENV['YOUTUBE_CLIENT_SECRET'] ?? 'your_youtube_client_secret_here',
    'refresh_token' => $_ENV['YOUTUBE_REFRESH_TOKEN'] ?? 'your_youtube_refresh_token_here',
    
    // Channel information
    'channel_id' => 'your_youtube_channel_id_here',
    'channel_handle' => '@brianmshoemaker',
    
    // API settings
    'api_version' => 'v3',
    'scopes' => [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube'
    ],
    
    // Content settings
    'default_category' => '27', // Education category
    'default_privacy' => 'public',
    'auto_publish' => false, // Manual review required
    'tags' => [
        'fantasy books',
        'author interview',
        'book reading',
        'epic fantasy',
        'doraleous and associates'
    ]
];

/**
 * Goodreads Configuration
 */
$goodreads_config = [
    'api_key' => $_ENV['GOODREADS_API_KEY'] ?? 'your_goodreads_api_key_here',
    'api_secret' => $_ENV['GOODREADS_API_SECRET'] ?? 'your_goodreads_api_secret_here',
    'access_token' => $_ENV['GOODREADS_ACCESS_TOKEN'] ?? 'your_goodreads_access_token_here',
    'access_token_secret' => $_ENV['GOODREADS_ACCESS_TOKEN_SECRET'] ?? 'your_goodreads_access_token_secret_here',
    
    // Account information
    'author_id' => 'your_goodreads_author_id_here',
    'profile_url' => 'https://www.goodreads.com/author/show/your_author_id',
    
    // Book information
    'books' => [
        'doraleous_and_associates' => [
            'goodreads_id' => 'book_id_here',
            'isbn' => '978-0-XXXXX-XXX-X',
            'title' => 'Doraleous and Associates: A Tale of Glory'
        ]
    ],
    
    // API settings
    'rate_limit' => 1, // 1 request per second
    'auto_sync_reviews' => true,
    'review_sync_interval' => 3600 // 1 hour in seconds
];

/**
 * Newsletter/Email Marketing Configuration
 */
$newsletter_config = [
    // Mailchimp
    'mailchimp' => [
        'api_key' => $_ENV['MAILCHIMP_API_KEY'] ?? 'your_mailchimp_api_key_here',
        'server_prefix' => $_ENV['MAILCHIMP_SERVER'] ?? 'us1', // Extract from API key
        'list_id' => $_ENV['MAILCHIMP_LIST_ID'] ?? 'your_mailchimp_list_id_here',
        
        'list_settings' => [
            'double_optin' => true,
            'send_welcome' => true,
            'merge_fields' => [
                'FNAME' => 'First Name',
                'LNAME' => 'Last Name',
                'BOOKSREAD' => 'Books Read'
            ]
        ]
    ],
    
    // ConvertKit (alternative)
    'convertkit' => [
        'api_key' => $_ENV['CONVERTKIT_API_KEY'] ?? 'your_convertkit_api_key_here',
        'api_secret' => $_ENV['CONVERTKIT_API_SECRET'] ?? 'your_convertkit_api_secret_here',
        'form_id' => $_ENV['CONVERTKIT_FORM_ID'] ?? 'your_convertkit_form_id_here',
        
        'tags' => [
            'fantasy_reader',
            'book_lover',
            'newsletter_subscriber',
            'doraleous_fan'
        ]
    ]
];

/**
 * Analytics and Tracking Configuration
 */
$analytics_config = [
    // Google Analytics
    'google_analytics' => [
        'measurement_id' => $_ENV['GA_MEASUREMENT_ID'] ?? 'G-XXXXXXXXXX',
        'property_id' => $_ENV['GA_PROPERTY_ID'] ?? 'your_property_id_here',
        'service_account_path' => $_ENV['GA_SERVICE_ACCOUNT_PATH'] ?? '/path/to/service-account.json'
    ],
    
    // Facebook Pixel
    'facebook_pixel' => [
        'pixel_id' => $_ENV['FACEBOOK_PIXEL_ID'] ?? 'your_facebook_pixel_id_here',
        'access_token' => $_ENV['FACEBOOK_PIXEL_TOKEN'] ?? 'your_facebook_pixel_token_here'
    ],
    
    // Twitter Analytics
    'twitter_analytics' => [
        'enabled' => true,
        'track_conversions' => true
    ]
];

/**
 * Content Syndication Settings
 */
$syndication_config = [
    'auto_post_new_blogs' => $environment === 'production',
    'auto_post_book_updates' => true,
    'cross_post_reviews' => true,
    'share_media_mentions' => true,
    
    'posting_schedule' => [
        'twitter' => [
            'frequency' => 'daily',
            'optimal_times' => ['09:00', '15:00', '19:00']
        ],
        'facebook' => [
            'frequency' => 'every_other_day',
            'optimal_times' => ['10:00', '14:00', '20:00']
        ],
        'instagram' => [
            'frequency' => 'weekly',
            'optimal_times' => ['11:00', '17:00']
        ]
    ]
];

/**
 * Social Media Integration Class
 */
class SocialMediaIntegration {
    private $platform_configs;
    
    public function __construct() {
        global $twitter_config, $facebook_config, $instagram_config, 
               $youtube_config, $goodreads_config, $newsletter_config;
        
        $this->platform_configs = [
            'twitter' => $twitter_config,
            'facebook' => $facebook_config,
            'instagram' => $instagram_config,
            'youtube' => $youtube_config,
            'goodreads' => $goodreads_config,
            'newsletter' => $newsletter_config
        ];
    }
    
    /**
     * Get configuration for a specific platform
     */
    public function getConfig($platform) {
        return $this->platform_configs[$platform] ?? null;
    }
    
    /**
     * Validate API credentials for a platform
     */
    public function validateCredentials($platform) {
        $config = $this->getConfig($platform);
        if (!$config) {
            return false;
        }
        
        switch ($platform) {
            case 'twitter':
                return !empty($config['api_key']) && !empty($config['api_secret']);
            case 'facebook':
                return !empty($config['app_id']) && !empty($config['app_secret']);
            case 'instagram':
                return !empty($config['access_token']);
            case 'youtube':
                return !empty($config['api_key']) && !empty($config['client_id']);
            case 'goodreads':
                return !empty($config['api_key']);
            default:
                return false;
        }
    }
    
    /**
     * Post content to multiple platforms
     */
    public function crossPost($content, $platforms = ['twitter', 'facebook']) {
        $results = [];
        
        foreach ($platforms as $platform) {
            if (!$this->validateCredentials($platform)) {
                $results[$platform] = ['success' => false, 'error' => 'Invalid credentials'];
                continue;
            }
            
            try {
                $result = $this->postToPlatform($platform, $content);
                $results[$platform] = $result;
            } catch (Exception $e) {
                $results[$platform] = ['success' => false, 'error' => $e->getMessage()];
            }
        }
        
        return $results;
    }
    
    /**
     * Post content to a specific platform
     */
    private function postToPlatform($platform, $content) {
        // Platform-specific posting logic would go here
        // This is a simplified example
        
        switch ($platform) {
            case 'twitter':
                return $this->postToTwitter($content);
            case 'facebook':
                return $this->postToFacebook($content);
            case 'instagram':
                return $this->postToInstagram($content);
            default:
                throw new Exception("Unsupported platform: $platform");
        }
    }
    
    /**
     * Platform-specific posting methods
     * (These would contain actual API calls)
     */
    private function postToTwitter($content) {
        // Twitter API implementation would go here
        return ['success' => true, 'post_id' => 'twitter_post_id'];
    }
    
    private function postToFacebook($content) {
        // Facebook API implementation would go here
        return ['success' => true, 'post_id' => 'facebook_post_id'];
    }
    
    private function postToInstagram($content) {
        // Instagram API implementation would go here
        return ['success' => true, 'post_id' => 'instagram_post_id'];
    }
    
    /**
     * Schedule post for later
     */
    public function schedulePost($platform, $content, $schedule_time) {
        // Implementation for scheduling posts
        // This could use a job queue or cron system
        
        $job = [
            'platform' => $platform,
            'content' => $content,
            'schedule_time' => $schedule_time,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        // Store in database or queue system
        return $this->storeScheduledPost($job);
    }
    
    private function storeScheduledPost($job) {
        // Database storage implementation
        return ['success' => true, 'job_id' => uniqid()];
    }
}

/**
 * Utility functions for social media operations
 */
class SocialMediaUtils {
    
    /**
     * Generate appropriate hashtags for content
     */
    public static function generateHashtags($content_type, $platform = 'twitter') {
        global $twitter_config, $instagram_config;
        
        $base_hashtags = [];
        
        switch ($content_type) {
            case 'book_announcement':
                $base_hashtags = ['#fantasybooks', '#newrelease', '#epicfantasy'];
                break;
            case 'blog_post':
                $base_hashtags = ['#writing', '#fantasyauthor', '#writingtips'];
                break;
            case 'character_spotlight':
                $base_hashtags = ['#characterart', '#fantasy', '#bookcharacters'];
                break;
            default:
                $base_hashtags = ['#fantasyauthor', '#books'];
        }
        
        // Add platform-specific hashtags
        if ($platform === 'twitter') {
            $platform_hashtags = $twitter_config['hashtags'];
        } elseif ($platform === 'instagram') {
            $platform_hashtags = $instagram_config['hashtags'];
        } else {
            $platform_hashtags = [];
        }
        
        $all_hashtags = array_merge($base_hashtags, $platform_hashtags);
        
        // Limit hashtags based on platform
        $max_hashtags = ($platform === 'instagram') ? 30 : 5;
        
        return array_slice(array_unique($all_hashtags), 0, $max_hashtags);
    }
    
    /**
     * Optimize content for platform
     */
    public static function optimizeContentForPlatform($content, $platform) {
        switch ($platform) {
            case 'twitter':
                return self::optimizeForTwitter($content);
            case 'facebook':
                return self::optimizeForFacebook($content);
            case 'instagram':
                return self::optimizeForInstagram($content);
            default:
                return $content;
        }
    }
    
    private static function optimizeForTwitter($content) {
        // Truncate to Twitter's character limit
        $max_length = 280 - 50; // Reserve space for hashtags and links
        
        if (strlen($content) > $max_length) {
            $content = substr($content, 0, $max_length - 3) . '...';
        }
        
        return $content;
    }
    
    private static function optimizeForFacebook($content) {
        // Facebook allows longer content, but engagement is better with shorter posts
        $optimal_length = 400;
        
        if (strlen($content) > $optimal_length) {
            // Don't truncate, but suggest it might be too long
            error_log("Facebook post might be too long for optimal engagement");
        }
        
        return $content;
    }
    
    private static function optimizeForInstagram($content) {
        // Instagram captions can be long, but first 125 characters are most important
        $preview_length = 125;
        
        if (strlen($content) > $preview_length) {
            // Make sure the first part is compelling
            $first_part = substr($content, 0, $preview_length);
            if (substr($first_part, -1) !== ' ') {
                // Try to end at a word boundary
                $last_space = strrpos($first_part, ' ');
                if ($last_space !== false) {
                    $first_part = substr($first_part, 0, $last_space);
                }
            }
            
            // Add continuation indicator
            $content = $first_part . '... [continued in comments or full post]';
        }
        
        return $content;
    }
    
    /**
     * Log social media activity
     */
    public static function logActivity($platform, $action, $data = []) {
        $log_entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'platform' => $platform,
            'action' => $action,
            'data' => $data,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];
        
        error_log("Social Media Activity: " . json_encode($log_entry));
    }
}

// Make configurations available globally
$GLOBALS['social_media_config'] = [
    'twitter' => $twitter_config,
    'facebook' => $facebook_config,
    'instagram' => $instagram_config,
    'youtube' => $youtube_config,
    'goodreads' => $goodreads_config,
    'newsletter' => $newsletter_config,
    'analytics' => $analytics_config,
    'syndication' => $syndication_config
];

?>
