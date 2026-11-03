const crypto = require('node:crypto');
const pool = require('../config/database');

function verifyCsrf(req, res, next) {
    const supplied = req.get('x-csrf-token');
    const expected = req.session?.csrfToken;
    if (!supplied || !expected) {
        return res.status(403).json({ error: 'Request verification failed. Refresh and try again.' });
    }
    const suppliedBuffer = Buffer.from(supplied);
    const expectedBuffer = Buffer.from(expected);
    if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
        return res.status(403).json({ error: 'Request verification failed. Refresh and try again.' });
    }
    next();
}

function requireAuth(req, res, next) {
    if (!req.session?.customer) {
        return res.status(401).json({ error: 'Sign in to continue.' });
    }
    pool.query(
        'SELECT id, role, is_active FROM users WHERE id = $1',
        [req.session.customer.id]
    ).then((result) => {
        const user = result.rows[0];
        if (!user || !user.is_active) {
            return req.session.destroy((error) => {
                if (error) return next(error);
                res.clearCookie('midnight.sid');
                res.status(401).json({ error: 'This account is unavailable. Sign in again or contact the restaurant.' });
            });
        }
        req.session.customer.role = user.role;
        next();
    }).catch(next);
}

function requireAdmin(req, res, next) {
    if (req.session.customer?.role !== 'admin') return res.status(403).json({ error: 'Administrator access is required.' });
    next();
}

module.exports = { verifyCsrf, requireAuth, requireAdmin };
