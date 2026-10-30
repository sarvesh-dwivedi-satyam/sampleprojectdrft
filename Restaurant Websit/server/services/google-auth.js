const { OAuth2Client } = require('google-auth-library');

const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

function isConfigured() {
    return Boolean(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_CALLBACK_URL
    );
}

function getClient() {
    if (!isConfigured()) {
        const error = new Error('Google sign-in is not configured. Please use email and password.');
        error.status = 503;
        throw error;
    }
    return new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
    );
}

function constantTimeEqual(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string') return false;
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && require('node:crypto').timingSafeEqual(leftBuffer, rightBuffer);
}

function validateIdentity(payload, expectedNonce) {
    if (!payload || !ISSUERS.has(payload.iss) ||
        typeof payload.sub !== 'string' || !payload.sub ||
        typeof payload.email !== 'string' || payload.email.length > 254 ||
        payload.email_verified !== true ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) ||
        !constantTimeEqual(payload.nonce, expectedNonce)) {
        const error = new Error('Google could not verify this account. Try another sign-in method.');
        error.status = 401;
        throw error;
    }
    const picture = typeof payload.picture === 'string' && payload.picture.length <= 2048 &&
        payload.picture.startsWith('https://') ? payload.picture : null;
    const fallbackName = payload.email.slice(0, payload.email.indexOf('@'));
    const fullName = typeof payload.name === 'string' && payload.name.trim()
        ? payload.name.trim().slice(0, 120)
        : fallbackName.slice(0, 120);
    return {
        googleId: payload.sub,
        email: payload.email.trim().toLowerCase(),
        fullName,
        profilePicture: picture
    };
}

module.exports = { isConfigured, getClient, constantTimeEqual, validateIdentity };
