const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const pool = require('../config/database');
const { verifyCsrf, requireAuth, requireAdmin } = require('../middleware/security');
const payment = require('../services/razorpay');
const { calculateTotals } = require('../services/pricing');

const router = express.Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const registrationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const reservationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedCategories = new Set([
    'Indian Starters', 'Tandoori Specials', 'North Indian Main Course',
    'South Indian Specialties', 'Biryani and Rice', 'Indian Breads',
    'Desserts', 'Beverages', "Chef's Special"
]);

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const publicCustomer = ({ id, full_name, email, role }) => ({ id, fullName: full_name, email, role });
const positiveInt = (value, max = 20) => Number.isInteger(Number(value)) && Number(value) > 0 && Number(value) <= max;
const validImageUrl = (value) => {
    if (value === '') return true;
    try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
        return false;
    }
};

router.get('/csrf', (req, res) => {
    if (!req.session.csrfToken) {
        const crypto = require('node:crypto');
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    res.json({ csrfToken: req.session.csrfToken });
});

router.get('/menu', asyncRoute(async (req, res) => {
    const result = await pool.query(
        `SELECT id, name, description, category, price_paise, image_url, vegetarian, available, featured
         FROM menu_items WHERE available = true ORDER BY featured DESC, category, name`
    );
    res.json({ items: result.rows });
}));

router.post('/auth/register', registrationLimiter, verifyCsrf, asyncRoute(async (req, res) => {
    const fullName = String(req.body.fullName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (fullName.length < 2 || fullName.length > 120 || email.length > 254 || !emailPattern.test(email) || password.length < 12 || password.length > 128) {
        return res.status(400).json({ error: 'Enter a name, valid email, and password with at least 12 characters.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    try {
        const result = await pool.query(
            `INSERT INTO customers (full_name, email, password_hash)
             VALUES ($1, $2, $3) RETURNING id, full_name, email, role`,
            [fullName, email, passwordHash]
        );
        await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
        req.session.customer = publicCustomer(result.rows[0]);
        req.session.cookie.maxAge = 1000 * 60 * 60 * 8;
        res.status(201).json({ customer: req.session.customer });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
        throw error;
    }
}));

router.post('/auth/login', loginLimiter, verifyCsrf, asyncRoute(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (email.length > 254 || !emailPattern.test(email) || !password || password.length > 128) {
        return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const result = await pool.query(
        'SELECT id, full_name, email, role, password_hash FROM customers WHERE email = $1',
        [email]
    );
    const customer = result.rows[0];
    if (!customer) await bcrypt.hash(password, 12);
    const valid = customer && await bcrypt.compare(password, customer.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email or password is incorrect.' });
    await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
    req.session.customer = publicCustomer(customer);
    req.session.cookie.maxAge = req.body.remember === true ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 8;
    res.json({ customer: req.session.customer });
}));

router.get('/auth/me', (req, res) => {
    res.json({ customer: req.session.customer || null });
});

router.patch('/auth/profile', requireAuth, verifyCsrf, asyncRoute(async (req, res) => {
    const fullName = String(req.body.fullName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const currentPassword = String(req.body.currentPassword || '');
    if (fullName.length < 2 || fullName.length > 120 || !emailPattern.test(email) || email.length > 254 ||
        currentPassword.length < 1 || currentPassword.length > 128) {
        return res.status(400).json({ error: 'Enter a valid name, email, and current password.' });
    }
    const account = await pool.query('SELECT password_hash FROM customers WHERE id = $1', [req.session.customer.id]);
    if (!account.rowCount || !(await bcrypt.compare(currentPassword, account.rows[0].password_hash))) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    try {
        const updated = await pool.query(
            `UPDATE customers SET full_name = $1, email = $2, updated_at = now()
             WHERE id = $3 RETURNING id, full_name, email, role`,
            [fullName, email, req.session.customer.id]
        );
        req.session.customer = publicCustomer(updated.rows[0]);
        res.json({ customer: req.session.customer });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
        throw error;
    }
}));

router.post('/auth/password-reset', loginLimiter, verifyCsrf, asyncRoute(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (email.length > 254 || !emailPattern.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
        return res.status(503).json({ error: 'Password reset email is not configured. Contact the restaurant for assistance.' });
    }
    const account = await pool.query('SELECT id FROM customers WHERE email = $1', [email]);
    if (account.rowCount) {
        const token = crypto.randomBytes(32).toString('base64url');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await pool.query(
            `INSERT INTO password_reset_tokens (token_hash, customer_id, expires_at)
             VALUES ($1, $2, now() + interval '30 minutes')`,
            [tokenHash, account.rows[0].id]
        );
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
        });
        const resetUrl = new URL('/reset-password.html', process.env.APP_ORIGIN || 'http://localhost:3000');
        resetUrl.searchParams.set('token', token);
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Reset your Midnight Bistro password',
            text: `Use this one-time link within 30 minutes to reset your password: ${resetUrl}\nIf you did not request this, you can ignore this message.`
        });
    }
    res.json({ message: 'If an account exists for that email, reset instructions have been sent.' });
}));

router.post('/auth/password-reset/confirm', loginLimiter, verifyCsrf, asyncRoute(async (req, res) => {
    const token = String(req.body.token || '');
    const password = String(req.body.password || '');
    if (token.length < 32 || token.length > 200 || password.length < 12 || password.length > 128) {
        return res.status(400).json({ error: 'The reset link or new password is invalid.' });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const passwordHash = await bcrypt.hash(password, 12);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const validToken = await client.query(
            `SELECT customer_id FROM password_reset_tokens
             WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE`,
            [tokenHash]
        );
        if (!validToken.rowCount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'The reset link is invalid or has expired.' });
        }
        await client.query('UPDATE customers SET password_hash = $1, updated_at = now() WHERE id = $2', [passwordHash, validToken.rows[0].customer_id]);
        await client.query('UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = $1', [tokenHash]);
        await client.query(
            `DELETE FROM user_sessions WHERE sess->'customer'->>'id' = $1`,
            [String(validToken.rows[0].customer_id)]
        );
        await client.query('COMMIT');
        res.json({ message: 'Your password has been updated. You can now sign in.' });
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}));

