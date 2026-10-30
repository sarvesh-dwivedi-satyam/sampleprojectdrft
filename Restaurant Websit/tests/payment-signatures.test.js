const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {
    configured,
    verifyPaymentSignature,
    verifyWebhookSignature
} = require('../server/services/razorpay');

test('only enables checkout with Razorpay test-mode keys', () => {
    const previousId = process.env.RAZORPAY_KEY_ID;
    const previousSecret = process.env.RAZORPAY_KEY_SECRET;
    try {
        process.env.RAZORPAY_KEY_ID = 'rzp_test_example';
        process.env.RAZORPAY_KEY_SECRET = 'test-secret';
        assert.equal(configured(), true);
        process.env.RAZORPAY_KEY_ID = 'rzp_live_example';
        assert.equal(configured(), false);
    } finally {
        if (previousId === undefined) delete process.env.RAZORPAY_KEY_ID;
        else process.env.RAZORPAY_KEY_ID = previousId;
        if (previousSecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
        else process.env.RAZORPAY_KEY_SECRET = previousSecret;
    }
});

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
