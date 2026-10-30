require('dotenv').config();
if (!process.env.SESSION_SECRET || Buffer.byteLength(process.env.SESSION_SECRET) < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 bytes.');
}
if (process.env.NODE_ENV === 'production' && process.env.SESSION_COOKIE_SECURE !== 'true') {
    throw new Error('Set SESSION_COOKIE_SECURE=true when NODE_ENV=production.');
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
