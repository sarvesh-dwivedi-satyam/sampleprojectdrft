(() => {
    const status = document.querySelector('[data-admin-status]');
    const money = (paise) => window.Midnight.formatPrice(paise);
    const cell = (row, value) => {
        const node = document.createElement('td');
        node.textContent = String(value ?? '');
        row.append(node);
        return node;
    };
    const action = (label, callback) => {
        const button = document.createElement('button');
        button.className = 'button button--secondary';
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', callback);
        return button;
    };

    document.querySelector('[data-admin-login]')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        try {
            const result = await window.Midnight.api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: form.elements.email.value, password: form.elements.password.value })
            });
            if (result.customer.role !== 'admin') {
                await window.Midnight.api('/api/auth/logout', { method: 'POST' });
                throw new Error('This account does not have administrator access.');
            }
            location.href = 'index.html';
        } catch (error) {
            document.querySelector('[data-admin-status]').textContent = error.message;
        }
    });

    document.querySelectorAll('[data-admin-logout]').forEach((link) => link.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
            await window.Midnight.api('/api/auth/logout', { method: 'POST' });
            location.href = 'login.html';
        } catch (error) {
            status.textContent = error.message;
        }
    }));

    async function loadSummary() {
        const target = document.querySelector('[data-admin-metrics]');
        if (!target) return;
        const data = await window.Midnight.api('/api/admin/summary');
        const cards = [
            ['Orders', data.orders],
            ['Reservations', data.reservations],
            ['Customers', data.customers],
            ['Verified revenue', money(data.revenuePaise)]
        ];
        target.replaceChildren();
        for (const [label, value] of cards) {
            const article = document.createElement('article');
            article.className = 'metric-card';
            const heading = document.createElement('h2');
            heading.textContent = label;
            const number = document.createElement('p');
            number.textContent = String(value);
            article.append(heading, number);
            target.append(article);
        }
    }

    async function loadMenu() {
        const target = document.querySelector('[data-admin-menu]');
        if (!target) return;
        const data = await window.Midnight.api('/api/admin/menu');
        target.replaceChildren();
        for (const item of data.items) {
            const row = document.createElement('tr');
            cell(row, item.name);
            cell(row, item.category);
            cell(row, money(item.price_paise));
            cell(row, item.vegetarian ? 'Vegetarian' : 'Non-vegetarian');
            cell(row, item.available ? 'Available' : 'Unavailable');
            const actionCell = document.createElement('td');
            if (item.available) {
                actionCell.append(action('Mark unavailable', async () => {
                    try {
                        await window.Midnight.api(`/api/admin/menu/${item.id}`, { method: 'PATCH', body: JSON.stringify({
                            name: item.name, description: item.description, category: item.category,
                            priceRupees: item.price_paise / 100, imageUrl: item.image_url || '',
                            vegetarian: item.vegetarian, featured: item.featured, available: false
                        }) });
                        await loadMenu();
                        status.textContent = `${item.name} marked unavailable.`;
                    } catch (error) { status.textContent = error.message; }
                }));
            }
            row.append(actionCell);
            target.append(row);
        }
    }

    document.querySelector('[data-menu-create]')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const values = Object.fromEntries(new FormData(form));
        try {
            await window.Midnight.api('/api/admin/menu', {
                method: 'POST',
                body: JSON.stringify({
                    ...values,
                    vegetarian: form.elements.vegetarian.checked,
                    featured: form.elements.featured.checked
                })
            });
            form.reset();
            await loadMenu();
            status.textContent = 'Dish added.';
        } catch (error) { status.textContent = error.message; }
    });

    async function loadOrders() {
        const target = document.querySelector('[data-admin-orders]');
        if (!target) return;
        const data = await window.Midnight.api('/api/admin/orders');
        target.replaceChildren();
        for (const order of data.orders) {
            const row = document.createElement('tr');
            cell(row, `#${order.id}`);
            cell(row, `${order.full_name} (${order.email})`);
            cell(row, money(order.total_paise));
            cell(row, order.payment_status);
            cell(row, order.status);
            const field = document.createElement('td');
            const select = document.createElement('select');
            select.setAttribute('aria-label', `Update order ${order.id} status`);
            ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'].forEach((state) => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = state;
                option.selected = state === order.status;
                select.append(option);
            });
            select.addEventListener('change', async () => {
                try {
                    await window.Midnight.api(`/api/admin/orders/${order.id}`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) });
                    status.textContent = `Order ${order.id} updated.`;
                } catch (error) { status.textContent = error.message; }
            });
            field.append(select);
            row.append(field);
            target.append(row);
        }
    }

    async function loadReservations() {
        const target = document.querySelector('[data-admin-reservations]');
        if (!target) return;
        const data = await window.Midnight.api('/api/admin/reservations');
        target.replaceChildren();
        for (const reservation of data.reservations) {
            const row = document.createElement('tr');
            cell(row, reservation.guest_name);
            cell(row, `${reservation.reservation_date} ${String(reservation.reservation_time).slice(0, 5)}`);
            cell(row, reservation.guest_count);
            cell(row, `${reservation.guest_email} · ${reservation.guest_phone}`);
            cell(row, reservation.status);
            const field = document.createElement('td');
            const select = document.createElement('select');
            select.setAttribute('aria-label', `Update reservation ${reservation.id} status`);
            ['confirmed', 'cancelled', 'completed'].forEach((state) => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = state;
                option.selected = state === reservation.status;
                select.append(option);
            });
            select.addEventListener('change', async () => {
                try {
                    await window.Midnight.api(`/api/admin/reservations/${reservation.id}`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) });
                    status.textContent = `Reservation ${reservation.id} updated.`;
                } catch (error) { status.textContent = error.message; }
            });
            field.append(select);
            row.append(field);
            target.append(row);
        }
    }

    async function loadCustomers() {
        const target = document.querySelector('[data-admin-customers]');
        if (!target) return;
        const data = await window.Midnight.api('/api/admin/customers');
        target.replaceChildren();
        for (const customer of data.customers) {
            const row = document.createElement('tr');
            cell(row, customer.full_name);
            cell(row, customer.email);
            cell(row, customer.order_count);
            cell(row, new Date(customer.created_at).toLocaleDateString());
            target.append(row);
        }
    }

    const loaders = [loadSummary, loadMenu, loadOrders, loadReservations, loadCustomers].filter((loader) => {
        const targets = {
            loadSummary: '[data-admin-metrics]',
            loadMenu: '[data-admin-menu]',
            loadOrders: '[data-admin-orders]',
            loadReservations: '[data-admin-reservations]',
            loadCustomers: '[data-admin-customers]'
        };
        return document.querySelector(targets[loader.name]);
    });
    Promise.all(loaders.map((loader) => loader().catch((error) => { if (status) status.textContent = error.message; })));
})();
