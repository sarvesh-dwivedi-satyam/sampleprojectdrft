(() => {
    const list = document.querySelector('[data-menu-items]');
    if (!list) return;
    const form = document.querySelector('#menu-filters');
    const status = document.querySelector('[data-menu-status]');
    let items = [];
    const categories = new Set();

    function make(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function render() {
        const values = new FormData(form);
        const query = String(values.get('search') || '').trim().toLowerCase();
        const category = String(values.get('category') || '');
        const diet = String(values.get('diet') || '');
        let visible = items.filter((item) =>
            (!query || `${item.name} ${item.description}`.toLowerCase().includes(query)) &&
            (!category || item.category === category) &&
            (!diet || (diet === 'vegetarian' ? item.vegetarian : !item.vegetarian))
        );
        if (values.get('sort') === 'price-low') visible.sort((a, b) => a.price_paise - b.price_paise);
        if (values.get('sort') === 'price-high') visible.sort((a, b) => b.price_paise - a.price_paise);
        if (values.get('sort') === 'name') visible.sort((a, b) => a.name.localeCompare(b.name));
        list.replaceChildren();
        for (const item of visible) {
            const li = make('li');
            const card = make('article', 'menu-card');
            const figure = make('figure', 'menu-card__image');
            if (item.image_url) {
                const image = make('img');
                image.src = item.image_url;
                image.alt = `${item.name}, a ${item.vegetarian ? 'vegetarian' : 'non-vegetarian'} menu dish`;
                image.loading = 'lazy';
                figure.append(image);
            } else {
                figure.setAttribute('aria-label', `Image placeholder for ${item.name}`);
                figure.append(make('span', 'image-placeholder', 'Dish image coming soon'));
            }
            const body = make('div', 'menu-card__body');
            body.append(make('p', 'eyebrow', `${item.category} · ${item.vegetarian ? 'Vegetarian' : 'Non-vegetarian'}`));
            body.append(make('h3', '', item.name), make('p', '', item.description));
            const footer = make('div', 'menu-card__footer');
            footer.append(make('strong', '', window.Midnight.formatPrice(item.price_paise)));
            const button = make('button', 'button button--primary', 'Add to Cart');
            button.type = 'button';
            button.addEventListener('click', () => {
                try {
                    window.Midnight.addToCart(item.id);
                    status.textContent = `${item.name} added to cart.`;
                } catch (error) {
                    status.textContent = error.message;
                }
            });
            footer.append(button);
            body.append(footer);
            card.append(figure, body);
            li.append(card);
            list.append(li);
        }
        status.textContent = visible.length ? `${visible.length} menu item${visible.length === 1 ? '' : 's'} shown.` : 'No dishes match your filters.';
    }

    form.addEventListener('input', render);
    form.addEventListener('change', render);
    window.Midnight.api('/api/menu')
        .then((data) => {
            items = data.items;
            const select = form.elements.category;
            [...new Set(items.map((item) => item.category))].forEach((category) => categories.add(category));
            for (const category of categories) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.append(option);
            }
            const requestedCategory = new URLSearchParams(location.search).get('category');
            if (categories.has(requestedCategory)) select.value = requestedCategory;
            render();
        })
        .catch((error) => { status.textContent = error.message; });
})();
