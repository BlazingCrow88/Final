// File Location: /server.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Import database config and API routes
const { initializeDatabaseTables } = require('./config/database-config');
const apiRoutes = require('./api/api-routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Serve static files from public_html directory
app.use(express.static(path.join(__dirname, 'public_html')));

// API routes
app.use('/api', apiRoutes);

// Handle client-side routing - serve index.html for unknown routes
app.get('*', (req, res) => {
    // Check if the request is for an API endpoint
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    
    // For all other routes, serve the appropriate HTML file or index.html
    const requestedPath = path.join(__dirname, 'public_html', req.url);
    
    // Check if HTML file exists for the requested path
    const fs = require('fs');
    
    // Try to serve the exact file
    if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
        return res.sendFile(requestedPath);
    }
    
    // Try to serve index.html in the directory
    const indexPath = path.join(requestedPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    
    // Default to main index.html
    res.sendFile(path.join(__dirname, 'public_html', 'index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('Initializing database...');
        const dbInitialized = await initializeDatabaseTables();
        
        if (!dbInitialized) {
            console.error('Failed to initialize database. Exiting...');
            process.exit(1);
        }
        
        app.listen(PORT, () => {
            console.log(`
🚀 Brian M. Shoemaker Author Website Server
📚 Book: Doraleous and Associates: A Tale of Glory
🌐 Server running on port ${PORT}
📂 Serving static files from: public_html/
🔗 API endpoints available at: /api
📊 Environment: ${process.env.NODE_ENV || 'development'}
            `);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();
