const crypto = require('node:crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const pool = require('../config/database');
const { verifyCsrf } = require('../middleware/security');
const google = require('../services/google-auth');
const { classifyGoogleAccount } = require('../services/google-account');

const router = express.Router();
const googleLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const loginPathFor = (flow) => flow === 'signup' ? '/signup.html' : '/login.html';
const publicUser = ({ id, full_name, email, role, profile_picture, auth_provider }) => ({
    id,
    fullName: full_name,
    email,
    role,
    profilePicture: profile_picture || null,
    authProvider: auth_provider
});
const safeRedirect = (res, flow, error) => {
    const page = loginPathFor(flow);
    const query = new URLSearchParams({ authError: error });
    res.redirect(`${page}?${query}`);
};

function clearAttempt(session) {
    delete session.googleState;
    delete session.googleNonce;
    delete session.googleCodeVerifier;
    delete session.googleFlow;
    delete session.googleLinkUserId;
}

function beginSession(req, user) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => {
            if (error) return reject(error);
            req.session.customer = publicUser(user);
            req.session.cookie.maxAge = 1000 * 60 * 60 * 8;
            req.session.save((saveError) => saveError ? reject(saveError) : resolve());
        });
    });
}

router.get('/start', googleLimiter, (req, res, next) => {
    const flow = String(req.query.flow || 'login');
    try {
        if (!['login', 'signup', 'link'].includes(flow)) {
            return res.status(400).json({ error: 'Invalid Google sign-in request.' });
        }
        if (flow === 'link' && !req.session.customer) {
            return res.redirect('/login.html?authError=sign-in-required');
        }
        const state = crypto.randomBytes(32).toString('base64url');
        const nonce = crypto.randomBytes(32).toString('base64url');
        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
        req.session.googleState = state;
        req.session.googleNonce = nonce;
        req.session.googleCodeVerifier = codeVerifier;
        req.session.googleFlow = flow;
        req.session.googleLinkUserId = flow === 'link' ? String(req.session.customer.id) : null;
        const authorizationUrl = google.getClient().generateAuthUrl({
            response_type: 'code',
            scope: ['openid', 'email', 'profile'],
            state,
            nonce,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            access_type: 'online',
            prompt: 'select_account'
        });
        req.session.save((error) => {
            if (error) return next(error);
            res.redirect(authorizationUrl);
        });
    } catch (error) {
        if (error.status === 503) return safeRedirect(res, flow, 'google-not-configured');
        next(error);
    }
});

router.get('/pending', (req, res) => {
    const pending = req.session?.pendingGoogleLink;
    if (!pending || pending.expiresAt < Date.now()) {
        delete req.session?.pendingGoogleLink;
        return res.status(410).json({ error: 'Google account verification expired. Start Google sign-in again.' });
    }
    res.json({ email: pending.email });
});

router.get('/status', (_req, res) => {
    res.json({ configured: google.isConfigured() });
});

