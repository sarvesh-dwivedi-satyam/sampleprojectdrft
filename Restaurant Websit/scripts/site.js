(() => {
  const cartKey = 'midnight-bistro-cart-v1';

  function api(path, options = {}) {
    return fetch(path, { ...options, credentials: 'same-origin' }).then(async (response) => {
      if (response.status === 204) return null;
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
      return data;
    });
  }

  function formatPrice(paise) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
      .format((Number(paise) || 0) / 100);
  }

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(cartKey) || '[]');
      return Array.isArray(parsed)
        ? parsed.filter((item) => Number.isInteger(Number(item.id)) && Number(item.id) > 0 && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0)
        : [];
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
    if (!Number.isInteger(id) || id < 1) throw new Error('This menu item cannot be added to the cart.');
    const items = readCart();
    const existing = items.find((entry) => Number(entry.id) === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ id, quantity: 1 });
    }
    writeCart(items);
  }

  function updateCartCount() {
    const total = readCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    document.querySelectorAll('[data-cart-count]').forEach((node) => { node.textContent = String(total); });
  }

  const siteHeader = document.querySelector('body > header');
  const nav = siteHeader && siteHeader.querySelector('nav[aria-label="Primary navigation"]');
  if (siteHeader && nav) {
    siteHeader.classList.add('site-header');
    if (!nav.id) nav.id = 'primary-navigation';
    const navToggle = document.createElement('button');
    navToggle.className = 'nav-toggle';
    navToggle.type = 'button';
    navToggle.setAttribute('aria-controls', nav.id);
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
    navToggle.textContent = 'Menu';
    siteHeader.insertBefore(navToggle, nav);
    siteHeader.classList.add('has-mobile-nav');

    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open navigation');
      });
    });
    siteHeader.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open navigation');
        navToggle.focus();
      }
    });
  }

  window.Midnight = { api, formatPrice, readCart, writeCart, addToCart, updateCartCount };
  updateCartCount();
})();
