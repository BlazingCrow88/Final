// File Location: /api/books.js

const express = require('express');
const router = express.Router();
const { body, validationResult, query, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, requireAdmin } = require('./middleware');
const db = require('./database-config');

// Configure multer for book cover uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/book-covers');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
        }
    }
});

// Get all books with pagination and filtering
router.get('/', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().trim(),
    query('author').optional().trim(),
    query('search').optional().trim(),
    query('sort').optional().isIn(['title', 'author', 'price', 'created_at', 'rating']),
    query('order').optional().isIn(['asc', 'desc'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid query parameters', errors: errors.array() });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;
        const { category, author, search, sort = 'created_at', order = 'desc' } = req.query;

        let query = `
            SELECT b.*, c.name as category_name, 
                   AVG(r.rating) as average_rating,
                   COUNT(r.id) as review_count
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN reviews r ON b.id = r.book_id
            WHERE b.status = 'active'
        `;
        
        const queryParams = [];
        let paramIndex = 1;

        // Add filters
        if (category) {
            query += ` AND c.slug = $${paramIndex}`;
            queryParams.push(category);
            paramIndex++;
        }

        if (author) {
            query += ` AND LOWER(b.author) LIKE LOWER($${paramIndex})`;
            queryParams.push(`%${author}%`);
            paramIndex++;
        }

        if (search) {
            query += ` AND (LOWER(b.title) LIKE LOWER($${paramIndex}) OR LOWER(b.author) LIKE LOWER($${paramIndex}) OR LOWER(b.description) LIKE LOWER($${paramIndex}))`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        query += ' GROUP BY b.id, c.name';
        query += ` ORDER BY ${sort} ${order.toUpperCase()}`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const books = await db.query(query, queryParams);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(DISTINCT b.id) as total
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.status = 'active'
        `;
        
        const countParams = [];
        let countParamIndex = 1;

        if (category) {
            countQuery += ` AND c.slug = $${countParamIndex}`;
            countParams.push(category);
            countParamIndex++;
        }

        if (author) {
            countQuery += ` AND LOWER(b.author) LIKE LOWER($${countParamIndex})`;
            countParams.push(`%${author}%`);
            countParamIndex++;
        }

        if (search) {
            countQuery += ` AND (LOWER(b.title) LIKE LOWER($${countParamIndex}) OR LOWER(b.author) LIKE LOWER($${countParamIndex}) OR LOWER(b.description) LIKE LOWER($${countParamIndex}))`;
            countParams.push(`%${search}%`);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            books: books.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get single book by ID or slug
router.get('/:identifier', [
    param('identifier').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid book identifier', errors: errors.array() });
        }

        const { identifier } = req.params;
        
        // Check if identifier is numeric (ID) or string (slug)
        const isNumeric = /^\d+$/.test(identifier);
        const field = isNumeric ? 'b.id' : 'b.slug';

        const query = `
            SELECT b.*, c.name as category_name, c.slug as category_slug,
                   AVG(r.rating) as average_rating,
                   COUNT(r.id) as review_count
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN reviews r ON b.id = r.book_id
            WHERE ${field} = $1 AND b.status = 'active'
            GROUP BY b.id, c.name, c.slug
        `;

        const book = await db.query(query, [identifier]);

        if (book.rows.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Get recent reviews
        const reviewsQuery = `
            SELECT r.*, u.first_name, u.last_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.book_id = $1
            ORDER BY r.created_at DESC
            LIMIT 10
        `;

        const reviews = await db.query(reviewsQuery, [book.rows[0].id]);

        res.json({
            book: book.rows[0],
            reviews: reviews.rows
        });
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new book (admin only)
router.post('/', requireAdmin, upload.single('cover'), [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
    body('author').trim().isLength({ min: 1, max: 255 }).withMessage('Author is required and must be less than 255 characters'),
    body('isbn').optional().trim().isISBN().withMessage('Invalid ISBN format'),
    body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required and must be less than 2000 characters'),
    body('price').isDecimal({ decimal_digits: '0,2' }).withMessage('Price must be a valid decimal number'),
    body('category_id').isInt().withMessage('Category ID must be an integer'),
    body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
    body('publisher').optional().trim().isLength({ max: 255 }),
    body('publication_date').optional().isISO8601().withMessage('Publication date must be a valid date'),
    body('pages').optional().isInt({ min: 1 }).withMessage('Pages must be a positive integer'),
    body('language').optional().trim().isLength({ max: 50 }),
    body('weight').optional().isDecimal().withMessage('Weight must be a decimal number'),
    body('dimensions').optional().trim().isLength({ max: 100 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const {
            title, author, isbn, description, price, category_id,
            stock_quantity, publisher, publication_date, pages,
            language = 'English', weight, dimensions
        } = req.body;

        // Generate slug from title
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');

        // Check if slug already exists
        const existingSlug = await db.query('SELECT id FROM books WHERE slug = $1', [slug]);
        if (existingSlug.rows.length > 0) {
            return res.status(400).json({ message: 'A book with similar title already exists' });
        }

        // Handle cover image
        let coverImage = null;
        if (req.file) {
            coverImage = `/uploads/book-covers/${req.file.filename}`;
        }

        const query = `
            INSERT INTO books (
                title, author, isbn, description, price, category_id,
                stock_quantity, publisher, publication_date, pages,
                language, weight, dimensions, cover_image, slug, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `;

        const values = [
            title, author, isbn, description, price, category_id,
            stock_quantity, publisher, publication_date || null, pages || null,
            language, weight || null, dimensions, coverImage, slug, 'active'
        ];

        const result = await db.query(query, values);

        res.status(201).json({
            message: 'Book created successfully',
            book: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating book:', error);
        
        // Clean up uploaded file if database operation failed
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }
        
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update book (admin only)
router.put('/:id', requireAdmin, upload.single('cover'), [
    param('id').isInt().withMessage('Book ID must be an integer'),
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('author').optional().trim().isLength({ min: 1, max: 255 }),
    body('isbn').optional().trim().isISBN(),
    body('description').optional().trim().isLength({ min: 1, max: 2000 }),
    body('price').optional().isDecimal({ decimal_digits: '0,2' }),
    body('category_id').optional().isInt(),
    body('stock_quantity').optional().isInt({ min: 0 }),
    body('publisher').optional().trim().isLength({ max: 255 }),
    body('publication_date').optional().isISO8601(),
    body('pages').optional().isInt({ min: 1 }),
    body('language').optional().trim().isLength({ max: 50 }),
    body('weight').optional().isDecimal(),
    body('dimensions').optional().trim().isLength({ max: 100 }),
    body('status').optional().isIn(['active', 'inactive', 'out_of_stock'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { id } = req.params;

        // Check if book exists
        const existingBook = await db.query('SELECT * FROM books WHERE id = $1', [id]);
        if (existingBook.rows.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        // Build dynamic update query
        for (const [key, value] of Object.entries(req.body)) {
            if (value !== undefined) {
                updates.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        // Handle cover image update
        if (req.file) {
            const oldCoverImage = existingBook.rows[0].cover_image;
            const newCoverImage = `/uploads/book-covers/${req.file.filename}`;
            
            updates.push(`cover_image = $${paramIndex}`);
            values.push(newCoverImage);
            paramIndex++;

            // Delete old cover image
            if (oldCoverImage) {
                try {
                    await fs.unlink(path.join(__dirname, '..', oldCoverImage));
                } catch (error) {
                    console.error('Error deleting old cover image:', error);
                }
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        updates.push(`updated_at = $${paramIndex}`);
        values.push(new Date());
        values.push(id);

        const query = `UPDATE books SET ${updates.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`;
        const result = await db.query(query, values);

        res.json({
            message: 'Book updated successfully',
            book: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete book (admin only)
router.delete('/:id', requireAdmin, [
    param('id').isInt().withMessage('Book ID must be an integer')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid book ID', errors: errors.array() });
        }

        const { id } = req.params;

        // Check if book exists
        const existingBook = await db.query('SELECT * FROM books WHERE id = $1', [id]);
        if (existingBook.rows.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Soft delete by updating status
        await db.query('UPDATE books SET status = $1, updated_at = $2 WHERE id = $3', ['deleted', new Date(), id]);

        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get book categories
router.get('/categories/list', async (req, res) => {
    try {
        const query = `
            SELECT c.*, COUNT(b.id) as book_count
            FROM categories c
            LEFT JOIN books b ON c.id = b.category_id AND b.status = 'active'
            WHERE c.status = 'active'
            GROUP BY c.id
            ORDER BY c.name
        `;

        const categories = await db.query(query);
        res.json({ categories: categories.rows });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add book review
router.post('/:id/reviews', authenticateToken, [
    param('id').isInt().withMessage('Book ID must be an integer'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        // Check if book exists
        const book = await db.query('SELECT id FROM books WHERE id = $1 AND status = $2', [id, 'active']);
        if (book.rows.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Check if user already reviewed this book
        const existingReview = await db.query('SELECT id FROM reviews WHERE book_id = $1 AND user_id = $2', [id, userId]);
        if (existingReview.rows.length > 0) {
            return res.status(400).json({ message: 'You have already reviewed this book' });
        }

        const query = `
            INSERT INTO reviews (book_id, user_id, rating, comment)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const result = await db.query(query, [id, userId, rating, comment]);

        res.status(201).json({
            message: 'Review added successfully',
            review: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