router.get('/callback', googleLimiter, async (req, res, next) => {
    const flow = req.session?.googleFlow;
    const stateMatches = google.constantTimeEqual(req.query.state, req.session?.googleState);
    const expectedNonce = req.session?.googleNonce;
    const codeVerifier = req.session?.googleCodeVerifier;
    const linkUserId = req.session?.googleLinkUserId;
    if (!flow || !expectedNonce || !codeVerifier || !stateMatches) {
        if (req.session) clearAttempt(req.session);
        return safeRedirect(res, flow, 'google-state-invalid');
    }
    clearAttempt(req.session);
    if (req.query.error) return safeRedirect(res, flow, 'google-cancelled');
    if (typeof req.query.code !== 'string' || req.query.code.length > 4096) {
        return safeRedirect(res, flow, 'google-login-failed');
    }

    try {
        const client = google.getClient();
        let identity;
        try {
            const { tokens } = await client.getToken({
                code: req.query.code,
                redirect_uri: process.env.GOOGLE_CALLBACK_URL,
                codeVerifier
            });
            if (typeof tokens.id_token !== 'string') return safeRedirect(res, flow, 'google-login-failed');
            const ticket = await client.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            identity = google.validateIdentity(ticket.getPayload(), expectedNonce);
        } catch (verificationError) {
            console.error('Google OpenID Connect verification failed:', verificationError.message);
            return safeRedirect(res, flow, 'google-login-failed');
        }

        if (flow === 'link') {
            if (!req.session.customer || String(req.session.customer.id) !== String(linkUserId)) {
                return safeRedirect(res, 'login', 'google-link-session-expired');
            }
            if (req.session.customer.email.toLowerCase() !== identity.email) {
                return safeRedirect(res, 'login', 'google-email-mismatch');
            }
            const existing = await pool.query('SELECT id FROM users WHERE google_id = $1', [identity.googleId]);
            if (existing.rowCount && String(existing.rows[0].id) !== String(linkUserId)) {
                return safeRedirect(res, 'login', 'google-account-conflict');
            }
            const linked = await pool.query(
                `UPDATE users SET google_id = $1, profile_picture = $2,
                    auth_provider = CASE WHEN password_hash IS NULL THEN 'google' ELSE 'password+google' END,
                    updated_at = now()
                 WHERE id = $3 AND email = $4 AND is_active = true
                   AND (google_id IS NULL OR google_id = $1)
                 RETURNING id, full_name, email, role, profile_picture, auth_provider`,
                [identity.googleId, identity.profilePicture, linkUserId, identity.email]
            );
            if (!linked.rowCount) return safeRedirect(res, 'login', 'google-account-conflict');
            await beginSession(req, linked.rows[0]);
            return res.redirect(linked.rows[0].role === 'admin' ? '/admin/index.html' : '/profile.html');
        }

        let account = await pool.query(
            'SELECT id, full_name, email, role, profile_picture, auth_provider, is_active FROM users WHERE google_id = $1',
            [identity.googleId]
        );
        if (account.rowCount) {
            const user = account.rows[0];
            if (!user.is_active) return safeRedirect(res, flow, 'account-disabled');
            const updated = await pool.query(
                `UPDATE users SET profile_picture = $1, updated_at = now()
                 WHERE id = $2 RETURNING id, full_name, email, role, profile_picture, auth_provider`,
                [identity.profilePicture, user.id]
            );
            await beginSession(req, updated.rows[0]);
            return res.redirect(updated.rows[0].role === 'admin' ? '/admin/index.html' : '/profile.html');
        }

        account = await pool.query(
            'SELECT id, full_name, email, role, password_hash, google_id, auth_provider, is_active FROM users WHERE email = $1',
            [identity.email]
        );
        const accountResolution = classifyGoogleAccount(account.rows[0], identity);
        if (accountResolution === 'disabled') {
            return safeRedirect(res, flow, 'account-disabled');
        }
        if (accountResolution === 'conflict') {
            return safeRedirect(res, flow, 'google-account-conflict');
        }
        if (accountResolution === 'verify-password') {
            const user = account.rows[0];
            req.session.pendingGoogleLink = {
                ...identity,
                expiresAt: Date.now() + 10 * 60 * 1000
            };
            req.session.cookie.maxAge = 10 * 60 * 1000;
            await new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
            return res.redirect('/login.html?googleLink=required');
        }

        const created = await pool.query(
            `INSERT INTO users (google_id, full_name, email, profile_picture, password_hash, auth_provider)
             VALUES ($1, $2, $3, $4, NULL, 'google')
             RETURNING id, full_name, email, role, profile_picture, auth_provider`,
            [identity.googleId, identity.fullName, identity.email, identity.profilePicture]
        );
        await beginSession(req, created.rows[0]);
        res.redirect(created.rows[0].role === 'admin' ? '/admin/index.html' : '/profile.html');
    } catch (error) {
        if (error.code === '23505') return safeRedirect(res, flow, 'google-account-conflict');
        next(error);
    }
});

router.post('/link', googleLimiter, verifyCsrf, async (req, res, next) => {
    const pending = req.session.pendingGoogleLink;
    if (!pending || pending.expiresAt < Date.now()) {
        delete req.session.pendingGoogleLink;
        return res.status(410).json({ error: 'Google account verification expired. Start Google sign-in again.' });
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const password = String(body.password || '');
    if (!password || password.length > 128) {
        return res.status(400).json({ error: 'Enter the password for your existing account to link Google securely.' });
    }
    try {
        const result = await pool.query(
            `SELECT id, full_name, email, role, password_hash, google_id, is_active
             FROM users WHERE email = $1`,
            [pending.email]
        );
        const user = result.rows[0];
        if (!user || !user.is_active || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'The existing account password is incorrect.' });
        }
        if (user.google_id && user.google_id !== pending.googleId) {
            return res.status(409).json({ error: 'A different Google account is already linked to this email.' });
        }
        const linked = await pool.query(
            `UPDATE users SET google_id = $1, profile_picture = $2, auth_provider = 'password+google',
                updated_at = now()
             WHERE id = $3 AND email = $4 AND is_active = true
               AND (google_id IS NULL OR google_id = $1)
             RETURNING id, full_name, email, role, profile_picture, auth_provider`,
            [pending.googleId, pending.profilePicture, user.id, pending.email]
        );
        if (!linked.rowCount) return res.status(409).json({ error: 'This Google identity is already linked to another account.' });
        delete req.session.pendingGoogleLink;
        await beginSession(req, linked.rows[0]);
        res.json({ customer: publicUser(linked.rows[0]) });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'This Google identity or email is already in use.' });
        next(error);
    }
});

module.exports = router;
