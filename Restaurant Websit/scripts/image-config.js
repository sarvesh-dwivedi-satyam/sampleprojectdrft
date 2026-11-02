window.MidnightImages = Object.freeze({
  restaurant: 'assets/images/Home.jpg',
  hero: 'assets/images/Home.jpg',
  category: null,
  dish: null,
  dessert: null,
  dishFallback: null,
  interior: 'assets/images/Home.jpg',
  about: 'assets/images/Home.jpg',
  chef: null,
  gallery: 'assets/images/Home.jpg',
  experience: 'assets/images/Home.jpg'
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
