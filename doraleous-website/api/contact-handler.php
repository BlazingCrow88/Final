/* ===================================
   CONTACT FORM HANDLER
   File: api/contact-handler.php
   =================================== */

<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Configuration
$config = [
    'email' => [
        'to' => 'author@example.com', // Replace with your email
        'from_name' => 'Website Contact Form',
        'smtp_host' => 'smtp.gmail.com',
        'smtp_port' => 587,
        'smtp_username' => 'your-email@gmail.com', // Replace with your SMTP username
        'smtp_password' => 'your-app-password', // Replace with your SMTP password
        'smtp_encryption' => 'tls'
    ],
    'security' => [
        'rate_limit' => 5, // Max submissions per hour per IP
        'honeypot_field' => 'website', // Hidden field to catch bots
        'required_fields' => ['name', 'email', 'message']
    ]
];

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data');
    }

    // Sanitize and validate input
    $data = [
        'name' => sanitizeInput($input['name'] ?? ''),
        'email' => sanitizeInput($input['email'] ?? ''),
        'subject' => sanitizeInput($input['subject'] ?? 'Contact Form Submission'),
        'message' => sanitizeInput($input['message'] ?? ''),
        'phone' => sanitizeInput($input['phone'] ?? ''),
        'website' => sanitizeInput($input['website'] ?? '') // Honeypot field
    ];

    // Security checks
    performSecurityChecks($data, $config);

    // Validate required fields
    validateRequiredFields($data, $config['security']['required_fields']);

    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email address');
    }

    // Rate limiting
    if (!checkRateLimit($config['security']['rate_limit'])) {
        throw new Exception('Too many submissions. Please wait before submitting again.');
    }

    // Send email
    $emailSent = sendContactEmail($data, $config['email']);
    
    if (!$emailSent) {
        throw new Exception('Failed to send email. Please try again later.');
    }

    // Log submission
    logSubmission($data);

    // Send auto-response
    sendAutoResponse($data, $config['email']);

    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your message! We\'ll get back to you soon.'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function sanitizeInput($input) {
    $input = trim($input);
    $input = stripslashes($input);
    $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    return $input;
}

function performSecurityChecks($data, $config) {
    // Honeypot check
    if (!empty($data[$config['security']['honeypot_field']])) {
        throw new Exception('Security check failed');
    }

    // Check for suspicious content
    $suspicious_patterns = [
        'viagra', 'cialis', 'casino', 'poker', 'loan', 'mortgage',
        '<script', 'javascript:', 'onclick=', 'onload=', 'eval(',
        'base64_decode', 'gzinflate', 'str_rot13'
    ];

    $content = strtolower($data['name'] . ' ' . $data['email'] . ' ' . $data['message']);
    foreach ($suspicious_patterns as $pattern) {
        if (strpos($content, $pattern) !== false) {
            throw new Exception('Message contains prohibited content');
        }
    }

    // Check message length
    if (strlen($data['message']) < 10) {
        throw new Exception('Message is too short');
    }

    if (strlen($data['message']) > 5000) {
        throw new Exception('Message is too long');
    }
}

function validateRequiredFields($data, $required_fields) {
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            throw new Exception("Field '{$field}' is required");
        }
    }
}

function checkRateLimit($max_submissions) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $rate_limit_file = 'rate_limits.json';
    $current_time = time();
    $hour_ago = $current_time - 3600;

    // Load existing rate limits
    $rate_limits = [];
    if (file_exists($rate_limit_file)) {
        $rate_limits = json_decode(file_get_contents($rate_limit_file), true) ?: [];
    }

    // Clean old entries
    $rate_limits = array_filter($rate_limits, function($timestamp) use ($hour_ago) {
        return $timestamp > $hour_ago;
    });

    // Check current IP
    $ip_submissions = array_filter($rate_limits, function($timestamp, $stored_ip) use ($ip) {
        return $stored_ip === $ip;
    }, ARRAY_FILTER_USE_BOTH);

    if (count($ip_submissions) >= $max_submissions) {
        return false;
    }

    // Add current submission
    $rate_limits[$ip . '_' . $current_time] = $current_time;

    // Save rate limits
    file_put_contents($rate_limit_file, json_encode($rate_limits));

    return true;
}

