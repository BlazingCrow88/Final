<?php
/* ===================================
   DATABASE CONFIGURATION
   File: config/database-config.php
   =================================== */

// Prevent direct access
if (!defined('INCLUDED_FROM_MAIN')) {
    die('Direct access not permitted');
}

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

// Database configuration based on environment
$environment = $_ENV['ENVIRONMENT'] ?? 'development';

switch ($environment) {
    case 'production':
        $db_config = [
            'host' => $_ENV['DB_HOST'] ?? 'localhost',
            'database' => $_ENV['DB_NAME'] ?? 'brianmshoemaker_prod',
            'username' => $_ENV['DB_USER'] ?? '',
            'password' => $_ENV['DB_PASS'] ?? '',
            'port' => $_ENV['DB_PORT'] ?? 3306,
            'charset' => 'utf8mb4',
            'options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => true
            ]
        ];
        break;
        
    case 'staging':
        $db_config = [
            'host' => $_ENV['DB_HOST'] ?? 'localhost',
            'database' => $_ENV['DB_NAME'] ?? 'brianmshoemaker_staging',
            'username' => $_ENV['DB_USER'] ?? '',
            'password' => $_ENV['DB_PASS'] ?? '',
            'port' => $_ENV['DB_PORT'] ?? 3306,
            'charset' => 'utf8mb4',
            'options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        ];
        break;
        
    default: // development
        $db_config = [
            'host' => 'localhost',
            'database' => 'brianmshoemaker_dev',
            'username' => 'root',
            'password' => '',
            'port' => 3306,
            'charset' => 'utf8mb4',
            'options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        ];
        break;
}

/**
 * Database connection singleton class
 */
class DatabaseConnection {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        global $db_config;
        
        try {
            $dsn = sprintf(
                "mysql:host=%s;port=%d;dbname=%s;charset=%s",
                $db_config['host'],
                $db_config['port'],
                $db_config['database'],
                $db_config['charset']
            );
            
            $this->connection = new PDO(
                $dsn,
                $db_config['username'],
                $db_config['password'],
                $db_config['options']
            );
            
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new DatabaseConnection();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    // Prevent cloning and unserialization
    private function __clone() {}
    public function __wakeup() {}
}

/**
 * Database table structure definitions
 */
$table_schemas = [
    'contact_submissions' => "
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            newsletter_signup BOOLEAN DEFAULT FALSE,
            ip_address VARCHAR(45),
            user_agent TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('unread', 'read', 'replied', 'archived') DEFAULT 'unread',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_submitted_at (submitted_at),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",
    
    'newsletter_subscribers' => "
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            subscription_source VARCHAR(100),
            confirmed BOOLEAN DEFAULT FALSE,
            confirmation_token VARCHAR(255),
            confirmation_sent_at TIMESTAMP NULL,
            confirmed_at TIMESTAMP NULL,
            unsubscribed_at TIMESTAMP NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_confirmed (confirmed),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",
    
    'book_reviews' => "
        CREATE TABLE IF NOT EXISTS book_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reviewer_name VARCHAR(255) NOT NULL,
            reviewer_location VARCHAR(255),
            reviewer_email VARCHAR(255),
            book_title VARCHAR(255) NOT NULL,
            rating INT CHECK (rating >= 1 AND rating <= 5),
            review_title VARCHAR(255) NOT NULL,
            review_text TEXT NOT NULL,
            verified_purchase BOOLEAN DEFAULT FALSE,
            helpful_votes INT DEFAULT 0,
            status ENUM('pending', 'approved', 'rejected', 'featured') DEFAULT 'pending',
            ip_address VARCHAR(45),
            user_agent TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_book_title (book_title),
            INDEX idx_rating (rating),
            INDEX idx_status (status),
            INDEX idx_submitted_at (submitted_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",
    
    'blog_comments' => "
        CREATE TABLE IF NOT EXISTS blog_comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_slug VARCHAR(255) NOT NULL,
            commenter_name VARCHAR(255) NOT NULL,
            commenter_email VARCHAR(255) NOT NULL,
            commenter_website VARCHAR(255),
            comment_text TEXT NOT NULL,
            parent_comment_id INT NULL,
            status ENUM('pending', 'approved', 'spam', 'rejected') DEFAULT 'pending',
            ip_address VARCHAR(45),
            user_agent TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_comment_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
            INDEX idx_post_slug (post_slug),
            INDEX idx_status (status),
            INDEX idx_submitted_at (submitted_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",
    
    'analytics_events' => "
        CREATE TABLE IF NOT EXISTS analytics_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_type VARCHAR(100) NOT NULL,
            event_data JSON,
            page_url VARCHAR(500),
            referrer_url VARCHAR(500),
            user_session VARCHAR(255),
            ip_address VARCHAR(45),
            user_agent TEXT,
            country_code VARCHAR(2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_event_type (event_type),
            INDEX idx_user_session (user_session),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    "
];

/**
 * Initialize database tables
 */
function initializeDatabaseTables() {
    global $table_schemas;
    
    try {
        $db = DatabaseConnection::getInstance()->getConnection();
        
        foreach ($table_schemas as $table_name => $schema) {
            $db->exec($schema);
            error_log("Table '{$table_name}' initialized successfully");
        }
        
        return true;
        
    } catch (Exception $e) {
        error_log("Failed to initialize database tables: " . $e->getMessage());
        return false;
    }
}

/**
 * Database utility functions
 */
class DatabaseUtils {
    
    /**
     * Sanitize input for database insertion
     */
    public static function sanitizeInput($input) {
        if (is_array($input)) {
            return array_map([self::class, 'sanitizeInput'], $input);
        }
        
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Validate email address
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Generate secure token
     */
    public static function generateSecureToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    /**
     * Log database operation
     */
    public static function logOperation($operation, $data = []) {
        $log_entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'operation' => $operation,
            'data' => $data,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        
        error_log("DB Operation: " . json_encode($log_entry));
    }
    
    /**
     * Check database connection health
     */
    public static function checkConnectionHealth() {
        try {
            $db = DatabaseConnection::getInstance()->getConnection();
            $stmt = $db->query('SELECT 1');
            return $stmt !== false;
        } catch (Exception $e) {
            error_log("Database health check failed: " . $e->getMessage());
            return false;
        }
    }
}

/**
 * Contact form submission handler
 */
class ContactFormHandler {
    
    public static function submitForm($data) {
        try {
            $db = DatabaseConnection::getInstance()->getConnection();
            
            // Sanitize input data
            $sanitized_data = DatabaseUtils::sanitizeInput($data);
            
            // Validate required fields
            if (empty($sanitized_data['firstName']) || 
                empty($sanitized_data['lastName']) || 
                empty($sanitized_data['email']) || 
                empty($sanitized_data['subject']) || 
                empty($sanitized_data['message'])) {
                throw new Exception("Required fields are missing");
            }
            
            // Validate email
            if (!DatabaseUtils::validateEmail($sanitized_data['email'])) {
                throw new Exception("Invalid email address");
            }
            
            // Insert submission
            $stmt = $db->prepare("
                INSERT INTO contact_submissions 
                (first_name, last_name, email, phone, subject, message, newsletter_signup, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $sanitized_data['firstName'],
                $sanitized_data['lastName'],
                $sanitized_data['email'],
                $sanitized_data['phone'] ?? '',
                $sanitized_data['subject'],
                $sanitized_data['message'],
                isset($sanitized_data['newsletter']) ? 1 : 0,
                $_SERVER['REMOTE_ADDR'] ?? '',
                $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);
            
            if ($result) {
                // If newsletter signup requested, add to newsletter
                if (isset($sanitized_data['newsletter']) && $sanitized_data['newsletter']) {
                    NewsletterHandler::subscribe($sanitized_data['email'], $sanitized_data['firstName'], $sanitized_data['lastName']);
                }
                
                DatabaseUtils::logOperation('contact_form_submitted', ['email' => $sanitized_data['email']]);
                return ['success' => true, 'message' => 'Form submitted successfully'];
            }
            
            throw new Exception("Failed to insert form submission");
            
        } catch (Exception $e) {
            error_log("Contact form submission error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}

/**
 * Newsletter subscription handler
 */
class NewsletterHandler {
    
    public static function subscribe($email, $firstName = '', $lastName = '', $source = 'website') {
        try {
            $db = DatabaseConnection::getInstance()->getConnection();
            
            // Validate email
            if (!DatabaseUtils::validateEmail($email)) {
                throw new Exception("Invalid email address");
            }
            
            // Check if already subscribed
            $stmt = $db->prepare("SELECT id FROM newsletter_subscribers WHERE email = ?");
            $stmt->execute([$email]);
            
            if ($stmt->fetch()) {
                return ['success' => false, 'message' => 'Email already subscribed'];
            }
            
            // Generate confirmation token
            $token = DatabaseUtils::generateSecureToken();
            
            // Insert subscription
            $stmt = $db->prepare("
                INSERT INTO newsletter_subscribers 
                (email, first_name, last_name, subscription_source, confirmation_token, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $email,
                $firstName,
                $lastName,
                $source,
                $token,
                $_SERVER['REMOTE_ADDR'] ?? '',
                $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);
            
            if ($result) {
                // TODO: Send confirmation email
                DatabaseUtils::logOperation('newsletter_subscription', ['email' => $email]);
                return ['success' => true, 'message' => 'Subscription successful', 'token' => $token];
            }
            
            throw new Exception("Failed to create subscription");
            
        } catch (Exception $e) {
            error_log("Newsletter subscription error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    public static function confirmSubscription($token) {
        try {
            $db = DatabaseConnection::getInstance()->getConnection();
            
            $stmt = $db->prepare("
                UPDATE newsletter_subscribers 
                SET confirmed = 1, confirmed_at = CURRENT_TIMESTAMP 
                WHERE confirmation_token = ? AND confirmed = 0
            ");
            
            $result = $stmt->execute([$token]);
            
            if ($stmt->rowCount() > 0) {
                DatabaseUtils::logOperation('newsletter_confirmed', ['token' => $token]);
                return ['success' => true, 'message' => 'Subscription confirmed'];
            }
            
            return ['success' => false, 'message' => 'Invalid or expired confirmation token'];
            
        } catch (Exception $e) {
            error_log("Newsletter confirmation error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}

// Initialize database tables if this script is run directly
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    define('INCLUDED_FROM_MAIN', true);
    
    if (initializeDatabaseTables()) {
        echo "Database tables initialized successfully\n";
    } else {
        echo "Failed to initialize database tables\n";
        exit(1);
    }
}

?>
