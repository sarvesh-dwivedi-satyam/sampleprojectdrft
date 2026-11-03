(() => {
    const plates = [...document.querySelectorAll('[data-food-plate] .food-plate__disc')];
    if (!plates.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let visible = false;
    let scheduled = false;
    const section = document.querySelector('.food-plates');
    const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) update();
    }, { rootMargin: '100px 0px' });
    observer.observe(section);

    function update() {
        if (!visible || scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            const progress = Math.max(-1, Math.min(1, (section.getBoundingClientRect().top - window.innerHeight * 0.5) / window.innerHeight));
            plates.forEach((plate, index) => {
                const direction = index % 2 ? -1 : 1;
                plate.style.transform = `translateY(${progress * direction * 18}px) rotate(${progress * direction * 7}deg)`;
            });
            scheduled = false;
        });
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
})();
