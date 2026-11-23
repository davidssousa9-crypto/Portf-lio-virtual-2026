(function () {
    'use strict';

    const items = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window && items.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        items.forEach((el, i) => {
            el.style.transitionDelay = `${(i % 5) * 90}ms`;
            observer.observe(el);
        });
    } else {
        items.forEach((el) => el.classList.add('revealed'));
    }

    const bar = document.getElementById('fc-progress');
    if (bar) {
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
        };
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }
})();
