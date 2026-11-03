(() => {
    const reservation = document.querySelector('[data-reservation-form]');
    if (reservation) {
        const dateField = reservation.elements.date;
        dateField.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
        reservation.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!reservation.reportValidity()) return;
            const status = reservation.querySelector('[data-form-status]');
            const values = Object.fromEntries(new FormData(reservation));
            try {
                const result = await window.Midnight.api('/api/reservations', { method: 'POST', body: JSON.stringify(values) });
                status.textContent = `Reservation request ${result.reservation.id} received for ${result.reservation.reservation_date} at ${String(result.reservation.reservation_time).slice(0, 5)}.`;
                reservation.reset();
            } catch (error) {
                status.textContent = error.message;
            }
        });
    }

    const contact = document.querySelector('[data-contact-form]');
    if (contact) {
        contact.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!contact.reportValidity()) return;
            const status = contact.querySelector('[data-form-status]');
            const values = Object.fromEntries(new FormData(contact));
            try {
                const result = await window.Midnight.api('/api/contact', { method: 'POST', body: JSON.stringify(values) });
                status.textContent = result.message;
                contact.reset();
            } catch (error) {
                status.textContent = error.message;
            }
        });
    }
})();
