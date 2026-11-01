(() => {
    const list = document.querySelector('[data-menu-items]');
    const form = document.querySelector('#menu-filters');
    const status = document.querySelector('[data-menu-status]');
    if (!list || !form || !status) return;

    const fallbackItems = [
        { id: 1, name: 'Paneer Tikka', description: 'Char-grilled paneer with a fragrant house spice marinade.', category: 'Indian Starters', price_paise: 32900, vegetarian: true, image_url: '', featured: true },
        { id: 2, name: 'Hara Bhara Kebab', description: 'Spinach, peas, and potato kebabs with green chilli aioli.', category: 'Indian Starters', price_paise: 28900, vegetarian: true, image_url: '', featured: true },
        { id: 3, name: 'Chicken Tikka', description: 'Juicy chicken cubes marinated in yogurt, ginger, and smoky spices.', category: 'Indian Starters', price_paise: 36900, vegetarian: false, image_url: '', featured: true },
        { id: 4, name: 'Murg Malai Tikka', description: 'Creamy Mughlai chicken tikka finished with a whisper of saffron.', category: 'Indian Starters', price_paise: 39900, vegetarian: false, image_url: '', featured: false },
        { id: 5, name: 'Veg Platter', description: 'An assortment of grilled vegetables and kebabs for sharing.', category: 'Indian Starters', price_paise: 34900, vegetarian: true, image_url: '', featured: false },
        { id: 6, name: 'Crispy Corn', description: 'Golden corn bites with chilli garlic crunch and fresh lime.', category: 'Indian Starters', price_paise: 21900, vegetarian: true, image_url: '', featured: false },
        { id: 7, name: 'Chilli Garlic Prawns', description: 'Wok-tossed prawns with garlic, chilli, and a hint of sesame.', category: 'Indian Starters', price_paise: 42900, vegetarian: false, image_url: '', featured: false },
        { id: 8, name: 'Tandoori Mushrooms', description: 'Smoky mushroom skewers with basil and charred lemon.', category: 'Indian Starters', price_paise: 25900, vegetarian: true, image_url: '', featured: false },
        { id: 9, name: 'Tandoori Chicken', description: 'Smoky tandoor-roasted chicken served with mint chutney.', category: 'Tandoori Specials', price_paise: 44900, vegetarian: false, image_url: '', featured: true },
        { id: 10, name: 'Afghani Chicken', description: 'Silky, charred chicken with cream, cashew, and black pepper.', category: 'Tandoori Specials', price_paise: 47900, vegetarian: false, image_url: '', featured: true },
        { id: 11, name: 'Fish Tikka', description: 'Citrus-marinated fish charred in the tandoor and finished with herbs.', category: 'Tandoori Specials', price_paise: 49900, vegetarian: false, image_url: '', featured: false },
        { id: 12, name: 'Paneer Achari', description: 'Paneer cubes grilled in pickling spices with green chilli warmth.', category: 'Tandoori Specials', price_paise: 32900, vegetarian: true, image_url: '', featured: false },
        { id: 13, name: 'Seekh Kebab', description: 'Minced lamb kebabs with onion, herbs, and a smoky finish.', category: 'Tandoori Specials', price_paise: 46900, vegetarian: false, image_url: '', featured: false },
        { id: 14, name: 'Mutton Sheekh', description: 'Tender mutton kebabs finished with roasted garlic and coriander.', category: 'Tandoori Specials', price_paise: 52900, vegetarian: false, image_url: '', featured: false },
        { id: 15, name: 'Tandoori Broccoli', description: 'Charred broccoli florets with chilli, lemon, and spice glaze.', category: 'Tandoori Specials', price_paise: 24900, vegetarian: true, image_url: '', featured: false },
        { id: 16, name: 'Murgh Reshmi', description: 'Velvety chicken kebabs with cream, mint, and mild pepper notes.', category: 'Tandoori Specials', price_paise: 45900, vegetarian: false, image_url: '', featured: false },
        { id: 17, name: 'Dal Midnight', description: 'Slow-simmered black lentils finished with cream and butter.', category: 'North Indian Main Course', price_paise: 36900, vegetarian: true, image_url: '', featured: true },
        { id: 18, name: 'Paneer Butter Masala', description: 'Soft paneer in a luxurious tomato-butter gravy.', category: 'North Indian Main Course', price_paise: 39900, vegetarian: true, image_url: '', featured: true },
        { id: 19, name: 'Shahi Paneer', description: 'Royal paneer curry with cashews, cream, and saffron.', category: 'North Indian Main Course', price_paise: 41900, vegetarian: true, image_url: '', featured: false },
        { id: 20, name: 'Kadai Paneer', description: 'Paneer tossed with peppers, onion, and kadai masala.', category: 'North Indian Main Course', price_paise: 38900, vegetarian: true, image_url: '', featured: false },
        { id: 21, name: 'Butter Chicken', description: 'Tender chicken in a velvety tomato gravy with butter and cream.', category: 'North Indian Main Course', price_paise: 45900, vegetarian: false, image_url: '', featured: true },
        { id: 22, name: 'Chicken Curry', description: 'A deeply spiced home-style curry with onion, tomato, and herbs.', category: 'North Indian Main Course', price_paise: 43900, vegetarian: false, image_url: '', featured: false },
        { id: 23, name: 'Veg Kolhapuri', description: 'Vegetables simmered in a fiery Kolhapuri masala.', category: 'North Indian Main Course', price_paise: 37900, vegetarian: true, image_url: '', featured: false },
        { id: 24, name: 'Rajma Masala', description: 'Slow-cooked kidney beans in a warm tomato-onion masala.', category: 'North Indian Main Course', price_paise: 33900, vegetarian: true, image_url: '', featured: false },
        { id: 25, name: 'Masala Dosa', description: 'Crisp rice crepe with spiced potato, sambar and chutney.', category: 'South Indian Specialties', price_paise: 24900, vegetarian: true, image_url: '', featured: true },
        { id: 26, name: 'Rava Idli', description: 'Steamed semolina idlis with coconut chutney and sambar.', category: 'South Indian Specialties', price_paise: 21900, vegetarian: true, image_url: '', featured: false },
        { id: 27, name: 'Mini Tiffin', description: 'A mix of idli, dosa, vada, and chutneys for a complete bite.', category: 'South Indian Specialties', price_paise: 28900, vegetarian: true, image_url: '', featured: false },
        { id: 28, name: 'Appam Curry', description: 'Lace-thin appams served with a fragrant coconut curry.', category: 'South Indian Specialties', price_paise: 31900, vegetarian: true, image_url: '', featured: false },
        { id: 29, name: 'Kerala Fish Moilee', description: 'Grilled fish in a coconut, curry-leaf, and ginger broth.', category: 'South Indian Specialties', price_paise: 48900, vegetarian: false, image_url: '', featured: false },
        { id: 30, name: 'Ghee Roast', description: 'Crisp dosa roasted in ghee and served with chutney.', category: 'South Indian Specialties', price_paise: 26900, vegetarian: true, image_url: '', featured: false },
        { id: 31, name: 'Mysore Masala Dosa', description: 'Dosa layered with fiery Mysore chutney and potato masala.', category: 'South Indian Specialties', price_paise: 27900, vegetarian: true, image_url: '', featured: false },
        { id: 32, name: 'Vegetable Uttapam', description: 'Savoury pancake topped with tomato, onion, and curry leaves.', category: 'South Indian Specialties', price_paise: 23900, vegetarian: true, image_url: '', featured: false },
        { id: 33, name: 'Hyderabadi Dum Biryani', description: 'Layered basmati rice, aromatic spices, and slow-cooked flavour.', category: 'Biryani and Rice', price_paise: 42900, vegetarian: false, image_url: '', featured: true },
        { id: 34, name: 'Veg Dum Biryani', description: 'Saffron rice layered with vegetables and fragrant biryani masala.', category: 'Biryani and Rice', price_paise: 38900, vegetarian: true, image_url: '', featured: true },
        { id: 35, name: 'Chicken Dum Biryani', description: 'Tender chicken and basmati rice finished with caramelised onions.', category: 'Biryani and Rice', price_paise: 46900, vegetarian: false, image_url: '', featured: true },
        { id: 36, name: 'Mutton Biryani', description: 'Slow-braised mutton and rice with mint, saffron, and warm spice.', category: 'Biryani and Rice', price_paise: 51900, vegetarian: false, image_url: '', featured: false },
        { id: 37, name: 'Jeera Rice', description: 'Fragrant basmati rice tempered with cumin and ghee.', category: 'Biryani and Rice', price_paise: 17900, vegetarian: true, image_url: '', featured: false },
        { id: 38, name: 'Steamed Rice', description: 'Classic steamed rice to balance rich curries and grills.', category: 'Biryani and Rice', price_paise: 14900, vegetarian: true, image_url: '', featured: false },
        { id: 39, name: 'Kashmiri Pulao', description: 'A gentle rice dish with dry fruits and saffron notes.', category: 'Biryani and Rice', price_paise: 24900, vegetarian: true, image_url: '', featured: false },
        { id: 40, name: 'Paneer Biryani', description: 'Paneer and rice cooked in a rich biryani masala.', category: 'Biryani and Rice', price_paise: 40900, vegetarian: true, image_url: '', featured: false },
        { id: 41, name: 'Butter Naan', description: 'Soft tandoor-baked flatbread finished with butter.', category: 'Indian Breads', price_paise: 7900, vegetarian: true, image_url: '', featured: false },
        { id: 42, name: 'Garlic Naan', description: 'Butter naan brushed with roasted garlic and herbs.', category: 'Indian Breads', price_paise: 9900, vegetarian: true, image_url: '', featured: false },
        { id: 43, name: 'Cheese Naan', description: 'Stuffed naan with melted cheese and chilli flakes.', category: 'Indian Breads', price_paise: 11900, vegetarian: true, image_url: '', featured: false },
        { id: 44, name: 'Plain Roti', description: 'Fresh wheat roti, warm and soft with every bite.', category: 'Indian Breads', price_paise: 6900, vegetarian: true, image_url: '', featured: false },
        { id: 45, name: 'Laccha Paratha', description: 'Flaky layered paratha with a golden, buttery finish.', category: 'Indian Breads', price_paise: 10900, vegetarian: true, image_url: '', featured: false },
        { id: 46, name: 'Missi Roti', description: 'Spiced gram flour flatbread with herbal notes.', category: 'Indian Breads', price_paise: 9900, vegetarian: true, image_url: '', featured: false },
        { id: 47, name: 'Gulab Jamun', description: 'Warm milk dumplings soaked in cardamom-scented syrup.', category: 'Desserts', price_paise: 14900, vegetarian: true, image_url: '', featured: false },
        { id: 48, name: 'Kulfi Falooda', description: 'Traditional kulfi with rose syrup, basil seeds, and noodles.', category: 'Desserts', price_paise: 16900, vegetarian: true, image_url: '', featured: false },
        { id: 49, name: 'Mango Pudding', description: 'Silky mango pudding with a hint of cardamom and cream.', category: 'Desserts', price_paise: 15900, vegetarian: true, image_url: '', featured: false },
        { id: 50, name: 'Rasmalai', description: 'Soft cottage cheese discs in saffron-infused milk.', category: 'Desserts', price_paise: 17900, vegetarian: true, image_url: '', featured: false },
        { id: 51, name: 'Brownie Sundae', description: 'Warm brownie with vanilla ice cream and toffee drizzle.', category: 'Desserts', price_paise: 18900, vegetarian: true, image_url: '', featured: false },
        { id: 52, name: 'Chocolate Lava Cake', description: 'Molten centre cake crowned with cocoa dust and cream.', category: 'Desserts', price_paise: 20900, vegetarian: true, image_url: '', featured: false },
        { id: 53, name: 'Masala Chai', description: 'Freshly brewed tea with warming Indian spices.', category: 'Beverages', price_paise: 9900, vegetarian: true, image_url: '', featured: false },
        { id: 54, name: 'Fresh Lime Soda', description: 'A cooling blend of lime, soda, and a hint of mint.', category: 'Beverages', price_paise: 11900, vegetarian: true, image_url: '', featured: false },
        { id: 55, name: 'Mango Lassi', description: 'Creamy yogurt drink with ripe mango and a pinch of cardamom.', category: 'Beverages', price_paise: 14900, vegetarian: true, image_url: '', featured: false },
        { id: 56, name: 'Cold Coffee', description: 'Iced coffee with a smooth finish and a whisper of vanilla.', category: 'Beverages', price_paise: 13900, vegetarian: true, image_url: '', featured: false },
        { id: 57, name: 'Midnight Platter', description: 'Chef’s mixed platter of our most loved starters and bites.', category: "Chef's Special", price_paise: 59900, vegetarian: true, image_url: '', featured: true },
        { id: 58, name: 'Signature Thali', description: 'A complete thali with curry, bread, rice, sides, and dessert.', category: "Chef's Special", price_paise: 56900, vegetarian: true, image_url: '', featured: true },
        { id: 59, name: 'Royal Feast', description: 'An indulgent spread for sharing with grilled mains and breads.', category: "Chef's Special", price_paise: 74900, vegetarian: false, image_url: '', featured: false },
        { id: 60, name: 'Fire & Spice Bowl', description: 'A bold bowl of house favourites with heat, richness, and soul.', category: "Chef's Special", price_paise: 62900, vegetarian: false, image_url: '', featured: false }
    ];

    let currentItems = fallbackItems;

    function make(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function dishImage(item) {
        const configured = window.MidnightImages || {};
        return item.image_url || configured.dish || configured.restaurant || 'assets/images/L1.jpg';
    }

    function populateCategories(items) {
        const select = form.elements.category;
        if (!select) return;
        const categories = [...new Set(items.map((item) => item.category))].sort();
        select.innerHTML = '<option value="">All categories</option>' + categories.map((category) => `<option value="${category}">${category}</option>`).join('');
        const requestedCategory = new URLSearchParams(location.search).get('category');
        if (requestedCategory && categories.includes(requestedCategory)) {
            select.value = requestedCategory;
        }
    }

    function render() {
        const values = new FormData(form);
        const query = String(values.get('search') || '').trim().toLowerCase();
        const category = String(values.get('category') || '');
        const diet = String(values.get('diet') || '');
        const sort = String(values.get('sort') || 'featured');

        let visible = currentItems.filter((item) =>
            (!query || `${item.name} ${item.description}`.toLowerCase().includes(query)) &&
            (!category || item.category === category) &&
            (!diet || (diet === 'vegetarian' ? item.vegetarian : !item.vegetarian))
        );

        if (sort === 'price-low') visible = visible.slice().sort((a, b) => a.price_paise - b.price_paise);
        if (sort === 'price-high') visible = visible.slice().sort((a, b) => b.price_paise - a.price_paise);
        if (sort === 'name') visible = visible.slice().sort((a, b) => a.name.localeCompare(b.name));
        if (sort === 'featured') visible = visible.slice().sort((a, b) => Number(b.featured) - Number(a.featured));

        list.replaceChildren();
        if (!visible.length) {
            const empty = make('li');
            const box = make('div', 'content-panel');
            box.innerHTML = '<h3>No dishes match your filters</h3><p>Try a different keyword, category, or diet setting.</p>';
            empty.append(box);
            list.append(empty);
            status.textContent = 'No dishes match your filters.';
            return;
        }

        for (const item of visible) {
            const li = make('li');
            const card = make('article', 'menu-card');
            const figure = make('figure', 'menu-card__image');
            const image = make('img');
            image.src = dishImage(item);
            image.alt = `${item.name}, a ${item.vegetarian ? 'vegetarian' : 'non-vegetarian'} menu dish`;
            image.loading = 'lazy';
            figure.append(image);

            const body = make('div', 'menu-card__body');
            body.append(make('p', 'eyebrow', `${item.category} · ${item.vegetarian ? 'Vegetarian' : 'Non-vegetarian'}`));
            body.append(make('h3', '', item.name), make('p', '', item.description));

            const footer = make('div', 'menu-card__footer');
            footer.append(make('strong', '', window.Midnight ? window.Midnight.formatPrice(item.price_paise) : `₹${(item.price_paise / 100).toFixed(2)}`));
            const button = make('button', 'button button--primary', 'Add to Cart');
            button.type = 'button';
            button.addEventListener('click', () => {
                try {
                    if (!window.Midnight || typeof window.Midnight.addToCart !== 'function') throw new Error('Cart is unavailable right now.');
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

        status.textContent = `${visible.length} menu item${visible.length === 1 ? '' : 's'} shown.`;
    }

    form.addEventListener('input', render);
    form.addEventListener('change', render);

    populateCategories(currentItems);
    render();

    if (window.Midnight && typeof window.Midnight.api === 'function') {
        window.Midnight.api('/api/menu')
            .then((data) => {
                const apiItems = Array.isArray(data && data.items) ? data.items : [];
                currentItems = apiItems.length >= 12 ? apiItems : fallbackItems;
                populateCategories(currentItems);
                render();
            })
            .catch(() => {
                currentItems = fallbackItems;
                populateCategories(currentItems);
                render();
            });
    }
})();