function sendContactEmail($data, $email_config) {
    // Use PHPMailer for better email handling
    require_once 'vendor/autoload.php';
    
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host = $email_config['smtp_host'];
        $mail->SMTPAuth = true;
        $mail->Username = $email_config['smtp_username'];
        $mail->Password = $email_config['smtp_password'];
        $mail->SMTPSecure = $email_config['smtp_encryption'];
        $mail->Port = $email_config['smtp_port'];

        // Recipients
        $mail->setFrom($email_config['smtp_username'], $email_config['from_name']);
        $mail->addAddress($email_config['to']);
        $mail->addReplyTo($data['email'], $data['name']);

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'New Contact Form Submission: ' . $data['subject'];
        
        $mail->Body = generateEmailTemplate($data);
        $mail->AltBody = generateTextEmail($data);

        $mail->send();
        return true;

    } catch (Exception $e) {
        error_log("Email sending failed: " . $mail->ErrorInfo);
        return false;
    }
}

function sendAutoResponse($data, $email_config) {
    require_once 'vendor/autoload.php';
    
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = $email_config['smtp_host'];
        $mail->SMTPAuth = true;
        $mail->Username = $email_config['smtp_username'];
        $mail->Password = $email_config['smtp_password'];
        $mail->SMTPSecure = $email_config['smtp_encryption'];
        $mail->Port = $email_config['smtp_port'];

        $mail->setFrom($email_config['smtp_username'], 'Author Name');
        $mail->addAddress($data['email'], $data['name']);

        $mail->isHTML(true);
        $mail->Subject = 'Thank you for contacting us!';
        
        $mail->Body = generateAutoResponseTemplate($data);

        $mail->send();

    } catch (Exception $e) {
        error_log("Auto-response failed: " . $mail->ErrorInfo);
    }
}

function generateEmailTemplate($data) {
    return "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #333; }
            .value { margin-top: 5px; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>New Contact Form Submission</h2>
            </div>
            <div class='content'>
                <div class='field'>
                    <div class='label'>Name:</div>
                    <div class='value'>{$data['name']}</div>
                </div>
                <div class='field'>
                    <div class='label'>Email:</div>
                    <div class='value'>{$data['email']}</div>
                </div>
                <div class='field'>
                    <div class='label'>Subject:</div>
                    <div class='value'>{$data['subject']}</div>
                </div>
                " . (!empty($data['phone']) ? "
                <div class='field'>
                    <div class='label'>Phone:</div>
                    <div class='value'>{$data['phone']}</div>
                </div>
                " : "") . "
                <div class='field'>
                    <div class='label'>Message:</div>
                    <div class='value'>" . nl2br($data['message']) . "</div>
                </div>
                <div class='field'>
                    <div class='label'>Submitted:</div>
                    <div class='value'>" . date('Y-m-d H:i:s') . "</div>
                </div>
                <div class='field'>
                    <div class='label'>IP Address:</div>
                    <div class='value'>{$_SERVER['REMOTE_ADDR']}</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    ";
}

function generateTextEmail($data) {
    return "
New Contact Form Submission

Name: {$data['name']}
Email: {$data['email']}
Subject: {$data['subject']}
" . (!empty($data['phone']) ? "Phone: {$data['phone']}\n" : "") . "

Message:
{$data['message']}

Submitted: " . date('Y-m-d H:i:s') . "
IP Address: {$_SERVER['REMOTE_ADDR']}
    ";
}

function generateAutoResponseTemplate($data) {
    return "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>Thank You for Contacting Us!</h2>
            </div>
            <div class='content'>
                <p>Dear {$data['name']},</p>
                <p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible, typically within 24-48 hours.</p>
                <p><strong>Your message summary:</strong></p>
                <p><em>{$data['subject']}</em></p>
                <p>If you have any urgent questions, please don't hesitate to contact us directly.</p>
                <p>Best regards,<br>Author Name</p>
            </div>
        </div>
    </body>
    </html>
    ";
}

function logSubmission($data) {
    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'],
        'name' => $data['name'],
        'email' => $data['email'],
        'subject' => $data['subject'],
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
    ];

    $log_file = 'contact_submissions.log';
    file_put_contents($log_file, json_encode($log_entry) . "\n", FILE_APPEND | LOCK_EX);
}
?>
