const crypto = require('node:crypto');

function configured() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function createClient() {
    if (!configured()) {
        const error = new Error('Online payment is not configured. Contact the restaurant to complete this order.');
        error.status = 503;
        throw error;
    }
    const Razorpay = require('razorpay');
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

function verifyPaymentSignature(orderId, paymentId, signature) {
    if (!process.env.RAZORPAY_KEY_SECRET) return false;
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest();
    let supplied;
    try {
        supplied = Buffer.from(signature, 'hex');
    } catch {
        return false;
    }
    return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

function verifyWebhookSignature(rawBody, signature) {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest();
    let supplied;
    try {
        supplied = Buffer.from(signature, 'hex');
    } catch {
        return false;
    }
    return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

module.exports = { configured, createClient, verifyPaymentSignature, verifyWebhookSignature };
