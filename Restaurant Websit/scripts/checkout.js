(() => {
    const form = document.querySelector('[data-checkout-form]');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const status = form.querySelector('[data-form-status]');
        const items = window.Midnight.readCart();
        if (!items.length) {
            status.textContent = 'Your cart is empty. Add a menu item before checkout.';
            return;
        }
        try {
            const auth = await window.Midnight.api('/api/auth/me');
            if (!auth.customer) {
                location.href = 'login.html';
                return;
            }
            const order = await window.Midnight.api('/api/orders', {
                method: 'POST',
                body: JSON.stringify({ items, address: form.elements.address.value.trim() })
            });
            if (typeof window.Razorpay !== 'function') throw new Error('The secure payment window did not load. No payment was taken.');
            const checkout = new window.Razorpay({
                key: order.payment.keyId,
                order_id: order.payment.orderId,
                amount: order.order.amount,
                currency: order.order.currency,
                name: 'Midnight Bistro',
                description: `Order ${order.order.id}`,
                handler: async (response) => {
                    try {
                        await window.Midnight.api('/api/payments/verify', {
                            method: 'POST',
                            body: JSON.stringify({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature
                            })
                        });
                        window.Midnight.writeCart([]);
                        status.textContent = 'Payment verified and order confirmed.';
                        form.reset();
                    } catch (error) {
                        status.textContent = `Payment needs confirmation: ${error.message} Check your order history before retrying.`;
                    }
                },
                modal: { ondismiss: () => { status.textContent = 'Payment was not completed. Your order remains pending until verified.'; } }
            });
            checkout.on('payment.failed', (response) => {
                status.textContent = response.error?.description || 'Payment failed. No successful payment was recorded.';
            });
            checkout.open();
        } catch (error) {
            status.textContent = error.message;
        }
    });
})();
