(() => {
    const profile = document.querySelector('[data-profile]');
    const orders = document.querySelector('[data-orders]');
    const reservations = document.querySelector('[data-reservations]');
    const profileForm = document.querySelector('[data-profile-form]');

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
            profileForm.elements.fullName.value = session.customer.fullName;
            profileForm.elements.email.value = session.customer.email;
            profileForm.elements.currentPassword.required = session.customer.authProvider !== 'google';
            profile.textContent = `Signed in${session.customer.authProvider ? ` with ${session.customer.authProvider.replace('+', ' and ')}` : ''}.`;
            const picture = document.querySelector('[data-profile-picture]');
            const googleLink = document.querySelector('[data-google-link-account]');
            if (session.customer.profilePicture) {
                picture.src = session.customer.profilePicture;
                picture.alt = `${session.customer.fullName}'s Google profile picture`;
                picture.hidden = false;
            }
            if (googleLink && ['google', 'password+google'].includes(session.customer.authProvider)) {
                googleLink.hidden = true;
            }
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

    document.querySelector('[data-google-link-account]')?.addEventListener('click', () => {
        const link = document.querySelector('[data-google-link-account]');
        link.setAttribute('aria-busy', 'true');
        link.textContent = 'Connecting to Google…';
    });

    profileForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!profileForm.reportValidity()) return;
        try {
            const result = await window.Midnight.api('/api/auth/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    fullName: profileForm.elements.fullName.value,
                    email: profileForm.elements.email.value,
                    currentPassword: profileForm.elements.currentPassword.value
                })
            });
            profileForm.elements.currentPassword.value = '';
            profile.textContent = `Profile updated for ${result.customer.fullName}.`;
        } catch (error) {
            profile.textContent = error.message;
        }
    });

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
