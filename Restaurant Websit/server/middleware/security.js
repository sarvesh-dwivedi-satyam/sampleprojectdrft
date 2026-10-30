const crypto = require('node:crypto');

function csrfToken(req, res) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    res.json({ csrfToken: req.session.csrfToken });
}

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
    if (!req.session.customer) {
        return res.status(401).json({ error: 'Sign in to continue.' });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (req.session.customer?.role !== 'admin') {
        return res.status(403).json({ error: 'Administrator access is required.' });
    }
    next();
}

module.exports = { csrfToken, verifyCsrf, requireAuth, requireAdmin };
