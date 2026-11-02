(() => {
    const list = document.querySelector('[data-menu-items]');
    const form = document.querySelector('#menu-filters');
    const status = document.querySelector('[data-menu-status]');
    const paginationStatus = document.querySelector('[data-pagination-status]');
    const loadMore = document.querySelector('[data-load-more]');
    if (!list || !form || !status || !paginationStatus || !loadMore) return;

    const items = window.MidnightMenu;
    const searchTools = window.MidnightMenuSearch;
    const categoryLabels = window.MidnightMenuCategories;
    if (!Array.isArray(items) || !searchTools || !Object.keys(categoryLabels).length) {
        status.textContent = 'The menu could not be loaded. Please try again later.';
        return;
    }

    const engine = searchTools.createIndex(items);
    const search = form.elements.search;
    const clearSearch = form.querySelector('[data-clear-search]');
    const suggestions = document.querySelector('#menu-suggestions');
    const categorySelect = form.elements.category;
    const subcategorySelect = form.elements.subcategory;
    const pageSize = 24;
    const currency = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    });
    let activeSuggestion = -1;
    let visibleSuggestions = [];
    let visibleResults = [];
    let renderedCount = 0;

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function addOption(select, value, label) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.append(option);
    }

    function populateCategories() {
        const groups = [...new Set(items.map((item) => item.group))]
            .sort((left, right) => (categoryLabels[left] || left).localeCompare(categoryLabels[right] || right));
        groups.forEach((group) => addOption(categorySelect, group, categoryLabels[group] || group));
        const categoryByLabel = new Map(groups.map((group) => [engine.normalize(categoryLabels[group] || group), group]));
        const requested = new URLSearchParams(location.search).get('category') || '';
        const requestedGroup = groups.includes(requested) ? requested : categoryByLabel.get(engine.normalize(requested));
        if (requestedGroup) categorySelect.value = requestedGroup;
    }

    function populateSubcategories() {
        const previous = subcategorySelect.value;
        subcategorySelect.replaceChildren();
        addOption(subcategorySelect, '', 'All subcategories');
        const group = categorySelect.value;
        const subcategories = [...new Set(items
            .filter((item) => !group || item.group === group)
            .map((item) => item.subcategory)
            .filter(Boolean))]
            .sort((left, right) => left.localeCompare(right));
        subcategories.forEach((subcategory) => addOption(subcategorySelect, subcategory, subcategory));
        if (subcategories.includes(previous)) subcategorySelect.value = previous;
    }

    function selectedFilters() {
        const diet = form.elements.diet.value;
        const min = form.elements.minPrice.value.trim();
        const max = form.elements.maxPrice.value.trim();
        return {
            group: categorySelect.value,
            subcategory: subcategorySelect.value,
            foodType: diet === 'vegan' ? '' : diet,
            vegan: diet === 'vegan',
            bestseller: form.elements.bestseller.value === 'true',
            availability: form.elements.availability.value,
            minPrice: min === '' ? undefined : Number(min),
            maxPrice: max === '' ? undefined : Number(max)
        };
    }

    function imageFor(item, compact = false) {
        const path = item.imageKey && window.MidnightImages[item.imageKey];
        if (path) {
            const image = element('img', compact ? 'suggestion-image' : '');
            image.src = path;
            image.alt = `Photograph of ${item.name}`;
            image.loading = 'lazy';
            image.decoding = 'async';
            return image;
        }
        const fallback = element('span', `menu-image-fallback${compact ? ' menu-image-fallback--compact' : ''}`, 'Dish photo unavailable');
        fallback.setAttribute('role', 'img');
        fallback.setAttribute('aria-label', `No dish-specific photograph is available for ${item.name}`);
        return fallback;
    }

    function appendHighlighted(target, value, query) {
        const normalizedQuery = engine.normalize(query);
        const terms = normalizedQuery.split(' ').filter(Boolean);
        if (!terms.length) {
            target.textContent = value;
            return;
        }
        const ranges = [];
        for (const term of terms) {
            const expression = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig');
            const exactMatches = [...value.matchAll(expression)];
            exactMatches.forEach((match) => ranges.push([match.index, match.index + match[0].length]));
            if (!exactMatches.length && term.length >= 4) {
                const limit = term.length >= 7 ? 2 : 1;
                for (const match of value.matchAll(/[\p{L}\p{N}]+/gu)) {
                    const word = engine.normalize(match[0]);
                    if (Math.abs(word.length - term.length) <= limit &&
                        window.MidnightMenuSearch.editDistance(term, word, limit) <= limit) {
                        ranges.push([match.index, match.index + match[0].length]);
                    }
                }
            }
        }
        ranges.sort((left, right) => left[0] - right[0] || right[1] - left[1]);
        let last = 0;
        for (const [start, end] of ranges) {
            if (start < last) continue;
            target.append(document.createTextNode(value.slice(last, start)));
            target.append(element('mark', '', value.slice(start, end)));
            last = end;
        }
        target.append(document.createTextNode(value.slice(last)));
    }

    function renderCard(item) {
        const listItem = element('li');
        const card = element('article', 'menu-card');
        const figure = element('figure', 'menu-card__image');
        figure.append(imageFor(item));

        const body = element('div', 'menu-card__body');
        const badges = element('div', 'menu-card__badges');
        badges.append(element('span', 'menu-card__category', `${item.category} · ${item.subcategory}`));
        if (item.foodType === 'vegetarian' || item.foodType === 'non-vegetarian') {
            const diet = element('span', `diet-indicator ${item.foodType === 'vegetarian' ? 'diet-indicator--veg' : 'diet-indicator--nonveg'}`);
            const marker = element('span', 'diet-indicator__mark');
            marker.setAttribute('aria-hidden', 'true');
            diet.append(marker, document.createTextNode(item.foodType === 'vegetarian' ? 'Vegetarian' : 'Non-vegetarian'));
            badges.append(diet);
        } else {
            badges.append(element('span', 'diet-indicator', 'Food type unverified'));
        }
        if (item.bestseller === true) badges.append(element('span', 'menu-card__featured', 'Bestseller'));

        body.append(badges, element('h3', '', item.name));
        body.append(element('p', 'menu-card__description', item.description || 'Dish description and ingredients require restaurant verification.'));
        const footer = element('div', 'menu-card__footer');
        const priceGroup = element('div', 'menu-card__price');
        priceGroup.append(
            element('strong', '', currency.format(item.priceRupees)),
            element('span', '', 'Illustrative sample price')
        );
        footer.append(
            priceGroup,
            element('span', 'menu-card__unavailable', item.availability === 'available' ? 'Available' : 'Availability to be confirmed')
        );
        body.append(footer);
        card.append(figure, body);
        listItem.append(card);
        return listItem;
    }

    function readResults() {
        const filters = selectedFilters();
        if (Number.isFinite(filters.minPrice) && Number.isFinite(filters.maxPrice) && filters.minPrice > filters.maxPrice) {
            return { results: [], invalidRange: true };
        }
        const query = engine.expandAlias(search.value);
        let results = engine.search(query, filters);
        const sort = form.elements.sort.value;
        if (!query) {
            if (sort === 'featured') {
                results.sort((left, right) => Number(right.item.featured) - Number(left.item.featured) || left.item.id.localeCompare(right.item.id));
            } else if (sort === 'price-low') {
                results.sort((left, right) => left.item.priceRupees - right.item.priceRupees || left.item.name.localeCompare(right.item.name));
            } else if (sort === 'price-high') {
                results.sort((left, right) => right.item.priceRupees - left.item.priceRupees || left.item.name.localeCompare(right.item.name));
            } else if (sort === 'name-asc') {
                results.sort((left, right) => left.item.name.localeCompare(right.item.name));
            } else if (sort === 'name-desc') {
                results.sort((left, right) => right.item.name.localeCompare(left.item.name));
            }
        } else if (sort === 'price-low') {
            results.sort((left, right) => left.item.priceRupees - right.item.priceRupees || right.score - left.score);
        } else if (sort === 'price-high') {
            results.sort((left, right) => right.item.priceRupees - left.item.priceRupees || right.score - left.score);
        } else if (sort === 'name-asc') {
            results.sort((left, right) => left.item.name.localeCompare(right.item.name));
        } else if (sort === 'name-desc') {
            results.sort((left, right) => right.item.name.localeCompare(left.item.name));
        }
        return { results, invalidRange: false };
    }

    function categoryMatches(query) {
        const normalized = engine.normalize(query);
        if (!normalized) return [];
        return [...new Set(items.map((item) => item.group))]
            .map((group) => ({ group, label: categoryLabels[group] || group, normalized: engine.normalize(categoryLabels[group] || group) }))
            .filter((category) => category.normalized.includes(normalized) || normalized.split(' ').every((term) => category.normalized.includes(term)))
            .slice(0, 3);
    }

    function createSuggestionButton(option, index, query) {
        const button = element('button', 'search-suggestion');
        button.type = 'button';
        button.id = `menu-suggestion-${index}`;
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', String(index === activeSuggestion));
        button.dataset.suggestionIndex = String(index);
        if (option.type === 'item') {
            button.dataset.itemId = option.item.id;
            button.append(imageFor(option.item, true));
            const content = element('span', 'search-suggestion__content');
            const name = element('span', 'search-suggestion__name');
            appendHighlighted(name, option.item.name, query);
            content.append(name, element('span', 'search-suggestion__meta', `${option.item.category} · ${option.item.foodType === 'unverified' ? 'Food type unverified' : option.item.foodType}`));
            const price = element('strong', 'search-suggestion__price', currency.format(option.item.priceRupees));
            button.append(content, price);
        } else {
            button.dataset.group = option.group;
            button.append(element('span', 'search-suggestion__category-icon', '↳'));
            const name = element('span', 'search-suggestion__name');
            appendHighlighted(name, option.label, query);
            button.append(name, element('span', 'search-suggestion__meta', `${option.count} dishes`));
        }
        return button;
    }

    function renderSuggestions(results) {
        const query = search.value;
        const queryActive = Boolean(engine.normalize(query));
        let dishOptions;
        if (queryActive) {
            dishOptions = results.slice(0, 6).map(({ item }) => ({ type: 'item', item }));
        } else {
            dishOptions = results
                .filter(({ item }) => item.featured)
                .slice(0, 4)
                .map(({ item }) => ({ type: 'item', item }));
        }
        const groups = queryActive ? categoryMatches(query) : [...new Set(items.map((item) => item.group))]
            .slice(0, 4)
            .map((group) => ({ group, label: categoryLabels[group] || group }));
        const categoryOptions = groups.map((category) => ({
            type: 'category',
            ...category,
            count: items.filter((item) => item.group === category.group).length
        }));
        visibleSuggestions = [...dishOptions, ...categoryOptions];
        activeSuggestion = -1;
        suggestions.replaceChildren();

        const resultSummary = element('p', 'search-suggestions__summary',
            queryActive ? `${results.length} matching ${results.length === 1 ? 'dish' : 'dishes'}` : 'Explore menu highlights and categories');
        suggestions.append(resultSummary);
        if (dishOptions.length) {
            suggestions.append(element('p', 'search-suggestions__heading', queryActive ? 'Dish suggestions' : 'Menu highlights'));
            dishOptions.forEach((option, index) => suggestions.append(createSuggestionButton(option, index, query)));
        }
        if (categoryOptions.length) {
            suggestions.append(element('p', 'search-suggestions__heading', queryActive ? 'Categories' : 'Explore categories'));
            categoryOptions.forEach((option, index) => {
                const suggestionIndex = dishOptions.length + index;
                suggestions.append(createSuggestionButton(option, suggestionIndex, query));
            });
        }
        if (!visibleSuggestions.length) {
            suggestions.append(element('p', 'search-suggestions__empty', 'No close suggestions. Try another spelling or browse a category.'));
        }
        suggestions.hidden = false;
        search.setAttribute('aria-expanded', 'true');
        search.removeAttribute('aria-activedescendant');
    }

    function hideSuggestions() {
        suggestions.hidden = true;
        search.setAttribute('aria-expanded', 'false');
        search.removeAttribute('aria-activedescendant');
        activeSuggestion = -1;
    }

    function selectSuggestion(index) {
        const option = visibleSuggestions[index];
        if (!option) return;
        if (option.type === 'category') {
            categorySelect.value = option.group;
            populateSubcategories();
        } else {
            search.value = option.item.name;
        }
        hideSuggestions();
        render();
        search.focus();
    }

    function render() {
        clearSearch.hidden = !search.value;
        const { results, invalidRange } = readResults();
        visibleResults = results;
        renderedCount = Math.min(pageSize, results.length);
        list.replaceChildren();

        if (invalidRange) {
            status.textContent = 'Minimum price must not exceed maximum price.';
            list.append(element('li', 'menu-empty', 'Please correct the price range.'));
            paginationStatus.textContent = '';
            loadMore.hidden = true;
            return;
        }
        if (!results.length) {
            const empty = element('li', 'menu-empty');
            empty.append(
                element('span', 'eyebrow', 'A quiet moment in the kitchen'),
                element('h3', '', 'No dishes found'),
                element('p', '', 'Try another spelling, relax a filter, or browse a category.')
            );
            const query = search.value.trim();
            if (query) {
                const alternatives = engine.search(query, {}).slice(0, 3);
                alternatives.forEach(({ item }) => {
                    const suggestion = element('button', 'button button--secondary', `Try ${item.name}`);
                    suggestion.type = 'button';
                    suggestion.addEventListener('click', () => {
                        search.value = item.name;
                        render();
                        search.focus();
                    });
                    empty.append(suggestion);
                });
            }
            const reset = element('button', 'button button--secondary', 'Clear all filters');
            reset.type = 'button';
            reset.addEventListener('click', clearFilters);
            empty.append(reset);
            list.append(empty);
            status.textContent = 'No dishes match your search and filters.';
            paginationStatus.textContent = '';
            loadMore.hidden = true;
            return;
        }

        const fragment = document.createDocumentFragment();
        results.slice(0, renderedCount).forEach(({ item }) => fragment.append(renderCard(item)));
        list.append(fragment);
        status.textContent = `${results.length} matching ${results.length === 1 ? 'dish' : 'dishes'} · ${items.length} in catalog`;
        updatePagination();
        if (!suggestions.hidden) renderSuggestions(results);
    }

    function updatePagination() {
        paginationStatus.textContent = `Showing ${Math.min(renderedCount, visibleResults.length)} of ${visibleResults.length} dishes`;
        loadMore.hidden = renderedCount >= visibleResults.length;
    }

    function clearFilters() {
        form.reset();
        populateSubcategories();
        hideSuggestions();
        render();
        search.focus();
    }

    populateCategories();
    populateSubcategories();
    render();

    search.addEventListener('focus', () => renderSuggestions(readResults().results));
    search.addEventListener('input', () => {
        render();
        renderSuggestions(visibleResults);
    });
    search.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (suggestions.hidden) renderSuggestions(readResults().results);
            if (!visibleSuggestions.length) return;
            event.preventDefault();
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            activeSuggestion = (activeSuggestion + direction + visibleSuggestions.length) % visibleSuggestions.length;
            suggestions.querySelectorAll('[role="option"]').forEach((option, index) => {
                const active = index === activeSuggestion;
                option.setAttribute('aria-selected', String(active));
                if (active) {
                    search.setAttribute('aria-activedescendant', option.id);
                    option.scrollIntoView({ block: 'nearest' });
                }
            });
        } else if (event.key === 'Enter' && activeSuggestion >= 0) {
            event.preventDefault();
            selectSuggestion(activeSuggestion);
        } else if (event.key === 'Escape') {
            hideSuggestions();
        }
    });
    suggestions.addEventListener('click', (event) => {
        const option = event.target.closest('[data-suggestion-index]');
        if (option) selectSuggestion(Number(option.dataset.suggestionIndex));
    });
    suggestions.addEventListener('mousedown', (event) => {
        if (event.target.closest('[data-suggestion-index]')) event.preventDefault();
    });
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.search-control')) hideSuggestions();
    });
    clearSearch.addEventListener('click', () => {
        search.value = '';
        render();
        renderSuggestions(visibleResults);
        search.focus();
    });
    categorySelect.addEventListener('change', () => {
        populateSubcategories();
        render();
    });
    form.addEventListener('input', (event) => {
        if (event.target !== search) render();
    });
    form.addEventListener('change', (event) => {
        if (event.target !== categorySelect) render();
    });
    form.addEventListener('reset', () => window.setTimeout(() => {
        populateSubcategories();
        hideSuggestions();
        render();
    }, 0));
    form.querySelectorAll('[data-suggest]').forEach((button) => {
        button.addEventListener('click', () => {
            search.value = button.dataset.suggest;
            render();
            renderSuggestions(visibleResults);
            search.focus();
        });
    });
    loadMore.addEventListener('click', () => {
        const previousCount = renderedCount;
        renderedCount = Math.min(renderedCount + pageSize, visibleResults.length);
        const fragment = document.createDocumentFragment();
        visibleResults.slice(previousCount, renderedCount).forEach(({ item }) => fragment.append(renderCard(item)));
        list.append(fragment);
        updatePagination();
    });
})();
