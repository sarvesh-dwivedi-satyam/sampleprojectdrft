const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateTotals } = require('../server/services/pricing');

test('calculates tax and delivery in paise using server configuration', () => {
    const totals = calculateTotals([
        { price_paise: 10_000, quantity: 2 },
        { price_paise: 5_000, quantity: 1 }
    ], { TAX_RATE_BASIS_POINTS: '500', DELIVERY_FEE_PAISE: '4_900' });
    assert.deepEqual(totals, {
        subtotalPaise: 25_000,
        taxPaise: 1_250,
        deliveryPaise: 4_900,
        totalPaise: 31_150
    });
});

test('defaults to no tax and no delivery charge until business rates are configured', () => {
    assert.deepEqual(calculateTotals([{ price_paise: 12_500, quantity: 2 }], {}), {
        subtotalPaise: 25_000,
        taxPaise: 0,
        deliveryPaise: 0,
        totalPaise: 25_000
    });
});

test('rejects invalid tax configuration and unsafe item prices', () => {
    assert.throws(() => calculateTotals([], { TAX_RATE_BASIS_POINTS: '10001' }), /configuration is invalid/);
    assert.throws(() => calculateTotals([{ price_paise: -1, quantity: 1 }], {}), /invalid pricing data/);
    assert.throws(() => calculateTotals([{ price_paise: 100, quantity: 0 }], {}), /invalid pricing data/);
});
