require('dotenv').config();
if (!process.env.SESSION_SECRET || Buffer.byteLength(process.env.SESSION_SECRET) < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 bytes.');
}
if (process.env.NODE_ENV === 'production' && process.env.SESSION_COOKIE_SECURE !== 'true') {
    throw new Error('Set SESSION_COOKIE_SECURE=true when NODE_ENV=production.');
}
if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    throw new Error('Only Razorpay test-mode keys are supported; live payment keys are disabled.');
}
try {
    new Intl.DateTimeFormat('en-CA', { timeZone: process.env.BUSINESS_TIME_ZONE || 'Asia/Kolkata' }).format(new Date());
} catch {
    throw new Error('BUSINESS_TIME_ZONE must be a valid IANA time zone.');
}
const taxRate = Number(process.env.TAX_RATE_BASIS_POINTS || 0);
const deliveryFee = Number(process.env.DELIVERY_FEE_PAISE || 0);
if (!Number.isSafeInteger(taxRate) || taxRate < 0 || taxRate > 10_000 ||
    !Number.isSafeInteger(deliveryFee) || deliveryFee < 0) {
    throw new Error('Tax and delivery configuration must use non-negative integer values.');
}
const appUrl = new URL(process.env.APP_ORIGIN || `http://localhost:${process.env.PORT || 3000}`);
if (process.env.NODE_ENV === 'production' && appUrl.protocol !== 'https:') {
    throw new Error('APP_ORIGIN must use HTTPS in production.');
}
if (appUrl.pathname !== '/' || appUrl.search || appUrl.hash) {
    throw new Error('APP_ORIGIN must contain only the site origin, without a path or query.');
}
const googleCredentials = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
];
if (googleCredentials.some(Boolean) && !googleCredentials.every(Boolean)) {
    throw new Error('Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL together.');
}
if (googleCredentials.every(Boolean)) {
    const callbackUrl = new URL(process.env.GOOGLE_CALLBACK_URL);
    if (callbackUrl.origin !== appUrl.origin || callbackUrl.pathname !== '/api/auth/google/callback' ||
        callbackUrl.search || callbackUrl.hash ||
        (process.env.NODE_ENV === 'production' && callbackUrl.protocol !== 'https:')) {
        throw new Error('GOOGLE_CALLBACK_URL must be the same-origin /api/auth/google/callback URL (HTTPS in production).');
    }
}

const app = require('./app');
const pool = require('./config/database');
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
    console.log(`Midnight Bistro listening on port ${port}`);
});

async function shutdown(signal) {
    console.log(`${signal} received; closing server.`);
    server.close(async (error) => {
        await pool.end();
        if (error) {
            console.error('Server shutdown failed:', error);
            process.exitCode = 1;
        }
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
