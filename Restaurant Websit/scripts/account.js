(() => {
    const profile = document.querySelector('[data-profile]');
    const orders = document.querySelector('[data-orders]');
    const reservations = document.querySelector('[data-reservations]');

    function item(tag, text) {
        const node = document.createElement(tag);
        node.textContent = text;
        return node;
    }

    async function loadAccount() {
        const session = await window.Midnight.api('/api/auth/me');
        if (!session.customer) {
            location.href = 'login.html';
            return;
        }
        if (profile) {
            profile.textContent = `${session.customer.fullName} · ${session.customer.email}`;
        }
        if (orders) {
            const data = await window.Midnight.api('/api/orders/mine');
            orders.replaceChildren();
            for (const order of data.orders) {
                const row = document.createElement('li');
                const lines = order.items.map((line) => `${line.quantity} × ${line.name}`).join(', ');
                row.append(item('h3', `Order #${order.id}`));
                row.append(item('p', `${lines} · ${window.Midnight.formatPrice(order.total_paise)}`));
                row.append(item('p', `Status: ${order.status} · Payment: ${order.payment_status}`));
                orders.append(row);
            }
            document.querySelector('[data-orders-status]').textContent = data.orders.length ? '' : 'No orders to show yet.';
        }
        if (reservations) {
            const data = await window.Midnight.api('/api/reservations/mine');
            reservations.replaceChildren();
            for (const reservation of data.reservations) {
                const row = document.createElement('li');
                row.append(item('h3', `Reservation ${reservation.reservation_date} at ${String(reservation.reservation_time).slice(0, 5)}`));
                row.append(item('p', `${reservation.guest_count} guest(s) · ${reservation.status}`));
                if (reservation.status === 'confirmed') {
                    const button = document.createElement('button');
                    button.className = 'button button--secondary';
                    button.type = 'button';
                    button.textContent = 'Cancel reservation';
                    button.addEventListener('click', async () => {
                        try {
                            await window.Midnight.api(`/api/reservations/${reservation.id}/cancel`, { method: 'POST', body: '{}' });
                            await loadAccount();
                        } catch (error) {
                            document.querySelector('[data-reservations-status]').textContent = error.message;
                        }
                    });
                    row.append(button);
                }
                reservations.append(row);
            }
            document.querySelector('[data-reservations-status]').textContent = data.reservations.length ? '' : 'No reservations to show yet.';
        }
    }

    document.querySelectorAll('[data-logout]').forEach((link) => link.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
            await window.Midnight.api('/api/auth/logout', { method: 'POST', body: '{}' });
            location.href = 'login.html';
        } catch (error) {
            if (profile) profile.textContent = error.message;
        }
    }));

    loadAccount().catch((error) => {
        if (profile) profile.textContent = error.message;
        if (document.querySelector('[data-orders-status]')) document.querySelector('[data-orders-status]').textContent = error.message;
        if (document.querySelector('[data-reservations-status]')) document.querySelector('[data-reservations-status]').textContent = error.message;
    });
})();