router.post('/auth/logout', verifyCsrf, (req, res, next) => {
    if (!req.session) return res.status(204).end();
    req.session.destroy((error) => {
        if (error) return next(error);
        res.clearCookie('midnight.sid');
        res.status(204).end();
    });
});

router.post('/contact', contactLimiter, verifyCsrf, asyncRoute(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const phone = String(req.body.phone || '').trim();
    const message = String(req.body.message || '').trim();
    if (name.length < 2 || name.length > 120 || !emailPattern.test(email) || email.length > 254 ||
        phone.length > 30 || message.length < 10 || message.length > 2000) {
        return res.status(400).json({ error: 'Check the contact form and try again.' });
    }
    if (!process.env.SMTP_HOST || !process.env.SMTP_FROM || !process.env.RESTAURANT_CONTACT_EMAIL) {
        return res.status(503).json({ error: 'The enquiry email service is not configured yet. Please contact the restaurant by phone.' });
    }
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
    });
    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.RESTAURANT_CONTACT_EMAIL,
        replyTo: email,
        subject: 'Midnight Bistro website enquiry',
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\n${message}`
    });
    res.json({ message: 'Your enquiry was sent to the restaurant.' });
}));

router.post('/reservations', reservationLimiter, verifyCsrf, asyncRoute(async (req, res) => {
    const { guestName, guestEmail, guestPhone, date, time, notes = '' } = req.body;
    const guestCount = Number(req.body.guestCount);
    const parsedDate = new Date(`${date}T00:00:00Z`);
    const dateIsValid = /^\d{4}-\d{2}-\d{2}$/.test(date || '') &&
        !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date;
    const timeParts = /^(\d{2}):(\d{2})$/.exec(time || '');
    const timeIsValid = timeParts && Number(timeParts[1]) < 24 && Number(timeParts[2]) < 60;
    const businessZone = process.env.BUSINESS_TIME_ZONE || 'Asia/Kolkata';
    const nowParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: businessZone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).reduce((parts, item) => {
        parts[item.type] = item.value;
        return parts;
    }, {});
    const todayInBusinessZone = `${nowParts.year}-${nowParts.month}-${nowParts.day}`;
    const currentTimeInBusinessZone = `${nowParts.hour}:${nowParts.minute}`;
    const capacity = Number(process.env.RESERVATION_CAPACITY_PER_SLOT || 40);
    if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 1000) {
        return res.status(503).json({ error: 'Reservation capacity is not configured correctly.' });
    }
    if (
        typeof guestName !== 'string' || guestName.trim().length < 2 || guestName.length > 120 ||
        typeof guestEmail !== 'string' || guestEmail.length > 254 || !emailPattern.test(guestEmail) ||
        typeof guestPhone !== 'string' || guestPhone.trim().length < 7 || guestPhone.length > 30 ||
        !positiveInt(guestCount, 20) || !dateIsValid || !timeIsValid ||
        date < todayInBusinessZone || (date === todayInBusinessZone && time <= currentTimeInBusinessZone) ||
        typeof notes !== 'string' || notes.length > 1000
    ) {
        return res.status(400).json({ error: 'Check the reservation details and choose a future date and time.' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${date}T${time}`]);
        const slot = await client.query(
            `SELECT COALESCE(SUM(guest_count), 0)::int AS guests
             FROM reservations WHERE reservation_date = $1 AND reservation_time = $2 AND status = 'confirmed'`,
            [date, time]
        );
        if (slot.rows[0].guests + guestCount > capacity) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'That time is full. Please choose another reservation time.' });
        }
        const result = await client.query(
            `INSERT INTO reservations
             (customer_id, guest_name, guest_email, guest_phone, reservation_date, reservation_time, guest_count, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, reservation_date, reservation_time, guest_count, status`,
            [req.session.customer?.id || null, guestName.trim(), guestEmail.trim().toLowerCase(), guestPhone.trim(), date, time, guestCount, notes.trim()]
        );
        await client.query('COMMIT');
        res.status(201).json({ reservation: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}));

