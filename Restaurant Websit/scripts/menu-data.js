(() => {
    const categories = Object.freeze({
        starters: 'Starters & Small Plates',
        soups: 'Soups',
        vegetarian: 'Main Course — Vegetarian',
        'non-vegetarian': 'Main Course — Non-Vegetarian',
        'rice-biryani': 'Rice & Biryani',
        breads: 'Breads',
        desserts: 'Desserts',
        beverages: 'Beverages'
    });

    const dishes = [
        ['Paneer Tikka', 249, 'starters', true, 'Char-grilled paneer with a fragrant house spice marinade.', 'paneer, grilled, tandoor'],
        ['Malai Paneer Tikka', 279, 'starters', true, 'Soft paneer in a delicately spiced cream marinade, charred in the tandoor.', 'paneer, creamy, grilled'],
        ['Hara Bhara Kebab', 219, 'starters', true, 'Spinach, peas, and potato shaped into tender herb-scented kebabs.', 'spinach, peas, kebab'],
        ['Crispy Corn', 199, 'starters', true, 'Golden corn tossed with a lively chilli and garlic seasoning.', 'corn, crispy, chilli'],
        ['Veg Seekh Kebab', 229, 'starters', true, 'Aromatic vegetables and herbs grilled on skewers.', 'vegetable, kebab, grilled'],
        ['Tandoori Mushroom', 249, 'starters', true, 'Mushrooms marinated with warming spices and roasted in the tandoor.', 'mushroom, tandoor, grilled'],
        ['Dahi Ke Kebab', 239, 'starters', true, 'Silky hung-curd kebabs with herbs and a crisp golden crust.', 'yogurt, curd, kebab'],
        ['Chicken Tikka', 299, 'starters', false, 'Yogurt-marinated chicken, charred with ginger and smoky spices.', 'chicken, grilled, tandoor'],
        ['Malai Chicken Tikka', 329, 'starters', false, 'Tender chicken in a mild, creamy marinade with a hint of cardamom.', 'chicken, creamy, grilled'],
        ['Chicken Seekh Kebab', 279, 'starters', false, 'Minced chicken with herbs and spice, shaped and grilled on skewers.', 'chicken, kebab, grilled'],
        ['Tomato Basil Soup', 149, 'soups', true, 'Slow-cooked tomato soup finished with fragrant basil.', 'tomato, basil, warm'],
        ['Sweet Corn Soup', 159, 'soups', true, 'A comforting bowl of sweet corn in a light, savoury broth.', 'corn, comfort, warm'],
        ['Hot & Sour Soup', 169, 'soups', true, 'A warming, tangy broth with vegetables and a gentle chilli finish.', 'spicy, tangy, vegetable'],
        ['Manchow Soup', 169, 'soups', true, 'A savoury Indo-Chinese soup with vegetables and garlic.', 'indo-chinese, garlic, spicy'],
        ['Cream of Mushroom Soup', 179, 'soups', true, 'A smooth mushroom soup with mellow herbs and a creamy finish.', 'mushroom, creamy, warm'],
        ['Paneer Butter Masala', 299, 'vegetarian', true, 'Soft paneer in a rich tomato-butter gravy with gentle spices.', 'paneer, curry, creamy'],
        ['Shahi Paneer', 319, 'vegetarian', true, 'Paneer in a royal cashew and cream sauce with saffron notes.', 'paneer, cashew, curry'],
        ['Kadai Paneer', 299, 'vegetarian', true, 'Paneer, peppers, and onion tossed in freshly ground kadai masala.', 'paneer, pepper, curry'],
        ['Palak Paneer', 279, 'vegetarian', true, 'Paneer folded into a gently spiced spinach gravy.', 'paneer, spinach, curry'],
        ['Dal Makhani', 249, 'vegetarian', true, 'Black lentils simmered slowly with butter and warming spices.', 'lentils, dal, creamy'],
        ['Dal Tadka', 199, 'vegetarian', true, 'Yellow lentils finished with a fragrant cumin and garlic tempering.', 'lentils, dal, garlic'],
        ['Mix Vegetable Curry', 229, 'vegetarian', true, 'Seasonal vegetables cooked in a balanced Indian masala.', 'vegetables, curry, mixed'],
        ['Veg Kofta Curry', 269, 'vegetarian', true, 'Vegetable dumplings served in a gently spiced curry sauce.', 'vegetable, dumpling, curry'],
        ['Mushroom Masala', 279, 'vegetarian', true, 'Mushrooms simmered in a rich onion-tomato masala.', 'mushroom, curry, masala'],
        ['Malai Kofta', 289, 'vegetarian', true, 'Soft vegetable kofta in a velvety, mildly spiced sauce.', 'vegetable, creamy, curry'],
        ['Butter Chicken', 349, 'non-vegetarian', false, 'Tender chicken in a velvety tomato gravy with butter and cream.', 'chicken, curry, creamy'],
        ['Chicken Curry', 299, 'non-vegetarian', false, 'A home-style chicken curry with onion, tomato, and warming spices.', 'chicken, curry, spicy'],
        ['Kadai Chicken', 329, 'non-vegetarian', false, 'Chicken cooked with peppers and freshly ground kadai masala.', 'chicken, pepper, curry'],
        ['Chicken Tikka Masala', 359, 'non-vegetarian', false, 'Char-grilled chicken in a rich tomato masala sauce.', 'chicken, grilled, curry'],
        ['Chicken Lababdar', 349, 'non-vegetarian', false, 'A generous chicken curry with tomato, cream, and aromatic spices.', 'chicken, creamy, curry'],
        ['Mutton Rogan Josh', 429, 'non-vegetarian', false, 'Slow-cooked mutton in a fragrant Kashmiri-style gravy.', 'mutton, lamb, curry'],
        ['Mutton Curry', 399, 'non-vegetarian', false, 'Tender mutton simmered with onion, tomato, and whole spices.', 'mutton, lamb, curry'],
        ['Fish Curry', 379, 'non-vegetarian', false, 'Fish gently cooked in a warmly spiced, aromatic curry.', 'fish, seafood, curry'],
        ['Chicken Handi', 369, 'non-vegetarian', false, 'Chicken slow-cooked in a traditional handi-style masala.', 'chicken, slow cooked, curry'],
        ['Egg Curry', 229, 'non-vegetarian', false, 'Boiled eggs served in a homestyle onion-tomato curry.', 'egg, curry, masala'],
        ['Steamed Rice', 129, 'rice-biryani', true, 'Fluffy steamed rice, a simple companion to rich curries.', 'rice, basmati, plain'],
        ['Jeera Rice', 149, 'rice-biryani', true, 'Fragrant basmati rice tempered with toasted cumin.', 'rice, cumin, basmati'],
        ['Veg Pulao', 179, 'rice-biryani', true, 'Basmati rice cooked with vegetables and whole spices.', 'rice, vegetable, pulao'],
        ['Veg Biryani', 229, 'rice-biryani', true, 'Aromatic basmati layered with vegetables and biryani spices.', 'rice, vegetable, biryani'],
        ['Paneer Biryani', 249, 'rice-biryani', true, 'Paneer and fragrant basmati layered with warming biryani masala.', 'rice, paneer, biryani'],
        ['Chicken Biryani', 299, 'rice-biryani', false, 'Tender chicken and basmati rice layered with aromatic spices.', 'rice, chicken, biryani'],
        ['Mutton Biryani', 369, 'rice-biryani', false, 'Slow-cooked mutton layered with basmati rice and whole spices.', 'rice, mutton, lamb, biryani'],
        ['Egg Biryani', 249, 'rice-biryani', false, 'Basmati rice and egg tossed with fragrant biryani masala.', 'rice, egg, biryani'],
        ['Butter Naan', 59, 'breads', true, 'Soft tandoor-baked naan brushed with butter.', 'bread, naan, tandoor'],
        ['Plain Naan', 49, 'breads', true, 'A soft, classic naan baked fresh in the tandoor.', 'bread, naan, tandoor'],
        ['Garlic Naan', 79, 'breads', true, 'Tandoor-baked naan finished with roasted garlic.', 'bread, naan, garlic'],
        ['Tandoori Roti', 25, 'breads', true, 'Whole-wheat roti baked in the tandoor.', 'bread, roti, whole wheat'],
        ['Butter Roti', 35, 'breads', true, 'Warm whole-wheat roti finished with butter.', 'bread, roti, whole wheat'],
        ['Lachha Paratha', 69, 'breads', true, 'Flaky, layered paratha with a delicate golden finish.', 'bread, paratha, flaky'],
        ['Gulab Jamun', 99, 'desserts', true, 'Soft milk dumplings in a cardamom-scented syrup.', 'sweet, milk, dessert'],
        ['Rasmalai', 129, 'desserts', true, 'Delicate cottage-cheese dumplings in saffron-infused milk.', 'sweet, milk, dessert'],
        ['Chocolate Brownie', 149, 'desserts', true, 'A rich chocolate brownie with a tender centre.', 'sweet, chocolate, dessert'],
        ['Vanilla Ice Cream', 89, 'desserts', true, 'Classic vanilla ice cream, smooth and delicately sweet.', 'sweet, frozen, dessert'],
        ['Chocolate Ice Cream', 99, 'desserts', true, 'Creamy chocolate ice cream with a deep cocoa finish.', 'sweet, chocolate, frozen'],
        ['Sizzling Brownie', 199, 'desserts', true, 'Warm chocolate brownie served on a sizzling platter.', 'sweet, chocolate, warm'],
        ['Fresh Lime Soda', 89, 'beverages', true, 'A refreshing blend of fresh lime and sparkling soda.', 'lime, refreshing, cold'],
        ['Cold Coffee', 129, 'beverages', true, 'Chilled coffee blended until smooth and lightly creamy.', 'coffee, cold, refreshing'],
        ['Masala Chai', 49, 'beverages', true, 'Freshly brewed tea steeped with warming Indian spices.', 'tea, chai, hot'],
        ['Mango Shake', 139, 'beverages', true, 'A creamy, chilled mango shake with ripe fruit flavour.', 'mango, milk, cold'],
        ['Chocolate Shake', 149, 'beverages', true, 'A rich, chilled chocolate shake finished with cocoa.', 'chocolate, milk, cold']
    ];

    const featuredIds = new Set([1, 8, 16, 20, 26, 40, 50, 57]);

    window.MidnightMenu = Object.freeze(dishes.map(([name, priceRupees, categoryKey, vegetarian, description, keywords], index) => {
        const category = categories[categoryKey];
        const group = categoryKey === 'vegetarian' || categoryKey === 'non-vegetarian'
            ? 'main-course'
            : categoryKey;
        return Object.freeze({
            id: index + 1,
            name,
            priceRupees,
            category,
            group,
            vegetarian,
            description,
            keywords,
            featured: featuredIds.has(index + 1)
        });
    }));

    window.MidnightMenuCategories = Object.freeze(categories);
})();
