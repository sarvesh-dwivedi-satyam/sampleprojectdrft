window.MidnightImages = Object.freeze({
  restaurant: 'assets/images/L1.jpg',
  hero: 'assets/images/L1.jpg',
  category: 'assets/images/L1.jpg',
  dish: 'assets/images/L1.jpg',
  dessert: 'assets/images/L1.jpg',
  interior: 'assets/images/L1.jpg',
  about: 'assets/images/L1.jpg',
  chef: 'assets/images/L1.jpg',
  gallery: 'assets/images/L1.jpg',
  experience: 'assets/images/L1.jpg'
});

document.querySelectorAll('[data-site-image]').forEach((image) => {
  const imagePath = window.MidnightImages[image.dataset.siteImage];
  if (!imagePath) {
    console.error(`No image is configured for "${image.dataset.siteImage}".`);
    return;
  }
  image.src = imagePath;
});