router.get('/reservations/mine', requireAuth, asyncRoute(async (req, res) => {
    const result = await pool.query(
        `SELECT id, reservation_date, reservation_time, guest_count, status, created_at
         FROM reservations WHERE customer_id = $1 ORDER BY reservation_date DESC, reservation_time DESC`,
        [req.session.customer.id]
    );
    res.json({ reservations: result.rows });
}));

router.post('/reservations/:id/cancel', requireAuth, verifyCsrf, asyncRoute(async (req, res) => {
    const result = await pool.query(
        `UPDATE reservations SET status = 'cancelled'
         WHERE id = $1 AND customer_id = $2 AND status = 'confirmed'
         RETURNING id, status`,
        [req.params.id, req.session.customer.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Reservation not found or cannot be cancelled.' });
    res.json({ reservation: result.rows[0] });
}));

router.post('/orders', requireAuth, verifyCsrf, asyncRoute(async (req, res) => {
    if (!payment.configured()) {
        return res.status(503).json({ error: 'Online checkout is unavailable until payment credentials are configured. No order was placed.' });
    }
    const lines = req.body.items;
    const address = String(req.body.address || '').trim();
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 30 || address.length < 10 || address.length > 1000) {
        return res.status(400).json({ error: 'Provide order items and a complete delivery address.' });
    }
    const requested = new Map();
    for (const line of lines) {
        if (!line || typeof line !== 'object') {
            return res.status(400).json({ error: 'One or more cart items are invalid.' });
        }
        const id = Number(line.id);
        const quantity = Number(line.quantity);
        if (!Number.isInteger(id) || id < 1 || !positiveInt(quantity)) {
            return res.status(400).json({ error: 'One or more cart items are invalid.' });
        }
        requested.set(id, (requested.get(id) || 0) + quantity);
        if (requested.get(id) > 20) return res.status(400).json({ error: 'An item quantity cannot exceed 20.' });
    }
    const itemResult = await pool.query(
        'SELECT id, name, price_paise FROM menu_items WHERE id = ANY($1::bigint[]) AND available = true',
        [[...requested.keys()]]
    );
    if (itemResult.rows.length !== requested.size) return res.status(409).json({ error: 'A cart item is no longer available. Refresh the menu.' });
    const totals = calculateTotals(itemResult.rows.map((item) => ({
        price_paise: item.price_paise,
        quantity: requested.get(Number(item.id))
    })));
    if (totals.totalPaise < 100) return res.status(400).json({ error: 'Order total is invalid.' });

    const client = await pool.connect();
    let orderId;
    try {
        await client.query('BEGIN');
        const order = await client.query(
            `INSERT INTO orders (customer_id, subtotal_paise, tax_paise, delivery_paise, total_paise, delivery_address)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [req.session.customer.id, totals.subtotalPaise, totals.taxPaise, totals.deliveryPaise, totals.totalPaise, address]
        );
        orderId = order.rows[0].id;
        for (const item of itemResult.rows) {
            await client.query(
                `INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price_paise)
                 VALUES ($1, $2, $3, $4, $5)`,
                [orderId, item.id, item.name, requested.get(Number(item.id)), item.price_paise]
            );
        }
        const gatewayOrder = await payment.createClient().orders.create({
            amount: totals.totalPaise,
            currency: process.env.RAZORPAY_CURRENCY || 'INR',
            receipt: `bistro-${orderId}`
        });
        await client.query('UPDATE orders SET payment_order_id = $1 WHERE id = $2', [gatewayOrder.id, orderId]);
        await client.query('COMMIT');
        res.status(201).json({
            order: { id: orderId, amount: totals.totalPaise, currency: gatewayOrder.currency, status: 'payment_pending' },
            payment: { keyId: process.env.RAZORPAY_KEY_ID, orderId: gatewayOrder.id }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}));

router.post('/payments/verify', requireAuth, verifyCsrf, asyncRoute(async (req, res) => {
    const { orderId, paymentId, signature } = req.body;
    if (![orderId, paymentId, signature].every((value) => typeof value === 'string' && value.length < 256) ||
        !payment.verifyPaymentSignature(orderId, paymentId, signature)) {
        return res.status(400).json({ error: 'Payment verification failed.' });
    }
    const storedOrder = await pool.query(
        'SELECT id, total_paise FROM orders WHERE payment_order_id = $1 AND customer_id = $2',
        [orderId, req.session.customer.id]
    );
    if (!storedOrder.rowCount) return res.status(404).json({ error: 'The order could not be found.' });
    const gatewayPayment = await payment.createClient().payments.fetch(paymentId);
    if (gatewayPayment.order_id !== orderId || gatewayPayment.status !== 'captured' ||
        gatewayPayment.amount !== storedOrder.rows[0].total_paise ||
        gatewayPayment.currency !== (process.env.RAZORPAY_CURRENCY || 'INR')) {
        return res.status(409).json({ error: 'The payment is not captured for the expected amount and order.' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const existing = await client.query(
            `SELECT id, status, payment_status, payment_id
             FROM orders WHERE payment_order_id = $1 AND customer_id = $2 FOR UPDATE`,
            [orderId, req.session.customer.id]
        );
        if (!existing.rowCount) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'The order could not be found.' });
        }
        if (existing.rows[0].payment_status === 'paid' && existing.rows[0].payment_id === paymentId) {
            await client.query('COMMIT');
            return res.json({ order: { id: existing.rows[0].id, status: existing.rows[0].status } });
        }
        if (existing.rows[0].payment_status !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'This order payment was already processed.' });
        }
        const updated = await client.query(
            `UPDATE orders SET payment_status = 'paid', status = 'confirmed', payment_id = $1, updated_at = now()
             WHERE id = $2 RETURNING id, status`,
            [paymentId, existing.rows[0].id]
        );
        await client.query('COMMIT');
        res.json({ order: updated.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') return res.status(409).json({ error: 'This payment was already applied to another order.' });
        throw error;
    } finally {
        client.release();
    }
}));

router.get('/orders/mine', requireAuth, asyncRoute(async (req, res) => {
    const result = await pool.query(
        `SELECT o.id, o.status, o.payment_status, o.total_paise, o.created_at,
                COALESCE(json_agg(json_build_object('name', i.item_name, 'quantity', i.quantity))
                    FILTER (WHERE i.id IS NOT NULL), '[]') AS items
         FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
         WHERE o.customer_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
        [req.session.customer.id]
    );
    res.json({ orders: result.rows });
}));

router.get('/admin/summary', requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
    const [orders, reservations, customers, revenue] = await Promise.all([
        pool.query('SELECT count(*)::int AS total FROM orders'),
        pool.query("SELECT count(*)::int AS total FROM reservations WHERE status = 'confirmed'"),
        pool.query("SELECT count(*)::int AS total FROM customers WHERE role = 'customer'"),
        pool.query("SELECT COALESCE(sum(total_paise), 0)::bigint AS total FROM orders WHERE payment_status = 'paid'")
    ]);
    res.json({
        orders: orders.rows[0].total,
        reservations: reservations.rows[0].total,
        customers: customers.rows[0].total,
        revenuePaise: revenue.rows[0].total
    });
}));

