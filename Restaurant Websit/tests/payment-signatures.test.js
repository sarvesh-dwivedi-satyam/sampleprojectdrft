const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {
    verifyPaymentSignature,
    verifyWebhookSignature
} = require('../server/services/razorpay');

test('verifies a Razorpay payment signature and rejects a changed order', () => {
    const previous = process.env.RAZORPAY_KEY_SECRET;
    process.env.RAZORPAY_KEY_SECRET = 'test-secret';
    const signature = crypto.createHmac('sha256', 'test-secret').update('order_123|pay_123').digest('hex');
    assert.equal(verifyPaymentSignature('order_123', 'pay_123', signature), true);
    assert.equal(verifyPaymentSignature('order_other', 'pay_123', signature), false);
    if (previous === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = previous;
});

test('verifies webhook signatures over the exact raw payload', () => {
    const previous = process.env.RAZORPAY_WEBHOOK_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook-secret';
    const body = Buffer.from('{"event":"payment.captured"}');
    const signature = crypto.createHmac('sha256', 'webhook-secret').update(body).digest('hex');
    assert.equal(verifyWebhookSignature(body, signature), true);
    assert.equal(verifyWebhookSignature(Buffer.from('{"event":"payment.failed"}'), signature), false);
    if (previous === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET;
    else process.env.RAZORPAY_WEBHOOK_SECRET = previous;
});
