(() => {
    const list = document.querySelector('[data-cart-items]');
    if (!list) return;
    const status = document.querySelector('[data-cart-status]');
    const total = document.querySelector('[data-cart-total]');
    let menu = [];

    function render() {
        const cart = window.Midnight.readCart();
        const indexed = new Map(menu.map((item) => [Number(item.id), item]));
        list.replaceChildren();
        let sum = 0;
        for (const entry of cart) {
            const item = indexed.get(Number(entry.id));
            if (!item) continue;
            sum += item.price_paise * entry.quantity;
            const li = document.createElement('li');
            li.className = 'cart-item';
            const name = document.createElement('h2');
            name.textContent = item.name;
            const price = document.createElement('p');
            price.textContent = `${window.Midnight.formatPrice(item.price_paise)} each`;
            const quantity = document.createElement('label');
            quantity.textContent = `Quantity for ${item.name}`;
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.max = '20';
            input.value = String(entry.quantity);
            input.addEventListener('change', () => {
                const updated = window.Midnight.readCart();
                const target = updated.find((line) => Number(line.id) === Number(entry.id));
                const amount = Math.max(1, Math.min(20, Number(input.value) || 1));
                if (target) target.quantity = amount;
                window.Midnight.writeCart(updated);
                render();
            });
            quantity.append(input);
            const remove = document.createElement('button');
            remove.className = 'button button--secondary';
            remove.type = 'button';
            remove.textContent = 'Remove';
            remove.addEventListener('click', () => {
                window.Midnight.writeCart(window.Midnight.readCart().filter((line) => Number(line.id) !== Number(entry.id)));
                render();
            });
            li.append(name, price, quantity, remove);
            list.append(li);
        }
        total.textContent = window.Midnight.formatPrice(sum);
        status.textContent = list.children.length ? '' : 'Your cart is empty.';
    }

    window.Midnight.api('/api/menu')
        .then((data) => { menu = data.items; render(); })
        .catch((error) => { status.textContent = error.message; });
    window.addEventListener('midnight:cart-updated', render);
})();
