// File Location: /api/orders.js

const express = require('express');
const router = express.Router();
const { body, validationResult, query, param } = require('express-validator');
const { authenticateToken, requireAdmin } = require('./middleware');
const db = require('./database-config');

// Get user's orders
router.get('/my-orders', authenticateToken, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid query parameters', errors: errors.array() });
        }

        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { status } = req.query;

        let query = `
            SELECT o.*, 
                   json_agg(
                       json_build_object(
                           'book_id', oi.book_id,
                           'book_title', b.title,
                           'book_author', b.author,
                           'book_cover', b.cover_image,
                           'quantity', oi.quantity,
                           'price', oi.price,
                           'total', oi.total
                       )
                   ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN books b ON oi.book_id = b.id
            WHERE o.user_id = $1
        `;

        const queryParams = [userId];
        let paramIndex = 2;

        if (status) {
            query += ` AND o.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        query += ` GROUP BY o.id ORDER BY o.created_at DESC`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const orders = await db.query(query, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = $1';
        const countParams = [userId];

        if (status) {
            countQuery += ' AND status = $2';
            countParams.push(status);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            orders: orders.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all orders (admin only)
router.get('/', requireAdmin, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
    query('user_email').optional().trim(),
    query('order_number').optional().trim(),
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid query parameters', errors: errors.array() });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { status, user_email, order_number, date_from, date_to } = req.query;

        let query = `
            SELECT o.*, u.first_name, u.last_name, u.email,
                   COUNT(oi.id) as item_count
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE 1=1
        `;

        const queryParams = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND o.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        if (user_email) {
            query += ` AND LOWER(u.email) LIKE LOWER($${paramIndex})`;
            queryParams.push(`%${user_email}%`);
            paramIndex++;
        }

        if (order_number) {
            query += ` AND o.order_number LIKE $${paramIndex}`;
            queryParams.push(`%${order_number}%`);
            paramIndex++;
        }

        if (date_from) {
            query += ` AND o.created_at >= $${paramIndex}`;
            queryParams.push(date_from);
            paramIndex++;
        }

        if (date_to) {
            query += ` AND o.created_at <= $${paramIndex}`;
            queryParams.push(date_to);
            paramIndex++;
        }

        query += ` GROUP BY o.id, u.first_name, u.last_name, u.email`;
        query += ` ORDER BY o.created_at DESC`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const orders = await db.query(query, queryParams);

        // Get total count
        let countQuery = `
            SELECT COUNT(DISTINCT o.id) as total
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE 1=1
        `;
        const countParams = [];
        let countParamIndex = 1;

        if (status) {
            countQuery += ` AND o.status = $${countParamIndex}`;
            countParams.push(status);
            countParamIndex++;
        }

        if (user_email) {
            countQuery += ` AND LOWER(u.email) LIKE LOWER($${countParamIndex})`;
            countParams.push(`%${user_email}%`);
            countParamIndex++;
        }

        if (order_number) {
            countQuery += ` AND o.order_number LIKE $${countParamIndex}`;
            countParams.push(`%${order_number}%`);
            countParamIndex++;
        }

        if (date_from) {
            countQuery += ` AND o.created_at >= $${countParamIndex}`;
            countParams.push(date_from);
            countParamIndex++;
        }

        if (date_to) {
            countQuery += ` AND o.created_at <= $${countParamIndex}`;
            countParams.push(date_to);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            orders: orders.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get single order
router.get('/:id', authenticateToken, [
    param('id').isInt().withMessage('Order ID must be an integer')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid order ID', errors: errors.array() });
        }

        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

        // Get order details
        let orderQuery = `
            SELECT o.*, u.first_name, u.last_name, u.email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = $1
        `;

        const orderParams = [id];

        // Non-admin users can only see their own orders
        if (!isAdmin) {
            orderQuery += ' AND o.user_id = $2';
            orderParams.push(userId);
        }

        const orderResult = await db.query(orderQuery, orderParams);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // Get order items
        const itemsQuery = `
            SELECT oi.*, b.title, b.author, b.cover_image
            FROM order_items oi
            JOIN books b ON oi.book_id = b.id
            WHERE oi.order_id = $1
            ORDER BY oi.id
        `;

        const items = await db.query(itemsQuery, [id]);

        res.json({
            order,
            items: items.rows
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new order
router.post('/', authenticateToken, [
    body('items').isArray({ min: 1 }).withMessage('Items array is required and must not be empty'),
    body('items.*.book_id').isInt().withMessage('Book ID must be an integer'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('shipping_address').notEmpty().withMessage('Shipping address is required'),
    body('shipping_address.street').trim().isLength({ min: 1 }).withMessage('Street address is required'),
    body('shipping_address.city').trim().isLength({ min: 1 }).withMessage('City is required'),
    body('shipping_address.state').trim().isLength({ min: 1 }).withMessage('State is required'),
    body('shipping_address.postal_code').trim().isLength({ min: 1 }).withMessage('Postal code is required'),
    body('shipping_address.country').trim().isLength({ min: 1 }).withMessage('Country is required'),
    body('payment_method').isIn(['card', 'paypal', 'bank_transfer']).withMessage('Invalid payment method')
], async (req, res) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { items, shipping_address, payment_method, notes } = req.body;
        const userId = req.user.id;

        // Generate order number
        const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();

        // Validate and calculate totals
        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
            const bookQuery = await client.query(
                'SELECT id, title, price, stock_quantity FROM books WHERE id = $1 AND status = $2',
                [item.book_id, 'active']
            );

            if (bookQuery.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: `Book with ID ${item.book_id} not found` });
            }

            const book = bookQuery.rows[0];

            if (book.stock_quantity < item.quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    message: `Insufficient stock for "${book.title}". Available: ${book.stock_quantity}, Requested: ${item.quantity}` 
                });
            }

            const itemTotal = parseFloat(book.price) * item.quantity;
            subtotal += itemTotal;

            validatedItems.push({
                book_id: item.book_id,
                quantity: item.quantity,
                price: book.price,
                total: itemTotal
            });
        }

        // Calculate shipping and tax (simplified)
        const shipping = subtotal > 50 ? 0 : 9.99;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + shipping + tax;

        // Create order
        const orderQuery = `
            INSERT INTO orders (
                user_id, order_number, subtotal, shipping, tax, total,
                status, shipping_address, payment_method, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        const orderValues = [
            userId, orderNumber, subtotal, shipping, tax, total,
            'pending', JSON.stringify(shipping_address), payment_method, notes || null
        ];

        const orderResult = await client.query(orderQuery, orderValues);
        const order = orderResult.rows[0];

        // Create order items and update stock
        for (const item of validatedItems) {
            // Insert order item
            await client.query(
                'INSERT INTO order_items (order_id, book_id, quantity, price, total) VALUES ($1, $2, $3, $4, $5)',
                [order.id, item.book_id, item.quantity, item.price, item.total]
            );

            // Update book stock
            await client.query(
                'UPDATE books SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [item.quantity, item.book_id]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Order created successfully',
            order: {
                ...order,
                items: validatedItems
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Update order status (admin only)
router.patch('/:id/status', requireAdmin, [
    param('id').isInt().withMessage('Order ID must be an integer'),
    body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
    body('tracking_number').optional().trim(),
    body('notes').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { id } = req.params;
        const { status, tracking_number, notes } = req.body;

        // Check if order exists
        const existingOrder = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (existingOrder.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update order
        const updateQuery = `
            UPDATE orders 
            SET status = $1, tracking_number = $2, notes = $3, updated_at = $4
            WHERE id = $5
            RETURNING *
        `;

        const result = await db.query(updateQuery, [
            status,
            tracking_number || null,
            notes || null,
            new Date(),
            id
        ]);

        // Log status change
        await db.query(
            'INSERT INTO order_status_history (order_id, status, changed_by, notes) VALUES ($1, $2, $3, $4)',
            [id, status, req.user.id, notes || null]
        );

        res.json({
            message: 'Order status updated successfully',
            order: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Cancel order
router.patch('/:id/cancel', authenticateToken, [
    param('id').isInt().withMessage('Order ID must be an integer'),
    body('reason').optional().trim()
], async (req, res) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Invalid order ID', errors: errors.array() });
        }

        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

        // Get order
        let orderQuery = 'SELECT * FROM orders WHERE id = $1';
        const orderParams = [id];

        if (!isAdmin) {
            orderQuery += ' AND user_id = $2';
            orderParams.push(userId);
        }

        const orderResult = await client.query(orderQuery, orderParams);

        if (orderResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // Check if order can be cancelled
        if (order.status === 'cancelled') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Order is already cancelled' });
        }

        if (order.status === 'delivered') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Cannot cancel delivered order' });
        }

        // Only allow users to cancel pending/confirmed orders
        if (!isAdmin && !['pending', 'confirmed'].includes(order.status)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
        }

        // Restore stock quantities
        const itemsResult = await client.query('SELECT book_id, quantity FROM order_items WHERE order_id = $1', [id]);
        
        for (const item of itemsResult.rows) {
            await client.query(
                'UPDATE books SET stock_quantity = stock_quantity + $1 WHERE id = $2',
                [item.quantity, item.book_id]
            );
        }

        // Update order status
        await client.query(
            'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3',
            ['cancelled', new Date(), id]
        );

        // Log cancellation
        await client.query(
            'INSERT INTO order_status_history (order_id, status, changed_by, notes) VALUES ($1, $2, $3, $4)',
            [id, 'cancelled', userId, reason || 'Cancelled by user']
        );

        await client.query('COMMIT');

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Get order statistics (admin only)
router.get('/stats/overview', requireAdmin, async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
                COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
                SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END) as total_revenue,
                AVG(CASE WHEN status != 'cancelled' THEN total ELSE NULL END) as average_order_value
            FROM orders
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        `);

        res.json({ stats: stats.rows[0] });
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
