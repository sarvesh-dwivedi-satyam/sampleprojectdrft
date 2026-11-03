const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const browser = { window: {} };
for (const script of ['menu-data.js', 'menu-search.js']) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'scripts', script), 'utf8');
    vm.runInNewContext(source, browser, { filename: script });
}

const { MidnightMenu: menu, MidnightMenuCategories: categories, MidnightMenuSearch } = browser.window;
const search = MidnightMenuSearch.createIndex(menu);

test('catalog contains 500+ unique, valid preview records', () => {
    assert.ok(menu.length >= 500);
    assert.equal(new Set(menu.map((item) => item.id)).size, menu.length);
    assert.equal(new Set(menu.map((item) => search.normalize(item.name))).size, menu.length);
    for (const item of menu) {
        assert.ok(item.name);
        assert.ok(categories[item.group]);
        assert.ok(item.category);
        assert.ok(item.subcategory);
        assert.ok(Number.isInteger(item.priceRupees) && item.priceRupees >= 0);
        assert.ok(['vegetarian', 'non-vegetarian', 'unverified'].includes(item.foodType));
        assert.ok(item.keywords);
        if (item.imageStatus === 'verified') assert.ok(item.imageKey);
        else {
            assert.equal(item.imageKey, null);
            assert.equal(item.imageStatus, 'NEEDS_VERIFICATION');
        }
        assert.equal(item.availability, 'requires-confirmation');
    }
});

test('single-character and progressive searches return useful narrowing results', () => {
    const singleCharacter = search.search('c');
    assert.ok(singleCharacter.length > 0);
    assert.ok(singleCharacter.some(({ item }) => item.name === 'Chicken Tikka'));

    const counts = ['c', 'ch', 'chi', 'chic', 'chicken']
        .map((query) => search.search(query).length);
    assert.ok(counts.every((count, index) => index === 0 || count <= counts[index - 1]));
    assert.ok(search.search('chicken').some(({ item }) => item.name === 'Chicken Tikka'));
});

test('common misspellings surface the intended dishes', () => {
    const expected = new Map([
        ['chiken', 'Chicken Tikka'],
        ['panner', 'Paneer Tikka'],
        ['choclate', 'Chocolate Brownie'],
        ['coffe', 'Cold Coffee'],
        ['burgar', 'Classic Veg Burger'],
        ['mashroom', 'Tandoori Mushroom']
    ]);
    for (const [query, name] of expected) {
        assert.ok(search.search(query).some(({ item }) => item.name === name), `${query} should suggest ${name}`);
    }
});

test('exact name and category matches are ranked and normalized', () => {
    assert.equal(search.search('  CHICKEN   BIRYANI  ')[0].item.name, 'Chicken Biryani');
    for (const [query, expected] of [
        ['Biryani', 'Chicken Biryani'],
        ['Dessert', 'Chocolate Brownie'],
        ['Beverages', 'Cold Coffee'],
        ['Starters', 'Chicken Tikka']
    ]) {
        assert.ok(search.search(query).some(({ item }) => item.name === expected), `${query} should find ${expected}`);
    }
    assert.equal(MidnightMenuSearch.normalize('Beverages'), MidnightMenuSearch.normalize('beverage'));
});

test('diet, price, vegan, and availability filters combine with the query', () => {
    const paneer = search.search('paneer', { foodType: 'vegetarian', minPrice: 200, maxPrice: 350 });
    assert.ok(paneer.length > 0);
    assert.ok(paneer.every(({ item }) =>
        item.foodType === 'vegetarian' && item.priceRupees >= 200 && item.priceRupees <= 350));
    assert.equal(search.search('paneer', { vegan: true }).length, 0);
    assert.equal(search.search('paneer', { availability: 'available' }).length, 0);
    assert.equal(search.search('', { availability: 'requires-confirmation' }).length, menu.length);
});
