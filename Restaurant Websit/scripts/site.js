(() => {
    const cartKey = 'midnight-bistro-cart-v1';

    async function api(path, options = {}) {
        const headers = new Headers(options.headers || {});
        const method = (options.method || 'GET').toUpperCase();
        if (method !== 'GET' && method !== 'HEAD') {
            const csrfResponse = await fetch('/api/csrf', { credentials: 'same-origin' });
            if (!csrfResponse.ok) throw new Error('Could not verify this request. Refresh and try again.');
            const { csrfToken } = await csrfResponse.json();
            headers.set('X-CSRF-Token', csrfToken);
        }
        if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
        const response = await fetch(path, { ...options, method, headers, credentials: 'same-origin' });
        if (response.status === 204) return null;
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
        return data;
    }

    function formatPrice(paise) {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
            .format(Number(paise || 0) / 100);
    }

    function readCart() {
        try {
            const parsed = JSON.parse(localStorage.getItem(cartKey) || '[]');
            return Array.isArray(parsed) ? parsed.filter((item) =>
                Number.isInteger(Number(item.id)) && Number.isInteger(Number(item.quantity)) &&
                Number(item.id) > 0 && Number(item.quantity) > 0 && Number(item.quantity) <= 20
            ) : [];
        } catch {
            return [];
        }
    }

    function writeCart(items) {
        localStorage.setItem(cartKey, JSON.stringify(items));
        updateCartCount();
        window.dispatchEvent(new CustomEvent('midnight:cart-updated'));
    }

    function addToCart(itemId) {
        const id = Number(itemId);
        if (!Number.isInteger(id) || id < 1) throw new Error('This menu item cannot be added to your cart.');
        const items = readCart();
        const existing = items.find((item) => Number(item.id) === id);
        if (existing) {
            if (existing.quantity >= 20) throw new Error('You can add up to 20 of each item.');
            existing.quantity += 1;
        } else {
            items.push({ id, quantity: 1 });
        }
        writeCart(items);
    }

    function updateCartCount() {
        const total = readCart().reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll('[data-cart-count]').forEach((node) => { node.textContent = String(total); });
    }

    document.addEventListener('DOMContentLoaded', updateCartCount);
    window.addEventListener('storage', updateCartCount);
    window.Midnight = { api, formatPrice, readCart, writeCart, addToCart, updateCartCount };
})();
