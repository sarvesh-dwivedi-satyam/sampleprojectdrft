const test = require('node:test');
const assert = require('node:assert/strict');
const { createCartStore, DEFAULT_SETTINGS, formatPrice } = require('../scripts/ordering');

function fixture(settings = DEFAULT_SETTINGS) {
    const values = new Map();
    const warnings = [];
    const catalog = [
        { id: 'mb-0001', name: 'Paneer Tikka', category: 'Starters', priceRupees: 249, imageKey: 'paneerTikka', availability: 'requires-confirmation' },
        { id: 'mb-0002', name: 'Unavailable Dish', category: 'Mains', priceRupees: 100, imageKey: null, availability: 'unavailable' },
        { id: 'mb-0003', name: 'Confirmed Dish', category: 'Mains', priceRupees: 100, imageKey: null, availability: 'available' }
    ];
    let nextId = 0;
    const storage = {
        getItem: (key) => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key)
    };
    const store = createCartStore({
        catalog,
        storage,
        settings,
        createId: () => `entry-${++nextId}`,
        onWarning: (message) => warnings.push(message)
    });
    return { store, catalog, storage, values, warnings };
}

test('adds and combines identical item selections while preserving distinct customizations', () => {
    const settings = {
        ...DEFAULT_SETTINGS,
        customizations: {
            'mb-0001': [{
                id: 'portion',
                label: 'Portion',
                required: true,
                choices: [
                    { id: 'regular', label: 'Regular', pricePaise: 0 },
                    { id: 'large', label: 'Large', pricePaise: 5000 }
                ]
            }]
        }
    };
    const { store } = fixture(settings);
    store.add('mb-0001', 2, [{ groupId: 'portion', choiceId: 'regular' }]);
    store.add('mb-0001', 1, [{ groupId: 'portion', choiceId: 'regular' }]);
    store.add('mb-0001', 1, [{ groupId: 'portion', choiceId: 'large' }]);

    const entries = store.getEntries();
    assert.equal(entries.length, 2);
    assert.equal(entries[0].quantity, 3);
    assert.equal(entries[0].dishName, 'Paneer Tikka');
    assert.equal(entries[0].imageKey, 'paneerTikka');
    assert.equal(entries[0].itemSubtotalPaise, 74_700);
    assert.equal(entries[1].itemSubtotalPaise, 29_900);
    assert.deepEqual(store.totals(), {
        subtotalPaise: 104_600,
        taxPaise: 0,
        deliveryPaise: 0,
        totalPaise: 104_600,
        quantity: 4
    });
});

test('updates quantities, removes entries, and clears the cart', () => {
    const { store } = fixture();
    store.add('mb-0001');
    const entryId = store.getEntries()[0].entryId;
    store.updateQuantity(entryId, 4);
    assert.equal(store.getEntries()[0].itemSubtotalPaise, 99_600);
    store.remove(entryId);
    assert.equal(store.getEntries().length, 0);
    store.add('mb-0001');
    store.clear();
    assert.equal(store.totals().totalPaise, 0);
});

test('rejects invalid quantities, unavailable dishes, bad prices, and missing required options', () => {
    const { store, catalog } = fixture({
        ...DEFAULT_SETTINGS,
        customizations: {
            'mb-0001': [{
                id: 'portion',
                label: 'Portion',
                required: true,
                choices: [{ id: 'regular', label: 'Regular', pricePaise: 0 }]
            }]
        }
    });
    assert.throws(() => store.add('mb-0001'), /Choose an option/);
    assert.throws(() => store.add('mb-0001', 21, [{ groupId: 'portion', choiceId: 'regular' }]), /quantity/);
    assert.throws(() => store.add('mb-0002'), /currently unavailable/);
    assert.throws(() => store.add('missing'), /not available in the catalog/);
    assert.throws(() => store.add('mb-0001', 1, [{ groupId: 'portion', choiceId: 'unknown' }]), /no longer available/);
    catalog[0].priceRupees = -1;
    assert.throws(() => store.add('mb-0001', 1, [{ groupId: 'portion', choiceId: 'regular' }]), /invalid pricing/);
});

test('restores valid saved entries and safely clears corrupt and legacy data', () => {
    const { store, storage, values, warnings } = fixture();
    store.add('mb-0001', 2);
    const restored = createCartStore({
        catalog: [{ id: 'mb-0001', name: 'Paneer Tikka', category: 'Starters', priceRupees: 249, imageKey: 'paneerTikka', availability: 'requires-confirmation' }],
        storage,
        createId: () => 'unused',
        onWarning: (message) => warnings.push(message)
    });
    assert.equal(restored.totals().quantity, 2);

    values.set('midnight-bistro-preview-cart-v2', '{broken');
    assert.equal(restored.getEntries().length, 0);
    assert.ok(warnings.some((message) => message.includes('damaged')));

    values.set('midnight-bistro-cart-v1', JSON.stringify([{ id: 1, quantity: 2 }]));
    assert.equal(restored.getEntries().length, 0);
    assert.equal(values.has('midnight-bistro-cart-v1'), false);
});

test('only verified settings enable orders and add configured totals', () => {
    const { store: preview } = fixture();
    assert.equal(preview.canOrder({ availability: 'available' }), false);

    const configured = fixture({
        ...DEFAULT_SETTINGS,
        orderingEnabled: true,
        pricingConfirmed: true,
        deliveryEnabled: true,
        taxRateBasisPoints: 500,
        deliveryFeePaise: 4900
    }).store;
    configured.add('mb-0003', 2);
    assert.equal(configured.canOrder({ availability: 'available' }), true);
    assert.deepEqual(configured.totals(), {
        subtotalPaise: 20_000,
        taxPaise: 1_000,
        deliveryPaise: 4_900,
        totalPaise: 25_900,
        quantity: 2
    });
});

test('formats only safe non-negative prices', () => {
    assert.equal(formatPrice(12_500), '₹125.00');
    assert.throws(() => formatPrice(-1), /invalid price/);
    assert.throws(() => formatPrice(Number.MAX_SAFE_INTEGER + 1), /invalid price/);
});