router.get('/admin/menu', requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
    const result = await pool.query('SELECT * FROM menu_items ORDER BY category, name');
    res.json({ items: result.rows });
}));

router.post('/admin/menu', requireAuth, requireAdmin, verifyCsrf, asyncRoute(async (req, res) => {
    const { name, description, category, priceRupees, imageUrl = '', vegetarian = true, featured = false } = req.body;
    const pricePaise = Math.round(Number(priceRupees) * 100);
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 120 ||
        typeof description !== 'string' || description.length > 500 ||
        !allowedCategories.has(category) || !Number.isSafeInteger(pricePaise) || pricePaise < 0 ||
        typeof imageUrl !== 'string' || imageUrl.length > 500 || !validImageUrl(imageUrl) ||
        typeof vegetarian !== 'boolean' || typeof featured !== 'boolean') {
        return res.status(400).json({ error: 'Menu item details are invalid.' });
    }
    const result = await pool.query(
        `INSERT INTO menu_items (name, description, category, price_paise, image_url, vegetarian, featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name.trim(), description.trim(), category, pricePaise, imageUrl.trim(), vegetarian, featured]
    );
    res.status(201).json({ item: result.rows[0] });
}));

router.patch('/admin/menu/:id', requireAuth, requireAdmin, verifyCsrf, asyncRoute(async (req, res) => {
    const { name, description, category, priceRupees, imageUrl, vegetarian, featured, available } = req.body;
    const pricePaise = Math.round(Number(priceRupees) * 100);
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 120 ||
        typeof description !== 'string' || description.length > 500 || !allowedCategories.has(category) ||
        !Number.isSafeInteger(pricePaise) || pricePaise < 0 || typeof imageUrl !== 'string' || imageUrl.length > 500 || !validImageUrl(imageUrl) ||
        typeof vegetarian !== 'boolean' || typeof featured !== 'boolean' || typeof available !== 'boolean') {
        return res.status(400).json({ error: 'Complete, valid menu item details are required.' });
    }
    const result = await pool.query(
        `UPDATE menu_items SET name = $1, description = $2, category = $3, price_paise = $4,
         image_url = $5, vegetarian = $6, featured = $7, available = $8, updated_at = now()
         WHERE id = $9 RETURNING *`,
        [name.trim(), description.trim(), category, pricePaise, imageUrl.trim(), vegetarian, featured, available, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Menu item not found.' });
    res.json({ item: result.rows[0] });
}));

router.delete('/admin/menu/:id', requireAuth, requireAdmin, verifyCsrf, asyncRoute(async (req, res) => {
    const result = await pool.query('UPDATE menu_items SET available = false WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Menu item not found.' });
    res.status(204).end();
}));

router.get('/admin/orders', requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
    const result = await pool.query(
        `SELECT o.id, o.status, o.payment_status, o.total_paise, o.created_at, c.full_name, c.email
         FROM orders o JOIN customers c ON c.id = o.customer_id ORDER BY o.created_at DESC LIMIT 200`
    );
    res.json({ orders: result.rows });
}));

router.patch('/admin/orders/:id', requireAuth, requireAdmin, verifyCsrf, asyncRoute(async (req, res) => {
    const allowed = new Set(['confirmed', 'preparing', 'ready', 'completed', 'cancelled']);
    if (!allowed.has(req.body.status)) return res.status(400).json({ error: 'Invalid order status.' });
    const result = await pool.query(
        `UPDATE orders SET status = $1, updated_at = now()
         WHERE id = $2 AND payment_status = 'paid' RETURNING id, status`,
        [req.body.status, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Paid order not found.' });
    res.json({ order: result.rows[0] });
}));

router.get('/admin/reservations', requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
    const result = await pool.query(
        `SELECT id, guest_name, guest_email, guest_phone, reservation_date, reservation_time, guest_count, status, notes
         FROM reservations ORDER BY reservation_date DESC, reservation_time DESC LIMIT 200`
    );
    res.json({ reservations: result.rows });
}));

router.patch('/admin/reservations/:id', requireAuth, requireAdmin, verifyCsrf, asyncRoute(async (req, res) => {
    if (!['confirmed', 'cancelled', 'completed'].includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid reservation status.' });
    }
    const result = await pool.query(
        'UPDATE reservations SET status = $1 WHERE id = $2 RETURNING id, status',
        [req.body.status, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Reservation not found.' });
    res.json({ reservation: result.rows[0] });
}));

router.get('/admin/customers', requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
    const result = await pool.query(
        `SELECT c.id, c.full_name, c.email, c.created_at, count(o.id)::int AS order_count
         FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
         WHERE c.role = 'customer' GROUP BY c.id ORDER BY c.created_at DESC LIMIT 500`
    );
    res.json({ customers: result.rows });
}));

router.post('/payments/webhook', asyncRoute(async (req, res) => {
    if (!payment.verifyWebhookSignature(req.rawBody || Buffer.alloc(0), req.get('x-razorpay-signature'))) {
        return res.status(400).json({ error: 'Invalid webhook signature.' });
    }
    const event = req.body;
    const eventId = req.get('x-razorpay-event-id');
    if (typeof eventId !== 'string' || eventId.length > 255) {
        return res.status(400).json({ error: 'Webhook event identifier is required.' });
    }
    const paymentEntity = event.payload?.payment?.entity;
    const gatewayOrderId = paymentEntity?.order_id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const inserted = await client.query(
            'INSERT INTO payment_events (provider_event_id, event_type) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id',
            [eventId, String(event.event || 'unknown')]
        );
        if (!inserted.rowCount) {
            await client.query('COMMIT');
            return res.status(200).json({ received: true, duplicate: true });
        }
        if (event.event === 'payment.captured' && gatewayOrderId && paymentEntity?.id) {
            await client.query(
                `UPDATE orders SET payment_status = 'paid', status = 'confirmed', payment_id = $1, updated_at = now()
                 WHERE payment_order_id = $2 AND payment_status = 'pending'
                   AND total_paise = $3 AND $4 = $5`,
                [paymentEntity.id, gatewayOrderId, paymentEntity.amount, paymentEntity.currency, process.env.RAZORPAY_CURRENCY || 'INR']
            );
        } else if (event.event === 'payment.failed' && gatewayOrderId) {
            await client.query(
                `UPDATE orders SET payment_status = 'failed', status = 'payment_failed', updated_at = now()
                 WHERE payment_order_id = $1 AND payment_status = 'pending'`,
                [gatewayOrderId]
            );
        }
        await client.query('COMMIT');
        res.status(200).json({ received: true });
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}));

module.exports = router;
