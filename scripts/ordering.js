(() => {
    const STORAGE_KEY = 'midnight-bistro-preview-cart-v2';
    const LEGACY_STORAGE_KEY = 'midnight-bistro-cart-v1';
    const MAX_QUANTITY = 20;
    const DEFAULT_SETTINGS = Object.freeze({
        orderingEnabled: false,
        pricingConfirmed: false,
        deliveryEnabled: false,
        pickupEnabled: false,
        taxRateBasisPoints: 0,
        deliveryFeePaise: 0,
        paymentMethods: Object.freeze([]),
        customizations: Object.freeze({})
    });

    function assertPrice(value) {
        if (!Number.isSafeInteger(value) || value < 0) {
            throw new Error('This item has invalid pricing data and cannot be added.');
        }
        return value;
    }

    function createCartStore({
        catalog,
        storage,
        settings = DEFAULT_SETTINGS,
        createId = () => globalThis.crypto.randomUUID(),
        onChange = () => {},
        onWarning = () => {}
    }) {
        if (!Array.isArray(catalog) || !storage) throw new Error('Menu data and browser storage are required.');
        const byId = new Map(catalog.map((item) => [item.id, item]));

        function parseCustomizations(item, selections) {
            if (!Array.isArray(selections)) throw new Error('The saved customization selection is invalid.');
            const groups = settings.customizations[item.id] || [];
            const normalized = [];
            let extraPaise = 0;
            const seen = new Set();
            for (const selection of selections) {
                if (!selection || typeof selection.groupId !== 'string' || typeof selection.choiceId !== 'string' ||
                    seen.has(selection.groupId)) {
                    throw new Error('The saved customization selection is invalid.');
                }
                const group = groups.find((candidate) => candidate.id === selection.groupId);
                const choice = group?.choices.find((candidate) => candidate.id === selection.choiceId);
                if (!choice) throw new Error('A saved customization is no longer available.');
                assertPrice(choice.pricePaise);
                seen.add(group.id);
                extraPaise += choice.pricePaise;
                normalized.push({ groupId: group.id, choiceId: choice.id });
            }
            for (const group of groups) {
                if (group.required && !seen.has(group.id)) {
                    throw new Error(`Choose an option for ${group.label}.`);
                }
            }
            normalized.sort((left, right) => left.groupId.localeCompare(right.groupId));
            return { normalized, extraPaise };
        }

        function makeEntry(row) {
            if (!row || typeof row.entryId !== 'string' || row.entryId.length > 128 ||
                typeof row.menuItemId !== 'string' || !Number.isInteger(row.quantity) ||
                row.quantity < 1 || row.quantity > MAX_QUANTITY) return null;
            const item = byId.get(row.menuItemId);
            if (!item) return null;
            const unitPricePaise = assertPrice(item.priceRupees * 100);
            const customizations = parseCustomizations(item, row.customizations);
            const itemSubtotalPaise = (unitPricePaise + customizations.extraPaise) * row.quantity;
            if (!Number.isSafeInteger(itemSubtotalPaise)) return null;
            return {
                entryId: row.entryId,
                menuItemId: item.id,
                dishName: item.name,
                imageKey: item.imageKey,
                category: item.category,
                availability: item.availability,
                unitPricePaise,
                customizationPricePaise: customizations.extraPaise,
                quantity: row.quantity,
                customizations: customizations.normalized,
                itemSubtotalPaise
            };
        }

        function persist(rows) {
            storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, entries: rows }));
            onChange();
        }

        function loadRows() {
            if (storage.getItem(LEGACY_STORAGE_KEY) !== null) {
                storage.removeItem(LEGACY_STORAGE_KEY);
                onWarning('An older cart could not be verified against this menu and was cleared.');
            }
            const raw = storage.getItem(STORAGE_KEY);
            if (raw === null) return [];
            let saved;
            try {
                saved = JSON.parse(raw);
            } catch {
                storage.removeItem(STORAGE_KEY);
                onWarning('Saved cart data was damaged and has been cleared.');
                onChange();
                return [];
            }
            if (!saved || saved.version !== 2 || !Array.isArray(saved.entries)) {
                storage.removeItem(STORAGE_KEY);
                onWarning('Saved cart data is out of date and has been cleared.');
                onChange();
                return [];
            }
            const validRows = [];
            const seenIds = new Set();
            for (const row of saved.entries) {
                try {
                    const entry = makeEntry(row);
                    if (entry && !seenIds.has(entry.entryId)) {
                        validRows.push({
                            entryId: entry.entryId,
                            menuItemId: entry.menuItemId,
                            quantity: entry.quantity,
                            customizations: entry.customizations
                        });
                        seenIds.add(entry.entryId);
                    }
                } catch {
                    onWarning('An invalid cart item was removed.');
                }
            }
            if (validRows.length !== saved.entries.length) persist(validRows);
            return validRows;
        }

        function getEntries() {
            return loadRows().map(makeEntry).filter(Boolean);
        }

        function add(menuItemId, quantity = 1, selections = []) {
            const item = byId.get(menuItemId);
            if (!item) throw new Error('This menu item is not available in the catalog.');
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
                throw new Error(`Choose a quantity between 1 and ${MAX_QUANTITY}.`);
            }
            assertPrice(item.priceRupees * 100);
            const customizations = parseCustomizations(item, selections);
            const rows = loadRows();
            const key = JSON.stringify(customizations.normalized);
            const existing = rows.find((row) =>
                row.menuItemId === item.id && JSON.stringify(row.customizations) === key);
            if (existing) {
                if (existing.quantity + quantity > MAX_QUANTITY) {
                    throw new Error(`A cart item cannot exceed ${MAX_QUANTITY} servings.`);
                }
                existing.quantity += quantity;
            } else {
                rows.push({
                    entryId: createId(),
                    menuItemId: item.id,
                    quantity,
                    customizations: customizations.normalized
                });
            }
            persist(rows);
            return getEntries();
        }

        function updateQuantity(entryId, quantity) {
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
                throw new Error(`Choose a quantity between 1 and ${MAX_QUANTITY}.`);
            }
            const rows = loadRows();
            const row = rows.find((entry) => entry.entryId === entryId);
            if (!row) throw new Error('This cart item could not be found.');
            row.quantity = quantity;
            persist(rows);
            return getEntries();
        }

        function remove(entryId) {
            const rows = loadRows();
            const remaining = rows.filter((entry) => entry.entryId !== entryId);
            if (remaining.length === rows.length) throw new Error('This cart item could not be found.');
            persist(remaining);
            return getEntries();
        }

        function clear() {
            persist([]);
        }

        function totals() {
            const entries = getEntries();
            const subtotalPaise = entries.reduce((sum, entry) => sum + entry.itemSubtotalPaise, 0);
            if (!Number.isSafeInteger(subtotalPaise)) throw new Error('The cart total is outside the supported range.');
            const taxPaise = settings.pricingConfirmed
                ? Math.round(subtotalPaise * settings.taxRateBasisPoints / 10000)
                : 0;
            const deliveryPaise = settings.pricingConfirmed && settings.deliveryEnabled
                ? settings.deliveryFeePaise
                : 0;
            return {
                subtotalPaise,
                taxPaise,
                deliveryPaise,
                totalPaise: subtotalPaise + taxPaise + deliveryPaise,
                quantity: entries.reduce((sum, entry) => sum + entry.quantity, 0)
            };
        }

        function canOrder(item) {
            return Boolean(settings.orderingEnabled && settings.pricingConfirmed &&
                item?.availability === 'available' &&
                (settings.deliveryEnabled || settings.pickupEnabled));
        }

        return Object.freeze({ getEntries, add, updateQuantity, remove, clear, totals, canOrder });
    }

    function formatPrice(paise) {
        if (!Number.isSafeInteger(paise) || paise < 0) throw new Error('Cannot display an invalid price.');
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(paise / 100);
    }

    const api = Object.freeze({ STORAGE_KEY, MAX_QUANTITY, DEFAULT_SETTINGS, createCartStore, formatPrice });
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') {
        window.MidnightOrdering = api;
        if (typeof document !== 'undefined') initializePage(window, document, api);
    }

    function initializePage(browser, doc, ordering) {
        const settings = { ...ordering.DEFAULT_SETTINGS, ...(browser.MidnightOrderingSettings || {}) };
        const store = ordering.createCartStore({
            catalog: browser.MidnightMenu || [],
            storage: browser.localStorage,
            settings,
            onChange: () => {
                updateCount();
                browser.dispatchEvent(new CustomEvent('midnight:cart-updated'));
            },
            onWarning: (message) => {
                console.warn(message);
                browser.dispatchEvent(new CustomEvent('midnight:cart-warning', { detail: message }));
            }
        });
        browser.MidnightCart = store;

        function updateCount() {
            const count = store.getEntries().reduce((sum, entry) => sum + entry.quantity, 0);
            doc.querySelectorAll('[data-cart-count]').forEach((node) => { node.textContent = String(count); });
        }

        function element(tag, className, text) {
            const node = doc.createElement(tag);
            if (className) node.className = className;
            if (text !== undefined) node.textContent = text;
            return node;
        }

        function dishImage(item, compact = false) {
            const imagePath = item.imageKey && browser.MidnightImages?.[item.imageKey];
            if (!imagePath) {
                const placeholder = element('span', `menu-image-fallback${compact ? ' menu-image-fallback--compact' : ''}`, 'Dish photo unavailable');
                placeholder.setAttribute('role', 'img');
                placeholder.setAttribute('aria-label', `No dish-specific photograph is available for ${item.name}`);
                return placeholder;
            }
            const image = element('img', compact ? 'search-suggestion__photo' : '');
            image.src = imagePath;
            image.alt = `Photograph of ${item.name}`;
            image.loading = 'lazy';
            image.decoding = 'async';
            const details = browser.MidnightImageDetails?.[item.imageKey];
            if (details) {
                image.width = details.width;
                image.height = details.height;
                image.title = `Photo by ${details.creator} (${details.license})`;
            }
            image.addEventListener('error', () => {
                console.error(`Menu image failed to load for "${item.name}": ${imagePath}`);
                image.replaceWith(dishImage({ ...item, imageKey: null }, compact));
            }, { once: true });
            return image;
        }

        function attachNoticeListeners() {
            doc.querySelectorAll('[data-ordering-status]').forEach((node) => {
                node.textContent = 'Preview only: menu prices and availability are not confirmed; no real orders or payments are processed.';
            });
            browser.addEventListener('midnight:cart-warning', (event) => {
                doc.querySelectorAll('[data-cart-status], [data-ordering-status]').forEach((node) => {
                    node.textContent = event.detail;
                });
            });
        }

        function initializeDetailDialog() {
            const dialog = doc.querySelector('[data-dish-dialog]');
            const menuList = doc.querySelector('[data-menu-items]');
            if (!dialog || !menuList) return;
            const imageFrame = dialog.querySelector('[data-detail-image]');
            const content = dialog.querySelector('[data-detail-content]');
            const quantityOutput = dialog.querySelector('[data-detail-quantity]');
            const amount = dialog.querySelector('[data-detail-total]');
            const status = dialog.querySelector('[data-detail-status]');
            const addButton = dialog.querySelector('[data-dialog-add]');
            const orderButton = dialog.querySelector('[data-dialog-order]');
            let selectedItem = null;
            let quantity = 1;
            let selections = [];

            function updateAmount() {
                if (!selectedItem) return;
                let extraPaise = 0;
                for (const selection of selections) {
                    const group = (settings.customizations[selectedItem.id] || []).find((option) => option.id === selection.groupId);
                    const choice = group?.choices.find((option) => option.id === selection.choiceId);
                    if (choice) extraPaise += choice.pricePaise;
                }
                amount.textContent = ordering.formatPrice((selectedItem.priceRupees * 100 + extraPaise) * quantity);
                quantityOutput.textContent = String(quantity);
            }

            function open(item) {
                selectedItem = item;
                quantity = 1;
                selections = [];
                imageFrame.replaceChildren(dishImage(item));
                content.replaceChildren(
                    element('p', 'eyebrow', item.category),
                    element('h2', '', item.name),
                    element('p', 'detail-description', item.description || 'Dish description and ingredients require restaurant verification.'),
                    element('p', 'detail-diet', item.foodType === 'vegetarian' ? 'Vegetarian' : item.foodType === 'non-vegetarian' ? 'Non-vegetarian' : 'Food type unverified'),
                    element('p', 'detail-availability', item.availability === 'available' ? 'Availability confirmed' : item.availability === 'unavailable' ? 'Currently unavailable' : 'Availability requires restaurant confirmation')
                );
                const customizationGroups = settings.customizations[item.id] || [];
                if (customizationGroups.length) {
                    for (const group of customizationGroups) {
                        const fieldset = element('fieldset', 'detail-customization');
                        const legend = element('legend', '', group.label);
                        fieldset.append(legend);
                        group.choices.forEach((choice) => {
                            const label = element('label', 'detail-customization__choice');
                            const input = element('input');
                            input.type = group.multiple ? 'checkbox' : 'radio';
                            input.name = `customization-${item.id}-${group.id}`;
                            input.value = choice.id;
                            input.checked = Boolean(choice.selectedByDefault);
                            input.addEventListener('change', () => {
                                selections = selections.filter((selection) =>
                                    selection.groupId !== group.id || (group.multiple && selection.choiceId !== choice.id));
                                if (input.checked) selections.push({ groupId: group.id, choiceId: choice.id });
                                updateAmount();
                            });
                            label.append(input, doc.createTextNode(`${choice.label}${choice.pricePaise ? ` (+${ordering.formatPrice(choice.pricePaise)})` : ''}`));
                            fieldset.append(label);
                            if (input.checked) selections.push({ groupId: group.id, choiceId: choice.id });
                        });
                        content.append(fieldset);
                    }
                } else {
                    content.append(element('p', 'detail-customizations', 'No verified customization options are available for this dish.'));
                }
                if (item.bestseller === true) content.append(element('span', 'menu-card__featured', 'Bestseller'));
                status.textContent = '';
                addButton.disabled = item.availability === 'unavailable';
                addButton.textContent = item.availability === 'available' ? 'Add to preview cart' : 'Add preview item';
                orderButton.disabled = !store.canOrder(item);
                updateAmount();
                dialog.showModal();
            }

            menuList.addEventListener('click', (event) => {
                const trigger = event.target.closest('[data-open-dish]');
                const quickAdd = event.target.closest('[data-quick-add]');
                if (quickAdd) {
                    try {
                        store.add(quickAdd.dataset.quickAdd);
                        statusForPage(doc, `Added to preview cart. Cart: ${store.totals().quantity} item(s).`);
                    } catch (error) {
                        statusForPage(doc, error.message);
                    }
                    return;
                }
                if (event.target.closest('button, a')) {
                    if (trigger) {
                        const item = browser.MidnightMenu.find((candidate) => candidate.id === trigger.dataset.openDish);
                        if (item) open(item);
                    }
                    return;
                }
                if (trigger) {
                    const item = browser.MidnightMenu.find((candidate) => candidate.id === trigger.dataset.openDish);
                    if (item) open(item);
                }
            });

            dialog.querySelector('[data-quantity-decrease]').addEventListener('click', () => {
                quantity = Math.max(1, quantity - 1);
                updateAmount();
            });
            dialog.querySelector('[data-quantity-increase]').addEventListener('click', () => {
                quantity = Math.min(ordering.MAX_QUANTITY, quantity + 1);
                updateAmount();
            });
            dialog.querySelector('[data-dialog-add]').addEventListener('click', () => {
                try {
                    store.add(selectedItem.id, quantity, selections);
                    status.textContent = 'Added to your preview cart. No order has been sent to the restaurant.';
                } catch (error) {
                    status.textContent = error.message;
                }
            });
            dialog.querySelector('[data-dialog-order]').addEventListener('click', () => {
                if (!selectedItem || !store.canOrder(selectedItem)) {
                    status.textContent = 'Order Now is unavailable until this dish, its price, and a real fulfillment method are confirmed.';
                    return;
                }
                try {
                    store.add(selectedItem.id, quantity, selections);
                    browser.location.href = 'checkout.html';
                } catch (error) {
                    status.textContent = error.message;
                }
            });
            dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
            dialog.addEventListener('click', (event) => {
                if (event.target === dialog) dialog.close();
            });
            doc.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && dialog.open) dialog.close();
            });
            browser.MidnightDishDetails = Object.freeze({ open });
        }

        function statusForPage(doc, message) {
            const status = doc.querySelector('[data-ordering-status]');
            if (status) status.textContent = message;
        }

        function initializeCartPage() {
            const list = doc.querySelector('[data-cart-items]');
            if (!list) return;
            const status = doc.querySelector('[data-cart-status]');
            const subtotal = doc.querySelector('[data-cart-subtotal]');
            const tax = doc.querySelector('[data-cart-tax]');
            const delivery = doc.querySelector('[data-cart-delivery]');
            const total = doc.querySelector('[data-cart-total]');
            const quantity = doc.querySelector('[data-cart-quantity]');
            const clear = doc.querySelector('[data-clear-cart]');
            const checkout = doc.querySelector('[data-checkout-link]');

            function render() {
                const entries = store.getEntries();
                list.replaceChildren();
                for (const entry of entries) {
                    const item = browser.MidnightMenu.find((candidate) => candidate.id === entry.menuItemId);
                    if (!item) continue;
                    const row = element('li', 'cart-item');
                    const photo = element('div', 'cart-item__photo');
                    photo.append(dishImage(item, true));
                    const detail = element('div', 'cart-item__details');
                    detail.append(
                        element('h2', '', entry.dishName),
                        element('p', '', `${ordering.formatPrice(entry.unitPricePaise)} each · Preview price`)
                    );
                    if (entry.customizations.length) {
                        const labels = entry.customizations.map((selection) => {
                            const group = (settings.customizations[entry.menuItemId] || []).find((option) => option.id === selection.groupId);
                            const choice = group?.choices.find((option) => option.id === selection.choiceId);
                            return choice ? `${group.label}: ${choice.label}` : '';
                        }).filter(Boolean);
                        if (labels.length) detail.append(element('p', 'cart-item__customizations', labels.join(' · ')));
                    }
                    const controls = element('div', 'quantity-control');
                    const decrease = element('button', 'button button--secondary', '−');
                    decrease.type = 'button';
                    decrease.setAttribute('aria-label', `Decrease quantity for ${entry.dishName}`);
                    decrease.addEventListener('click', () => {
                        if (entry.quantity > 1) store.updateQuantity(entry.entryId, entry.quantity - 1);
                        render();
                    });
                    const count = element('span', 'quantity-control__value', String(entry.quantity));
                    const increase = element('button', 'button button--secondary', '+');
                    increase.type = 'button';
                    increase.setAttribute('aria-label', `Increase quantity for ${entry.dishName}`);
                    increase.disabled = entry.quantity >= ordering.MAX_QUANTITY;
                    increase.addEventListener('click', () => {
                        if (entry.quantity < ordering.MAX_QUANTITY) store.updateQuantity(entry.entryId, entry.quantity + 1);
                        render();
                    });
                    controls.append(decrease, count, increase);
                    const remove = element('button', 'button button--text', 'Remove');
                    remove.type = 'button';
                    remove.addEventListener('click', () => store.remove(entry.entryId));
                    const itemTotal = element('strong', 'cart-item__subtotal', ordering.formatPrice(entry.itemSubtotalPaise));
                    detail.append(controls, remove);
                    row.append(photo, detail, itemTotal);
                    list.append(row);
                }
                const totals = store.totals();
                subtotal.textContent = ordering.formatPrice(totals.subtotalPaise);
                quantity.textContent = String(totals.quantity);
                total.textContent = ordering.formatPrice(totals.totalPaise);
                tax.hidden = totals.taxPaise === 0;
                if (!tax.hidden) tax.querySelector('[data-total-value]').textContent = ordering.formatPrice(totals.taxPaise);
                delivery.hidden = totals.deliveryPaise === 0;
                if (!delivery.hidden) delivery.querySelector('[data-total-value]').textContent = ordering.formatPrice(totals.deliveryPaise);
                status.textContent = entries.length
                    ? 'Preview cart only. Menu prices and availability are not confirmed.'
                    : 'Your cart is empty.';
                clear.disabled = entries.length === 0;
                checkout.setAttribute('aria-disabled', String(entries.length === 0));
                checkout.classList.toggle('is-disabled', entries.length === 0);
            }

            clear.addEventListener('click', () => {
                store.clear();
                render();
            });
            browser.addEventListener('midnight:cart-updated', render);
            render();
        }

        function initializeCheckoutPage() {
            const form = doc.querySelector('[data-checkout-form]');
            if (!form) return;
            const status = form.querySelector('[data-form-status]');
            const review = doc.querySelector('[data-checkout-items]');
            const total = doc.querySelector('[data-checkout-total]');
            const submit = form.querySelector('[type="submit"]');
            const confirmation = doc.querySelector('[data-order-confirmation]');
            const summary = doc.querySelector('[data-confirmation-summary]');

            function renderReview() {
                const entries = store.getEntries();
                review.replaceChildren();
                entries.forEach((entry) => {
                    const item = browser.MidnightMenu.find((candidate) => candidate.id === entry.menuItemId);
                    if (!item) return;
                    const row = element('li', 'checkout-item');
                    const image = element('div', 'checkout-item__photo');
                    image.append(dishImage(item, true));
                    row.append(image,
                        element('span', '', `${entry.dishName} × ${entry.quantity}`),
                        element('strong', '', ordering.formatPrice(entry.itemSubtotalPaise)));
                    review.append(row);
                });
                total.textContent = ordering.formatPrice(store.totals().totalPaise);
                submit.disabled = entries.length === 0;
                if (!entries.length) status.textContent = 'Your preview cart is empty.';
            }

            function validateFields() {
                const fullName = form.elements.fullName.value.trim();
                const phone = form.elements.phone.value.trim();
                const email = form.elements.email.value.trim();
                const address = form.elements.address.value.trim();
                const city = form.elements.city.value.trim();
                const postalCode = form.elements.postalCode.value.trim();
                if (fullName.length < 2 || fullName.length > 120) throw new Error('Enter your full name.');
                if (!/^[+0-9()\s-]{8,20}$/.test(phone) || phone.replace(/\D/g, '').length < 8) {
                    throw new Error('Enter a valid mobile number.');
                }
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address or leave it blank.');
                if (address.length < 5 || address.length > 1000) throw new Error('Enter a complete delivery address.');
                if (!city || city.length > 120) throw new Error('Enter your city.');
                if (!/^[A-Za-z0-9 -]{3,12}$/.test(postalCode)) throw new Error('Enter a valid postal code.');
                return { fullName, phone, email, address, city, postalCode };
            }

            form.addEventListener('submit', (event) => {
                event.preventDefault();
                status.textContent = '';
                try {
                    if (!form.reportValidity()) return;
                    const entries = store.getEntries();
                    if (!entries.length) throw new Error('Add a menu item before checkout.');
                    const customer = validateFields();
                    if (settings.orderingEnabled && settings.pricingConfirmed) {
                        throw new Error('The secure restaurant order API is not connected. No order was submitted.');
                    }
                    const reference = `PREVIEW-${Date.now().toString(36).toUpperCase()}`;
                    summary.replaceChildren(
                        element('h2', '', 'Preview confirmation'),
                        element('p', '', `Reference: ${reference}`),
                        element('p', '', `Prepared for ${customer.fullName}.`),
                        element('p', '', `${entries.length} distinct menu item(s), ${store.totals().quantity} serving(s).`),
                        element('p', '', `Preview total: ${ordering.formatPrice(store.totals().totalPaise)}.`),
                        element('p', 'notice', 'This is a local demonstration only. No order was sent to the restaurant, no delivery was arranged, and no payment was collected.')
                    );
                    confirmation.hidden = false;
                    form.hidden = true;
                    store.clear();
                    confirmation.focus();
                } catch (error) {
                    status.textContent = error.message;
                }
            });
            browser.addEventListener('midnight:cart-updated', renderReview);
            attachNoticeListeners();
            renderReview();
        }

        function initializeMenuPage() {
            initializeDetailDialog();
        }

        attachNoticeListeners();
        updateCount();
        initializeMenuPage();
        initializeCartPage();
        initializeCheckoutPage();
    }
})();
