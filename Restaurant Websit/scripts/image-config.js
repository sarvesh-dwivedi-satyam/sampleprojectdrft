window.MidnightImages = Object.freeze({
  restaurant: 'assets/images/Home.jpg',
  hero: 'assets/images/Home.jpg',
  category: null,
  dish: null,
  dessert: null,
  dishFallback: null,
  paneerTikka: 'assets/images/starters/paneer-tikka.jpg',
  malaiPaneerTikka: 'assets/images/starters/malai-paneer-tikka.jpg',
  butterChicken: 'assets/images/non-vegetarian/butter-chicken.jpg',
  interior: 'assets/images/Home.jpg',
  about: 'assets/images/Home.jpg',
  chef: null,
  gallery: 'assets/images/Home.jpg',
  experience: 'assets/images/Home.jpg'
});

window.MidnightImageDetails = Object.freeze({
  paneerTikka: Object.freeze({
    width: 1280,
    height: 854,
    creator: 'Charles Haynes',
    license: 'CC BY-SA 2.0',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Paneer_Tikka.jpg'
  }),
  malaiPaneerTikka: Object.freeze({
    width: 843,
    height: 1124,
    creator: 'PallaviKhale',
    license: 'CC BY-SA 4.0',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Malai_Paneer_Tikka,_PK_007.jpg'
  }),
  butterChicken: Object.freeze({
    width: 1280,
    height: 960,
    creator: 'Vis M',
    license: 'CC BY-SA 4.0',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Butter_Chicken,_City_Grill_Kottayam.jpg'
  })
});

document.querySelectorAll('[data-site-image]').forEach((image) => {
  const imagePath = window.MidnightImages[image.dataset.siteImage];
  if (!imagePath) {
    const placeholder = document.createElement('span');
    placeholder.className = 'image-placeholder';
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', 'Dish photography is unavailable; no matching image has been supplied.');
    placeholder.textContent = 'Dish photography coming soon';
    image.replaceWith(placeholder);
    return;
  }
  image.src = imagePath;
});
