// File Location: /api/blog.js

const express = require('express');
const router = express.Router();
const { body, validationResult, query, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, requireModerator } = require('./middleware');
const db = require('./database-config');

// Configure multer for blog image uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/blog-images');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'));
        }
    }
});

// Get all blog posts with pagination and filtering
router.get('/', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('category').optional().trim(),
    query('author').optional().trim(),
    query('search').optional().trim(),
    query('tag').optional().trim(),
    query('status').optional().isIn(['draft', 'published', 'archived']),
    query('sort').optional().isIn(['created_at', 'published_at', 'title', 'views']),
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
        const { category, author, search, tag, status = 'published', sort = 'published_at', order = 'desc' } = req.query;

        let query = `
            SELECT p.*, u.first_name, u.last_name,
                   bc.name as category_name, bc.slug as category_slug,
                   array_agg(DISTINCT bt.name) as tags
            FROM blog_posts p
            JOIN users u ON p.author_id = u.id
            LEFT JOIN blog_categories bc ON p.category_id = bc.id
            LEFT JOIN blog_post_tags bpt ON p.id = bpt.post_id
            LEFT JOIN blog_tags bt ON bpt.tag_id = bt.id
            WHERE p.status = $1
        `;

        const queryParams = [status];
        let paramIndex = 2;

        // Add filters
        if (category) {
            query += ` AND bc.slug = $${paramIndex}`;
            queryParams.push(category);
            paramIndex++;
        }

        if (author) {
            query += ` AND (LOWER(u.first_name) LIKE LOWER($${paramIndex}) OR LOWER(u.last_name) LIKE LOWER($${paramIndex}))`;
            queryParams.push(`%${author}%`);
            paramIndex++;
        }

        if (search) {
            query += ` AND (LOWER(p.title) LIKE LOWER($${paramIndex}) OR LOWER(p.excerpt) LIKE LOWER($${paramIndex}) OR LOWER(p.content) LIKE LOWER($${paramIndex}))`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (tag) {
            query += ` AND EXISTS (
                SELECT 1 FROM blog_post_tags bpt2 
                JOIN blog_tags bt2 ON bpt2.tag_id = bt2.id 
                WHERE bpt2.post_id = p.id AND LOWER(bt2.name) = LOWER($${paramIndex})
            )`;
            queryParams.push(tag);
            paramIndex++;
        }

        // Only show published posts to non-authenticated users
        if (status === 'published') {
            query += ` AND p.published_at <= $${paramIndex}`;
            queryParams.push(new Date());
            paramIndex++;
        }

        query += ` GROUP BY p.id, u.first_name, u.last_name, bc.name, bc.slug`;
        query += ` ORDER BY p.${sort} ${order.toUpperCase()}`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const posts = await db.query(query, queryParams);

        // Get total count
        let countQuery = `
            SELECT COUNT(DISTINCT p.id) as total
            FROM blog_posts p
            JOIN users u ON p.author_id = u.id
            LEFT JOIN blog_categories bc ON p.category_id = bc.id
            LEFT JOIN blog_post_tags bpt ON p.id = bpt.post_id
            LEFT JOIN blog_tags bt ON bpt.tag_id = bt.id
            WHERE p.status = $1
        `;

        const countParams = [status];
        let countParamIndex = 2;

        if (category) {
            countQuery += ` AND bc.slug = $${countParamIndex}`;
            countParams.push(category);
            countParamIndex++;
        }

        if (author) {
            countQuery += ` AND (LOWER(u.first_name) LIKE LOWER($${countParamIndex}) OR LOWER(u.last_name) LIKE LOWER($${countParamIndex}))`;
            countParams.push(`%${author}%`);
            countParamIndex++;
        }

        if (search) {
            countQuery += ` AND (LOWER(p.title) LIKE LOWER($${countParamIndex}) OR LOWER(p.excerpt) LIKE LOWER($${countParamIndex}) OR LOWER(p.content) LIKE LOWER($${countParamIndex}))`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        if (tag) {
            countQuery += ` AND EXISTS (
                SELECT 1 FROM blog_post_tags bpt2 
                JOIN blog_tags bt2 ON bpt2.tag_id = bt2.id 
                WHERE bpt2.post_id = p.id AND LOWER(bt2.name) = LOWER($${countParamIndex})
            )`;
            countParams.push(tag);
            countParamIndex++;
        }

        if (status === 'published') {
            countQuery += ` AND p.published_at <= $${countParamIndex}`;
            countParams.push(new Date());
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            posts: posts.rows.map(post => ({
                ...post,
                tags: post.tags.filter(tag => tag !== null)
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get single blog post by ID or slug
router.get('/:identifier', [
    param('identifier').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid post identifier', errors: errors.array() });
        }

        const { identifier } = req.params;
        
        // Check if identifier is numeric (ID) or string (slug)
        const isNumeric = /^\d+$/.test(identifier);
        const field = isNumeric ? 'p.id' : 'p.slug';

        const query = `
            SELECT p.*, u.first_name, u.last_name, u.email,
                   bc.name as category_name, bc.slug as category_slug,
                   array_agg(DISTINCT bt.name) as tags
            FROM blog_posts p
            JOIN users u ON p.author_id = u.id
            LEFT JOIN blog_categories bc ON p.category_id = bc.id
            LEFT JOIN blog_post_tags bpt ON p.id = bpt.post_id
            LEFT JOIN blog_tags bt ON bpt.tag_id = bt.id
            WHERE ${field} = $1 AND p.status = 'published' AND p.published_at <= $2
            GROUP BY p.id, u.first_name, u.last_name, u.email, bc.name, bc.slug
        `;

        const post = await db.query(query, [identifier, new Date()]);

        if (post.rows.length === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        const postData = post.rows[0];

        // Increment view count
        await db.query('UPDATE blog_posts SET views = views + 1 WHERE id = $1', [postData.id]);

        // Get related posts
        const relatedQuery = `
            SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image, p.published_at,
                   u.first_name, u.last_name
            FROM blog_posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.category_id = $1 AND p.id != $2 AND p.status = 'published' AND p.published_at <= $3
            ORDER BY p.published_at DESC
            LIMIT 3
        `;

        const relatedPosts = await db.query(relatedQuery, [postData.category_id, postData.id, new Date()]);

        res.json({
            post: {
                ...postData,
                tags: postData.tags.filter(tag => tag !== null),
                views: postData.views + 1
            },
            relatedPosts: relatedPosts.rows
        });
    } catch (error) {
        console.error('Error fetching blog post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new blog post (moderator only)
router.post('/', requireModerator, upload.single('featured_image'), [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
    body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
    body('excerpt').optional().trim().isLength({ max: 500 }).withMessage('Excerpt must be less than 500 characters'),
    body('category_id').optional().isInt().withMessage('Category ID must be an integer'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('status').isIn(['draft', 'published']).withMessage('Status must be draft or published'),
    body('meta_title').optional().trim().isLength({ max: 60 }).withMessage('Meta title must be less than 60 characters'),
    body('meta_description').optional().trim().isLength({ max: 160 }).withMessage('Meta description must be less than 160 characters'),
    body('scheduled_publish').optional().isISO8601().withMessage('Scheduled publish date must be a valid date')
], async (req, res) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const {
            title, content, excerpt, category_id, tags = [], status,
            meta_title, meta_description, scheduled_publish
        } = req.body;

        // Generate slug from title
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');

        // Check if slug already exists
        const existingSlug = await client.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
        if (existingSlug.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'A post with similar title already exists' });
        }

        // Handle featured image
        let featuredImage = null;
        if (req.file) {
            featuredImage = `/uploads/blog-images/${req.file.filename}`;
        }

        // Set published date
        let publishedAt = null;
        if (status === 'published') {
            publishedAt = scheduled_publish ? new Date(scheduled_publish) : new Date();
        }

        const query = `
            INSERT INTO blog_posts (
                title, slug, content, excerpt, category_id, author_id,
                featured_image, status, published_at, meta_title, meta_description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const values = [
            title, slug, content, excerpt, category_id || null, req.user.id,
            featuredImage, status, publishedAt, meta_title || null, meta_description || null
        ];

        const result = await client.query(query, values);
        const postId = result.rows[0].id;

        // Handle tags
        if (tags.length > 0) {
            for (const tagName of tags) {
                // Create tag if it doesn't exist
                let tagResult = await client.query('SELECT id FROM blog_tags WHERE LOWER(name) = LOWER($1)', [tagName]);
                
                if (tagResult.rows.length === 0) {
                    tagResult = await client.query(
                        'INSERT INTO blog_tags (name, slug) VALUES ($1, $2) RETURNING id',
                        [tagName, tagName.toLowerCase().replace(/\s+/g, '-')]
                    );
                }

                const tagId = tagResult.rows[0].id;

                // Link tag to post
                await client.query(
                    'INSERT INTO blog_post_tags (post_id, tag_id) VALUES ($1, $2)',
                    [postId, tagId]
                );
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Blog post created successfully',
            post: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating blog post:', error);
        
        // Clean up uploaded file if database operation failed
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }
        
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Update blog post (moderator only)
router.put('/:id', requireModerator, upload.single('featured_image'), [
    param('id').isInt().withMessage('Post ID must be an integer'),
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('content').optional().trim().isLength({ min: 1 }),
    body('excerpt').optional().trim().isLength({ max: 500 }),
    body('category_id').optional().isInt(),
    body('tags').optional().isArray(),
    body('status').optional().isIn(['draft', 'published', 'archived']),
    body('meta_title').optional().trim().isLength({ max: 60 }),
    body('meta_description').optional().trim().isLength({ max: 160 }),
    body('scheduled_publish').optional().isISO8601()
], async (req, res) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { id } = req.params;
        const { tags, scheduled_publish, status, ...updateData } = req.body;

        // Check if post exists
        const existingPost = await client.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
        if (existingPost.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Blog post not found' });
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        // Build dynamic update query
        for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
                updates.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        // Handle status and publish date
        if (status !== undefined) {
            updates.push(`status = $${paramIndex}`);
            values.push(status);
            paramIndex++;

            if (status === 'published' && !existingPost.rows[0].published_at) {
                const publishDate = scheduled_publish ? new Date(scheduled_publish) : new Date();
                updates.push(`published_at = $${paramIndex}`);
                values.push(publishDate);
                paramIndex++;
            }
        }

        // Handle featured image update
        if (req.file) {
            const oldFeaturedImage = existingPost.rows[0].featured_image;
            const newFeaturedImage = `/uploads/blog-images/${req.file.filename}`;
            
            updates.push(`featured_image = $${paramIndex}`);
            values.push(newFeaturedImage);
            paramIndex++;

            // Delete old featured image
            if (oldFeaturedImage) {
                try {
                    await fs.unlink(path.join(__dirname, '..', oldFeaturedImage));
                } catch (error) {
                    console.error('Error deleting old featured image:', error);
                }
            }
        }

        if (updates.length === 0 && !tags) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        // Update post if there are field updates
        if (updates.length > 0) {
            updates.push(`updated_at = $${paramIndex}`);
            values.push(new Date());
            values.push(id);

            const query = `UPDATE blog_posts SET ${updates.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`;
            await client.query(query, values);
        }

        // Handle tags update
        if (tags !== undefined) {
            // Remove existing tags
            await client.query('DELETE FROM blog_post_tags WHERE post_id = $1', [id]);

            // Add new tags
            for (const tagName of tags) {
                let tagResult = await client.query('SELECT id FROM blog_tags WHERE LOWER(name) = LOWER($1)', [tagName]);
                
                if (tagResult.rows.length === 0) {
                    tagResult = await client.query(
                        'INSERT INTO blog_tags (name, slug) VALUES ($1, $2) RETURNING id',
                        [tagName, tagName.toLowerCase().replace(/\s+/g, '-')]
                    );
                }

                const tagId = tagResult.rows[0].id;
                await client.query(
                    'INSERT INTO blog_post_tags (post_id, tag_id) VALUES ($1, $2)',
                    [id, tagId]
                );
            }
        }

        await client.query('COMMIT');

        // Get updated post
        const updatedPost = await db.query('SELECT * FROM blog_posts WHERE id = $1', [id]);

        res.json({
            message: 'Blog post updated successfully',
            post: updatedPost.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating blog post:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Delete blog post (moderator only)
router.delete('/:id', requireModerator, [
    param('id').isInt().withMessage('Post ID must be an integer')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid post ID', errors: errors.array() });
        }

        const { id } = req.params;

        // Check if post exists
        const existingPost = await db.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
        if (existingPost.rows.length === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        // Soft delete by updating status
        await db.query('UPDATE blog_posts SET status = $1, updated_at = $2 WHERE id = $3', ['archived', new Date(), id]);

        res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get blog categories
router.get('/categories/list', async (req, res) => {
    try {
        const query = `
            SELECT bc.*, COUNT(p.id) as post_count
            FROM blog_categories bc
            LEFT JOIN blog_posts p ON bc.id = p.category_id AND p.status = 'published'
            GROUP BY bc.id
            ORDER BY bc.name
        `;

        const categories = await db.query(query);
        res.json({ categories: categories.rows });
    } catch (error) {
        console.error('Error fetching blog categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get blog tags
router.get('/tags/list', async (req, res) => {
    try {
        const query = `
            SELECT bt.*, COUNT(bpt.post_id) as post_count
            FROM blog_tags bt
            LEFT JOIN blog_post_tags bpt ON bt.id = bpt.tag_id
            LEFT JOIN blog_posts p ON bpt.post_id = p.id AND p.status = 'published'
            GROUP BY bt.id
            HAVING COUNT(bpt.post_id) > 0
            ORDER BY post_count DESC, bt.name
            LIMIT 20
        `;

        const tags = await db.query(query);
        res.json({ tags: tags.rows });
    } catch (error) {
        console.error('Error fetching blog tags:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get blog statistics (moderator only)
router.get('/stats/overview', requireModerator, async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_posts,
                COUNT(CASE WHEN status = 'published' THEN 1 END) as published_posts,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_posts,
                SUM(views) as total_views,
                AVG(views) as average_views
            FROM blog_posts
        `);

        const recentPosts = await db.query(`
            SELECT COUNT(*) as recent_posts
            FROM blog_posts
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        `);

        res.json({ 
            stats: {
                ...stats.rows[0],
                recent_posts: parseInt(recentPosts.rows[0].recent_posts)
            }
        });
    } catch (error) {
        console.error('Error fetching blog stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
