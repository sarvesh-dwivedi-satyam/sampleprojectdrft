(() => {
    const categories = Object.freeze({
        starters: 'Starters & Small Plates',
        soups: 'Soups',
        'main-course': 'Main Course',
        vegetarian: 'Main Course — Vegetarian',
        'non-vegetarian': 'Main Course — Non-Vegetarian',
        'rice-biryani': 'Rice & Biryani',
        breads: 'Breads',
        desserts: 'Desserts',
        beverages: 'Beverages',
        'chinese-starters': 'Chinese Starters',
        tandoori: 'Tandoori Specials',
        'chinese-main': 'Chinese Main Course',
        noodles: 'Noodles',
        pasta: 'Pasta',
        pizza: 'Pizza',
        burgers: 'Burgers',
        sandwiches: 'Sandwiches',
        wraps: 'Wraps',
        salads: 'Salads',
        snacks: 'Snacks',
        'street-food': 'Street Food',
        'south-indian': 'South Indian',
        breakfast: 'Breakfast',
        thalis: 'Thalis'
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

    const expansion = [
        ['starters', 'Indian Starters', 'Indian starters', 'vegetarian', 'Aloo Tikki|Beetroot Cutlet|Corn Cheese Balls|Crispy Lotus Stem|Dahi Puri Shots|Hing Aloo|Kurkuri Bhindi|Masala Papad|Paneer Amritsari|Paneer Pakora|Peanut Masala|Stuffed Aloo|Vegetable Chop|Vegetable Cutlet|Vegetable Pakora|Palak Patta Chaat|Chilli Cheese Toast|Tandoori Gobi|Soya Chaap Tikka|Stuffed Mushroom'],
        ['starters', 'Indian Starters', 'Indian starters', 'non-vegetarian', 'Chicken 65|Chicken Lollipop|Chicken Pakora|Chicken Wings|Fish Amritsari|Fish Finger|Prawn Koliwada|Prawn Pepper Fry|Lamb Galouti Kebab|Mutton Boti Kebab|Mutton Shami Kebab|Keema Samosa|Chicken Samosa|Andhra Chilli Chicken|Crab Claws Fry|Tandoori Pomfret|Fish Amritsari Fry|Lamb Chops|Murgh Malai Seekh|Mutton Cutlet'],
        ['chinese-starters', 'Chinese Starters', 'Chinese starters', 'vegetarian', 'Vegetable Manchurian Dry|Chilli Paneer Dry|Crispy Chilli Potato|Honey Chilli Potato|Spring Rolls|Vegetable Momos|Schezwan Paneer|Crispy Baby Corn|Salt and Pepper Tofu|Chilli Mushroom|Dragon Paneer|Crispy Lotus Root|Corn Salt and Pepper|Vegetable Wontons|Cabbage Manchurian|Crispy Okra|Chilli Garlic Potato|Sesame Tofu Bites|Gobi Manchurian Dry|Shanghai Vegetable Rolls'],
        ['chinese-starters', 'Chinese Starters', 'Chinese starters', 'non-vegetarian', 'Chicken Manchurian Dry|Chilli Chicken Dry|Chicken Spring Rolls|Chicken Momos|Prawn Tempura|Crispy Fish Chilli|Chicken Wontons|Schezwan Chicken Dry|Salt and Pepper Prawns|Dragon Chicken|Honey Chilli Chicken|Chicken Satay|Crispy Calamari|Prawn Toast|Chicken Lollypop Schezwan|Crispy Fish Fingers Chinese|Chicken Bao|Prawn Crackers|Chicken Pepper Dry|Sichuan Chicken Bites'],
        ['tandoori', 'Tandoori Specials', 'Tandoor and grill', 'vegetarian', 'Tandoori Aloo|Achari Paneer Tikka|Pahadi Paneer Tikka|Angara Paneer Tikka|Afghani Paneer Tikka|Tandoori Broccoli|Tandoori Cauliflower|Soya Chaap Malai|Soya Chaap Achari|Mushroom Hariyali Tikka|Stuffed Tandoori Aloo|Tandoori Pineapple|Tandoori Baby Corn|Tandoori Soya Tikka|Paneer Haryali Tikka|Paneer Shashlik|Tandoori Vegetable Platter|Tandoori Sweet Potato|Tandoori Bharwan Gobi|Tandoori Cheese Kebab'],
        ['tandoori', 'Tandoori Specials', 'Tandoor and grill', 'non-vegetarian', 'Tandoori Chicken|Afghani Chicken|Chicken Reshmi Kebab|Chicken Hariyali Tikka|Chicken Pahadi Tikka|Chicken Tangdi Kebab|Chicken Banjara Kebab|Chicken Kalmi Kebab|Chicken Angara Tikka|Tandoori Fish Tikka|Ajwaini Fish Tikka|Tandoori Prawns|Tandoori Trout|Mutton Seekh Kebab|Pathar Ka Gosht|Mutton Kakori Kebab|Tandoori Lamb Chops|Tandoori Duck|Chicken Achari Tikka|Tandoori Chicken Wings'],
        ['main-course', 'Main Course', 'North Indian vegetarian', 'vegetarian', 'Chole Masala|Rajma Masala|Aloo Gobi|Baingan Bharta|Bhindi Masala|Dum Aloo Kashmiri|Navratan Korma|Vegetable Jalfrezi|Paneer Do Pyaza|Paneer Pasanda|Paneer Lababdar|Paneer Methi Malai|Methi Malai Matar|Matar Paneer|Kashmiri Dum Aloo|Punjabi Chole|Amritsari Chole|Bharwan Baingan|Lauki Kofta Curry|Soya Chaap Masala'],
        ['main-course', 'Main Course', 'North Indian non-vegetarian', 'non-vegetarian', 'Chicken Do Pyaza|Chicken Saagwala|Chicken Korma|Chicken Chettinad|Chicken Dhansak|Chicken Madras|Chicken Vindaloo|Chicken Jalfrezi|Chicken Rezala|Chicken Bhuna|Chicken Mughlai|Chicken Kolhapuri|Chicken Cafreal|Mutton Saagwala|Mutton Korma|Mutton Bhuna Gosht|Mutton Do Pyaza|Mutton Keema|Mutton Dhansak|Mutton Vindaloo'],
        ['chinese-main', 'Chinese Main Course', 'Chinese mains', 'vegetarian', 'Vegetable Manchurian Gravy|Chilli Paneer Gravy|Tofu in Black Bean Sauce|Vegetable Hot Garlic Sauce|Schezwan Vegetables|Mapo Tofu Vegetarian|Stir-Fried Bok Choy|Chilli Garlic Vegetables|Crispy Vegetable in Honey Sauce|Mixed Vegetables in Garlic Sauce|Tofu Kung Pao|Vegetable in Hunan Sauce|Cottage Cheese in Black Pepper Sauce|Baby Corn Mushroom in Oyster-Style Sauce|Szechuan Eggplant|Vegetable Chop Suey|Vegetable in Chilli Basil Sauce|Tofu in Szechuan Sauce|Crispy Spinach in Garlic Sauce|Vegetable in Sweet and Sour Sauce'],
        ['chinese-main', 'Chinese Main Course', 'Chinese mains', 'non-vegetarian', 'Chicken Manchurian Gravy|Chilli Chicken Gravy|Chicken in Black Bean Sauce|Chicken Hot Garlic Sauce|Schezwan Chicken Gravy|Kung Pao Chicken|Chicken in Hunan Sauce|Chicken with Cashew Nuts|Chicken in Oyster Sauce|Chicken Chop Suey|Fish in Chilli Basil Sauce|Fish in Black Bean Sauce|Prawn Manchurian Gravy|Prawn Hot Garlic Sauce|Schezwan Prawns|Kung Pao Prawns|Crispy Fish in Sweet and Sour Sauce|Chicken in Sweet and Sour Sauce|Lemon Chicken Chinese|Sichuan Fish Fillet'],
        ['breads', 'Breads', 'Indian breads', 'vegetarian', 'Roomali Roti|Missi Roti|Bajra Roti|Jowar Roti|Makki di Roti|Amritsari Kulcha|Paneer Kulcha|Onion Kulcha|Aloo Kulcha|Cheese Naan|Peshawari Naan|Keema Naan|Kashmiri Naan|Chilli Garlic Naan|Cheese Garlic Naan|Methi Paratha|Aloo Paratha|Gobi Paratha|Paneer Paratha|Pudina Paratha'],
        ['rice-biryani', 'Rice & Biryani', 'Rice preparations', 'vegetarian', 'Lemon Rice|Coconut Rice|Tamarind Rice|Curd Rice|Tomato Rice|Bisi Bele Bath|Sambar Rice|Peas Pulao|Kashmiri Pulao|Vegetable Fried Rice|Schezwan Fried Rice|Mushroom Fried Rice|Corn Fried Rice|Burnt Garlic Fried Rice|Thai Basil Fried Rice|Coconut Milk Rice|Ghee Rice|Palak Rice|Mint Rice|Tawa Pulao'],
        ['rice-biryani', 'Rice & Biryani', 'Biryani', 'vegetarian', 'Hyderabadi Vegetable Biryani|Lucknowi Vegetable Biryani|Kolkata Vegetable Biryani|Mushroom Biryani|Soya Chaap Biryani|Kathal Biryani|Dum Aloo Biryani|Corn Biryani|Jackfruit Biryani|Vegetable Handi Biryani|Paneer Tikka Biryani|Malabar Vegetable Biryani|Chettinad Vegetable Biryani|Sindhi Vegetable Biryani|Ambur Vegetable Biryani|Dindigul Vegetable Biryani|Thalassery Vegetable Biryani|Mughlai Vegetable Biryani|Afghani Vegetable Biryani|Kashmiri Vegetable Biryani'],
        ['rice-biryani', 'Rice & Biryani', 'Biryani', 'non-vegetarian', 'Hyderabadi Chicken Biryani|Lucknowi Chicken Biryani|Kolkata Chicken Biryani|Malabar Chicken Biryani|Chettinad Chicken Biryani|Sindhi Chicken Biryani|Ambur Chicken Biryani|Dindigul Chicken Biryani|Thalassery Chicken Biryani|Mughlai Chicken Biryani|Prawn Biryani|Fish Biryani|Kolkata Mutton Biryani|Hyderabadi Mutton Dum Biryani|Keema Biryani|Chicken Tikka Biryani|Egg and Chicken Biryani|Boneless Chicken Biryani|Andhra Chicken Biryani|Memoni Mutton Biryani'],
        ['noodles', 'Noodles', 'Noodles', 'vegetarian', 'Vegetable Hakka Noodles|Chilli Garlic Noodles|Schezwan Vegetable Noodles|Singapore Vegetable Noodles|Shanghai Vegetable Noodles|Pad Thai Vegetable Noodles|Vegetable Chow Mein|Burnt Garlic Vegetable Noodles|Vegetable Pan-Fried Noodles|Cantonese Vegetable Noodles|Thai Basil Vegetable Noodles|Vegetable Udon Noodles|Vegetable Soba Noodles|Vegetable Yakisoba|Vegetable Ramen|Tofu Ramen|Vegetable Drunken Noodles|Vegetable Pad See Ew|Vegetable Glass Noodles|Crispy Vegetable Noodles'],
        ['noodles', 'Noodles', 'Noodles', 'non-vegetarian', 'Chicken Hakka Noodles|Chilli Garlic Chicken Noodles|Schezwan Chicken Noodles|Singapore Chicken Noodles|Chicken Chow Mein|Burnt Garlic Chicken Noodles|Chicken Pan-Fried Noodles|Chicken Udon Noodles|Chicken Soba Noodles|Chicken Yakisoba|Chicken Ramen|Chicken Drunken Noodles|Chicken Pad See Ew|Prawn Hakka Noodles|Prawn Singapore Noodles|Seafood Chow Mein|Chicken Pad Thai|Beef Chow Mein|Pork Yakisoba|Chicken Glass Noodles'],
        ['pasta', 'Pasta', 'Pasta', 'vegetarian', 'Penne Arrabbiata|Penne Alfredo|Fettuccine Alfredo|Spaghetti Aglio e Olio|Spaghetti Pomodoro|Pesto Penne|Mushroom Risotto Pasta|Lasagna Primavera|Spinach Ricotta Ravioli|Four Cheese Ravioli|Vegetable Lasagna|Macaroni Cheese|Penne Puttanesca|Mushroom Carbonara Vegetarian|Ratatouille Linguine|Cacio e Pepe|Pasta alla Norma|Gnocchi Pesto|Truffle Mushroom Tagliatelle|Baked Vegetable Ziti'],
        ['pasta', 'Pasta', 'Pasta', 'non-vegetarian', 'Chicken Alfredo Fettuccine|Chicken Arrabbiata Penne|Chicken Pesto Pasta|Chicken Carbonara|Chicken Lasagna|Chicken Parmesan Pasta|Chicken Tetrazzini|Shrimp Scampi Linguine|Prawn Alfredo Pasta|Seafood Marinara Spaghetti|Tuna Pasta Bake|Lobster Mac and Cheese|Beef Lasagna|Bolognese Spaghetti|Pork Sausage Rigatoni|Chicken Piccata Pasta|Turkey Pasta Bake|Crab Linguine|Chicken Cajun Pasta|Salmon Cream Pasta'],
        ['pizza', 'Pizza', 'Pizza', 'vegetarian', 'Margherita Pizza|Four Cheese Pizza|Farmhouse Pizza|Garden Veggie Pizza|Mushroom Truffle Pizza|Spinach Ricotta Pizza|Pesto Genovese Pizza|Roasted Pepper Pizza|Artichoke Olive Pizza|Corn and Jalapeno Pizza|Paneer Tikka Pizza|Tandoori Vegetable Pizza|Caprese Pizza|Funghi Pizza|Veggie Supreme Pizza|Caramelized Onion Pizza|Zucchini Pesto Pizza|Broccoli Cheddar Pizza|White Sauce Mushroom Pizza|Pineapple Jalapeno Pizza'],
        ['pizza', 'Pizza', 'Pizza', 'non-vegetarian', 'Chicken Tikka Pizza|BBQ Chicken Pizza|Pepperoni Pizza|Meat Lovers Pizza|Chicken Alfredo Pizza|Buffalo Chicken Pizza|Prawn Pizza|Seafood Pizza|Smoked Salmon Pizza|Ham and Pineapple Pizza|Chicken Sausage Pizza|Peri Peri Chicken Pizza|Bacon Mushroom Pizza|Anchovy Olive Pizza|Tandoori Chicken Pizza|Chicken Pesto Pizza|Spicy Lamb Pizza|Sausage Supreme Pizza|Chicken Fajita Pizza|Turkey Pepperoni Pizza'],
        ['burgers', 'Burgers', 'Burgers', 'vegetarian', 'Classic Veg Burger|Paneer Burger|Aloo Tikki Burger|Mushroom Swiss Veg Burger|Crispy Corn Burger|Falafel Burger|Black Bean Burger|Chickpea Burger|Quinoa Veg Burger|Soya Patty Burger|Veggie Bean Burger|Beetroot Burger|Sweet Potato Burger|Grilled Halloumi Burger|Crispy Tofu Burger|Portobello Burger|Spinach Corn Burger|Lentil Patty Burger|Cauliflower Burger|Jackfruit Burger'],
        ['burgers', 'Burgers', 'Burgers', 'non-vegetarian', 'Classic Chicken Burger|Crispy Chicken Burger|Grilled Chicken Burger|Chicken Zinger Burger|BBQ Chicken Burger|Peri Peri Chicken Burger|Chicken Steak Burger|Fish Fillet Burger|Crispy Fish Burger|Prawn Burger|Lamb Burger|Beef Cheeseburger|Bacon Cheeseburger|Turkey Burger|Pulled Pork Burger|Chicken Schnitzel Burger|Buffalo Chicken Burger|Double Beef Burger|Mutton Keema Burger|Chicken Teriyaki Burger'],
        ['sandwiches', 'Sandwiches', 'Sandwiches', 'vegetarian', 'Grilled Cheese Sandwich|Tomato Mozzarella Sandwich|Cucumber Cream Cheese Sandwich|Paneer Tikka Sandwich|Bombay Vegetable Sandwich|Avocado Toast Sandwich|Mushroom Melt Sandwich|Corn Cheese Sandwich|Falafel Pita Sandwich|Caprese Panini|Spinach Feta Sandwich|Hummus Vegetable Sandwich|Roasted Pepper Sandwich|Crispy Potato Sandwich|Pesto Vegetable Panini|Eggless Club Sandwich|Cottage Cheese Sandwich|Brie Apple Sandwich|Peanut Butter Banana Sandwich|Grilled Vegetable Ciabatta'],
        ['sandwiches', 'Sandwiches', 'Sandwiches', 'non-vegetarian', 'Chicken Club Sandwich|Grilled Chicken Sandwich|Chicken Caesar Sandwich|Chicken Mayo Sandwich|Chicken Tikka Sandwich|Chicken Schnitzel Sandwich|Tuna Melt Sandwich|Tuna Salad Sandwich|Egg Salad Sandwich|Bacon Lettuce Tomato Sandwich|Roast Beef Sandwich|Turkey Club Sandwich|Ham and Cheese Sandwich|Smoked Salmon Sandwich|Pulled Pork Sandwich|Philly Cheesesteak Sandwich|Prawn Salad Sandwich|Chicken Pesto Panini|Chicken Parmesan Sandwich|Chicken Shawarma Sandwich'],
        ['wraps', 'Wraps', 'Wraps', 'vegetarian', 'Paneer Kathi Roll|Aloo Tikki Wrap|Falafel Wrap|Grilled Vegetable Wrap|Hummus Veggie Wrap|Soya Chaap Roll|Chickpea Salad Wrap|Crispy Tofu Wrap|Mushroom Shawarma Wrap|Spinach Corn Wrap|Mexican Bean Burrito|Veggie Quesadilla Wrap|Sweet Potato Black Bean Wrap|Paneer Bhurji Roll|Cauliflower Tikka Wrap|Avocado Hummus Wrap|Cottage Cheese Frankie|Roasted Vegetable Lavash|Quinoa Garden Wrap|Crispy Eggplant Wrap'],
        ['wraps', 'Wraps', 'Wraps', 'non-vegetarian', 'Chicken Kathi Roll|Chicken Shawarma Wrap|Grilled Chicken Caesar Wrap|Chicken Tikka Frankie|Chicken Burrito|Chicken Quesadilla Wrap|BBQ Chicken Wrap|Peri Peri Chicken Wrap|Crispy Fish Wrap|Tuna Salad Wrap|Prawn Cocktail Wrap|Lamb Kofta Wrap|Beef Burrito|Turkey Club Wrap|Pulled Pork Wrap|Chicken Fajita Wrap|Chicken Seekh Roll|Egg Chicken Frankie|Fish Tikka Wrap|Chicken Satay Wrap'],
        ['salads', 'Salads', 'Salads', 'vegetarian', 'Greek Salad|Caesar Salad Vegetarian|Caprese Salad|Quinoa Tabbouleh|Garden Green Salad|Waldorf Salad|Cobb Salad Vegetarian|Roasted Beet Salad|Spinach Strawberry Salad|Kale Caesar Salad|Chickpea Feta Salad|Mediterranean Orzo Salad|Avocado Corn Salad|Panzanella Salad|Watermelon Feta Salad|Asian Sesame Tofu Salad|Lentil Power Salad|Roasted Pumpkin Salad|Couscous Herb Salad|Broccoli Almond Salad'],
        ['soups', 'Soups', 'Soups', 'vegetarian', 'French Onion Soup Vegetarian|Minestrone Soup|Tom Yum Vegetable Soup|Tom Kha Vegetable Soup|Clear Vegetable Soup|Spinach Soup|Pumpkin Soup|Lentil Soup|Pea Soup|Mulligatawny Vegetable Soup|Vegetable Consomme|Carrot Ginger Soup|Roasted Red Pepper Soup|Broccoli Cheddar Soup|Asparagus Soup|Cabbage Soup|Miso Soup|Vegetable Pho|Rasam Soup|Beetroot Soup'],
        ['soups', 'Soups', 'Soups', 'non-vegetarian', 'Chicken Clear Soup|Chicken Manchow Soup|Chicken Sweet Corn Soup|Chicken Hot and Sour Soup|Chicken Tom Yum Soup|Chicken Noodle Soup|Seafood Soup|Prawn Tom Yum Soup|Fish Head Soup|Clam Chowder|Chicken Mulligatawny Soup|Lamb Shorba|Mutton Pepper Soup|Crab Soup|Chicken Pho|Beef Pho|Prawn Laksa Soup|Seafood Chowder|Egg Drop Soup|Chicken Consomme'],
        ['snacks', 'Snacks', 'Snacks', 'vegetarian', 'Samosa|Kachori|Dhokla|Khandvi|Fafda|Thepla|Khakhra|Sabudana Vada|Batata Vada|Medu Vada|Onion Bhaji|Palak Pakoda|Savoury Oats Pancake|Bread Pakora|Methi Muthia|Aloo Bonda|Murukku|Masala Roasted Chickpeas|Bhel Puri Snack Mix|Roasted Makhana'],
        ['street-food', 'Street Food', 'Street food', 'vegetarian', 'Pani Puri|Sev Puri|Dahi Puri|Ragda Pattice|Pav Bhaji|Vada Pav|Misal Pav|Dabeli|Aloo Chaat|Papdi Chaat|Raj Kachori|Aloo Tikki Chaat|Chole Kulche|Delhi Chaat Papdi|Kathi Paneer Roll|Pyaaz Kachori|Poha Jalebi|Kanda Bhaji Pav|Ram Ladoo|Samosa Chaat'],
        ['south-indian', 'South Indian', 'South Indian', 'vegetarian', 'Plain Dosa|Masala Dosa|Mysore Masala Dosa|Rava Dosa|Set Dosa|Neer Dosa|Pesarattu|Onion Uttapam|Rava Idli|Kanchipuram Idli|Pongal|Ven Pongal|Appam with Vegetable Stew|Puttu Kadala Curry|Adai Avial|Onion Rava Dosa|Ghee Roast Dosa|Thatte Idli|Kuzhi Paniyaram|Uttapam'],
        ['breakfast', 'Breakfast', 'Breakfast', 'vegetarian', 'Idli Sambar Breakfast|Pesarattu Upma|Masala Oats|Vegetable Upma|Rava Upma|Poha|Sattu Paratha|Ragi Dosa Breakfast|Chole Bhature Breakfast|Puri Bhaji|Besan Chilla|Methi Cheela|Akki Roti Breakfast|Vegetable Dalia|Sabudana Khichdi|Corn Flakes Bowl|Granola Yogurt Bowl|Pancakes with Maple Syrup|French Toast Vegetarian|Waffles with Fruit'],
        ['breakfast', 'Breakfast', 'Breakfast', 'non-vegetarian', 'Masala Omelette|Plain Cheese Omelette|Egg Bhurji|Egg Kejriwal|Egg Benedict|Egg Florentine|Scrambled Eggs on Toast|Poached Eggs on Toast|Chicken Sausage Breakfast|Chicken Keema Paratha|Bacon and Eggs|Ham Omelette|Smoked Salmon Bagel|Tuna Breakfast Melt|Turkey Sausage Plate|Egg and Cheese Croissant|Shakshuka|Spanish Omelette|Breakfast Burrito with Egg|Chicken Club Breakfast Toast'],
        ['thalis', 'Thalis', 'Thalis', 'vegetarian', 'Gujarati Thali|Rajasthani Thali|Punjabi Vegetarian Thali|Maharashtrian Thali|South Indian Vegetarian Thali|Kerala Sadya Thali|Bengali Vegetarian Thali|Jain Thali|Kathiyawadi Thali|Marwari Thali|Udupi Thali|Konkani Vegetarian Thali|Assamese Vegetarian Thali|Kashmiri Pandit Thali|Himachali Dham Thali|Goan Vegetarian Thali|Andhra Vegetarian Thali|Madhya Pradesh Thali|North Indian Vegetarian Thali|Mini Vegetarian Thali'],
        ['thalis', 'Thalis', 'Thalis', 'non-vegetarian', 'Bengali Fish Thali|Goan Fish Thali|Kerala Fish Thali|Coastal Seafood Thali|Punjabi Chicken Thali|Maharashtrian Non-Veg Thali|Andhra Chicken Thali|Chettinad Chicken Thali|Kashmiri Wazwan Thali|Assamese Fish Thali|Mangalorean Chicken Thali|Malvani Seafood Thali|Hyderabadi Chicken Thali|Bihari Meat Thali|Nagaland Pork Thali|Rajasthani Laal Maas Thali|Chicken Curry Thali|Fish Curry Thali|Egg Curry Thali|Mini Non-Vegetarian Thali'],
        ['desserts', 'Desserts', 'Indian and global desserts', 'vegetarian', 'Jalebi|Imarti|Malpua|Gajar Ka Halwa|Moong Dal Halwa|Shahi Tukda|Phirni|Kheer|Kulfi Falooda|Mango Pudding|Rasgulla|Cham Cham|Sandesh|Mysore Pak|Kaju Katli|Besan Ladoo|Motichoor Ladoo|Peda|Coconut Barfi|Carrot Cake Slice'],
        ['desserts', 'Desserts', 'Cakes and pastries', 'vegetarian', 'Black Forest Cake Slice|Red Velvet Cake Slice|New York Cheesecake Slice|Lemon Drizzle Cake Slice|Chocolate Fudge Cake Slice|Tiramisu Slice|Opera Cake Slice|Pineapple Pastry|Chocolate Éclair|Vanilla Mille-Feuille|Blueberry Cheesecake Slice|Carrot Walnut Cake Slice|Banana Bread Slice|Chocolate Truffle Pastry|Strawberry Shortcake Slice|Apple Pie Slice|Lemon Tart|Chocolate Tart|Cinnamon Roll|Almond Croissant'],
        ['beverages', 'Beverages', 'Mocktails', 'vegetarian', 'Virgin Mojito|Cucumber Mint Cooler|Watermelon Basil Cooler|Blue Lagoon Mocktail|Sunset Citrus Fizz|Ginger Lemon Spritzer|Pomegranate Fizz|Virgin Mary|Passion Fruit Cooler|Mango Mint Cooler|Pineapple Ginger Fizz|Rose Lemonade|Lychee Cooler|Cranberry Spritzer|Green Apple Fizz|Peach Iced Tea Mocktail|Strawberry Basil Soda|Orange Mint Cooler|Classic Shirley Temple|Coconut Lime Cooler'],
        ['beverages', 'Beverages', 'Fresh juices and shakes', 'vegetarian', 'Fresh Orange Juice|Watermelon Juice|Pineapple Juice|Sweet Lime Juice|Carrot Juice|Apple Juice|Pomegranate Juice|Sugarcane Juice|Beetroot Juice|Mixed Fruit Juice|Banana Shake|Strawberry Shake|Oreo Shake|Vanilla Shake|Butterscotch Shake|Blueberry Shake|Avocado Shake|Dates Shake|Peanut Butter Shake|Cold Cocoa'],
        ['beverages', 'Beverages', 'Coffee and tea', 'vegetarian', 'Espresso|Americano|Cappuccino|Caffe Latte|Flat White|Mocha|Macchiato|Cortado|Filter Coffee|Turkish Coffee|Darjeeling Tea|Assam Tea|Earl Grey Tea|Jasmine Green Tea|Chamomile Tea|Peppermint Tea|Ginger Lemon Tea|Kashmiri Kahwa|Masala Milk|Hot Chocolate']
    ];

    const legacy = dishes.map(([name, priceRupees, categoryKey, vegetarian, description, keywords], index) => {
        const group = categoryKey === 'vegetarian' || categoryKey === 'non-vegetarian'
            ? 'main-course'
            : categoryKey;
        const category = categories[categoryKey];
        return {
            id: `mb-${String(index + 1).padStart(4, '0')}`,
            name,
            category,
            group,
            subcategory: categoryKey === 'vegetarian' ? 'Vegetarian mains' : categoryKey === 'non-vegetarian' ? 'Non-vegetarian mains' : category,
            priceRupees,
            foodType: vegetarian ? 'vegetarian' : 'non-vegetarian',
            vegan: null,
            ingredients: null,
            description,
            keywords,
            imageKey: name === 'Paneer Tikka' ? 'paneerTikka' : name === 'Malai Paneer Tikka' ? 'malaiPaneerTikka' : name === 'Butter Chicken' ? 'butterChicken' : null,
            imageStatus: ['Paneer Tikka', 'Malai Paneer Tikka', 'Butter Chicken'].includes(name) ? 'verified' : 'NEEDS_VERIFICATION',
            availability: 'requires-confirmation',
            bestseller: null,
            featured: [1, 8, 16, 20, 26, 40, 50, 57].includes(index + 1)
        };
    });

    let nextId = legacy.length + 1;
    const generated = expansion.flatMap(([group, category, subcategory, foodType, names], groupIndex) =>
        names.split('|').map((name, itemIndex) => ({
            id: `mb-${String(nextId++).padStart(4, '0')}`,
            name,
            category,
            group,
            subcategory,
            priceRupees: 99 + ((groupIndex * 31 + itemIndex * 37) % 501),
            foodType,
            vegan: null,
            ingredients: null,
            description: null,
            keywords: `${name}, ${category}, ${subcategory}`,
            imageKey: null,
            imageStatus: 'NEEDS_VERIFICATION',
            availability: 'requires-confirmation',
            bestseller: null,
            featured: false
        }))
    );

    const catalog = [...legacy, ...generated];
    const ids = new Set();
    const names = new Set();
    for (const item of catalog) {
        const normalizedName = item.name.toLocaleLowerCase('en');
        if (ids.has(item.id)) throw new Error(`Duplicate menu ID: ${item.id}`);
        if (names.has(normalizedName)) throw new Error(`Duplicate menu name: ${item.name}`);
        if (!item.name.trim() || !categories[item.group] || !item.category || !item.subcategory ||
            !['vegetarian', 'non-vegetarian', 'unverified'].includes(item.foodType) ||
            !Number.isInteger(item.priceRupees) || item.priceRupees < 0 ||
            !item.keywords.trim() || !['NEEDS_VERIFICATION', 'verified'].includes(item.imageStatus) ||
            (item.imageStatus === 'NEEDS_VERIFICATION' && item.imageKey !== null) ||
            (item.imageStatus === 'verified' && typeof item.imageKey !== 'string') ||
            !['available', 'unavailable', 'requires-confirmation'].includes(item.availability)) {
            throw new Error(`Invalid menu record: ${item.name}`);
        }
        ids.add(item.id);
        names.add(normalizedName);
    }

    window.MidnightMenu = Object.freeze(catalog.map((item) => Object.freeze(item)));
    window.MidnightMenuCategories = categories;
})();
