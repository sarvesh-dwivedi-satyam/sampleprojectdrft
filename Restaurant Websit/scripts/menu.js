(() => {
    const list = document.querySelector('[data-menu-items]');
    const form = document.querySelector('#menu-filters');
    const status = document.querySelector('[data-menu-status]');
    if (!list || !form || !status) return;

    const items = window.MidnightMenu;
    if (!Array.isArray(items) || items.length !== 60) {
        status.textContent = 'The menu could not be loaded. Please try again later.';
        return;
    }

    const search = form.elements.search;
    const clearSearch = form.querySelector('[data-clear-search]');
    const currency = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    });
    const categoryLabels = window.MidnightMenuCategories;
    let searchTimer;

    function normalize(value) {
        return String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('en-IN')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .replace(/\s+/g, ' ');
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function requestedGroup() {
        const requested = normalize(new URLSearchParams(location.search).get('category') || '');
        const aliases = {
            'indian starters': 'starters',
            starters: 'starters',
            soups: 'soups',
            'north indian main course': 'main-course',
            'main course': 'main-course',
            'main course vegetarian': 'main-course',
            'main course non vegetarian': 'main-course',
            'biryani and rice': 'rice-biryani',
            'rice and biryani': 'rice-biryani',
            'rice biryani': 'rice-biryani',
            breads: 'breads',
            'indian breads': 'breads',
            desserts: 'desserts',
            beverages: 'beverages'
        };
        return aliases[requested] || requested;
    }

    function buildSearchTokens(item) {
        return new Set(normalize([
            item.name,
            item.category,
            categoryLabels[item.group] || item.group,
            item.description,
            item.keywords
        ].join(' ')).split(' '));
    }

    function matchesSearch(item, query) {
        if (!query) return true;
        const terms = query.split(' ');
        const wantsNonVegetarian = terms.includes('non') || terms.includes('nonveg');
        const wantsVegetarian = !wantsNonVegetarian && (terms.includes('veg') || terms.includes('vegetarian'));
        if (wantsNonVegetarian && item.vegetarian) return false;
        if (wantsVegetarian && !item.vegetarian) return false;
        const textTerms = terms.filter((term) => !['veg', 'vegetarian', 'non', 'nonveg'].includes(term));
        const tokens = buildSearchTokens(item);
        return textTerms.every((term) => tokens.has(term));
    }

    function renderCard(item) {
        const listItem = createElement('li');
        const card = createElement('article', 'menu-card');
        const figure = createElement('figure', 'menu-card__image');
        const image = createElement('img');
        image.src = window.MidnightImages?.dish || 'assets/images/L1.jpg';
        image.alt = `Temporary restaurant artwork for ${item.name}; dish photography is not yet available`;
        image.loading = 'lazy';
        image.decoding = 'async';
        figure.append(image);

        const body = createElement('div', 'menu-card__body');
        const badges = createElement('div', 'menu-card__badges');
        const category = createElement('span', 'menu-card__category', item.category);
        const diet = createElement('span', `diet-indicator ${item.vegetarian ? 'diet-indicator--veg' : 'diet-indicator--nonveg'}`);
        const dietMark = createElement('span', 'diet-indicator__mark');
        dietMark.setAttribute('aria-hidden', 'true');
        diet.append(dietMark, document.createTextNode(item.vegetarian ? 'Vegetarian' : 'Non-vegetarian'));
        badges.append(category, diet);
        if (item.featured) badges.append(createElement('span', 'menu-card__featured', 'Bistro favourite'));

        const heading = createElement('h3', '', item.name);
        const description = createElement('p', 'menu-card__description', item.description);
        const footer = createElement('div', 'menu-card__footer');
        const priceGroup = createElement('div', 'menu-card__price');
        const price = createElement('strong', '', currency.format(item.priceRupees));
        const priceLabel = createElement('span', '', 'Illustrative sample');
        priceGroup.append(price, priceLabel);
        footer.append(priceGroup, createElement('span', 'menu-card__unavailable', 'Ordering not enabled'));
        body.append(badges, heading, description, footer);
        card.append(figure, body);
        listItem.append(card);
        return listItem;
    }

    function clearFilters() {
        form.reset();
        search.focus();
        render();
    }

    function render() {
        window.clearTimeout(searchTimer);
        clearSearch.hidden = !search.value;
        const values = new FormData(form);
        const query = normalize(values.get('search') || '');
        const category = String(values.get('category') || '');
        const diet = String(values.get('diet') || '');
        const sort = String(values.get('sort') || 'featured');

        let visible = items.filter((item) => {
            const matchesItemSearch = matchesSearch(item, query);
            const matchesCategory = !category || item.group === category;
            const matchesDiet = !diet || (diet === 'vegetarian' ? item.vegetarian : !item.vegetarian);
            return matchesItemSearch && matchesCategory && matchesDiet;
        });

        if (sort === 'price-low') {
            visible.sort((a, b) => a.priceRupees - b.priceRupees || a.name.localeCompare(b.name));
        } else if (sort === 'price-high') {
            visible.sort((a, b) => b.priceRupees - a.priceRupees || a.name.localeCompare(b.name));
        } else if (sort === 'name') {
            visible.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            visible.sort((a, b) => Number(b.featured) - Number(a.featured) || a.id - b.id);
        }

        list.replaceChildren();
        if (!visible.length) {
            const empty = createElement('li', 'menu-empty');
            empty.append(
                createElement('span', 'eyebrow', 'A quiet moment in the kitchen'),
                createElement('h3', '', 'No dishes found'),
                createElement('p', '', 'Try another search, or clear your filters to explore the full menu.')
            );
            const reset = createElement('button', 'button button--secondary', 'Clear filters');
            reset.type = 'button';
            reset.addEventListener('click', clearFilters);
            empty.append(reset);
            list.append(empty);
            status.textContent = 'No dishes match your search and filters.';
            return;
        }

        const fragment = document.createDocumentFragment();
        visible.forEach((item) => fragment.append(renderCard(item)));
        list.append(fragment);
        status.textContent = `${visible.length} of ${items.length} dishes`;
    }

    const initialGroup = requestedGroup();
    if ([...form.elements.category.options].some((option) => option.value === initialGroup)) {
        form.elements.category.value = initialGroup;
    }

    form.addEventListener('submit', (event) => event.preventDefault());
    form.addEventListener('input', (event) => {
        if (event.target === search) {
            window.clearTimeout(searchTimer);
            clearSearch.hidden = !search.value;
            searchTimer = window.setTimeout(render, 120);
        } else {
            render();
        }
    });
    form.addEventListener('change', render);
    form.addEventListener('reset', () => window.setTimeout(render, 0));
    clearSearch.addEventListener('click', () => {
        search.value = '';
        render();
        search.focus();
    });
    form.querySelectorAll('[data-suggest]').forEach((button) => {
        button.addEventListener('click', () => {
            search.value = button.dataset.suggest;
            render();
            search.focus();
        });
    });

    render();
})();
