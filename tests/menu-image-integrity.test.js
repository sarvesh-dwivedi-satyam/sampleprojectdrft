const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const browser = {
    window: {},
    document: { querySelectorAll: () => [] }
};

for (const script of ['menu-data.js', 'image-config.js']) {
    vm.runInNewContext(
        fs.readFileSync(path.join(root, 'scripts', script), 'utf8'),
        browser,
        { filename: script }
    );
}

const menu = browser.window.MidnightMenu;
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'assets/images/image-sources.json'), 'utf8'));

test('image ledger covers the complete menu and keeps unverified images unassigned', () => {
    assert.equal(ledger.items.length, menu.length);
    for (const [index, item] of menu.entries()) {
        const record = ledger.items[index];
        assert.equal(record.itemId, item.id);
        assert.equal(record.dishName, item.name);
        assert.equal(record.category, item.category);
        assert.equal(record.verificationStatus, item.imageStatus);
        if (item.imageStatus === 'NEEDS_VERIFICATION') {
            assert.equal(item.imageKey, null);
            assert.equal(record.imagePath, null);
            assert.equal(record.sourcePage, null);
            assert.equal(record.license, null);
        }
    }
});

test('verified menu photographs are locally available, licensed, mapped, and unique', () => {
    const mapped = [];
    for (const item of menu.filter((entry) => entry.imageStatus === 'verified')) {
        const record = ledger.items.find((entry) => entry.itemId === item.id);
        const relativePath = browser.window.MidnightImages[item.imageKey];
        assert.ok(relativePath);
        assert.equal(record.imagePath, relativePath);
        assert.ok(fs.existsSync(path.join(root, relativePath)), `${relativePath} must exist`);
        assert.ok(record.sourcePage.startsWith('https://commons.wikimedia.org/wiki/File:'));
        assert.ok(record.originalImageUrl.startsWith('https://'));
        assert.equal(record.sourceWebsite, 'Wikimedia Commons');
        assert.ok(record.creator);
        assert.match(record.license, /^CC BY-SA /);
        assert.equal(record.attributionRequired, true);
        assert.ok(record.attribution);
        assert.ok(record.downloadDate);
        assert.ok(record.visualVerification);

        const bytes = fs.readFileSync(path.join(root, relativePath));
        assert.equal(bytes[0], 0xff);
        assert.equal(bytes[1], 0xd8);
        mapped.push(crypto.createHash('sha256').update(bytes).digest('hex'));
    }
    assert.equal(new Set(mapped).size, mapped.length);
});
