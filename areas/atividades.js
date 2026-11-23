(function () {
    'use strict';

    const chosenActivities = new Set([
        'css copy.png',
        'revisakerc.png',
        'modernismo.png',
        'morteevida.png',
        '84.png',
        'neodarwinismo.png',
        'isomeria.png',
        'biotecnologia.png',
        'slide.png',
        'graphivods.png',
        'circuferencia.png',
        'matrizes.png',
        '3.png',
        'novaordemmund.png',
        'bioetica.png',
        'impactosdaredesocial.png',
        'ética profissional david.png',
        'java.png',
        'progamação2horassousa.png',
        'CRIADOR.png'
    ]);

    document.querySelectorAll('.activity-item').forEach((item) => {
        const image = item.querySelector('img');
        if (!image) return;

        const sourceName = decodeURI(image.getAttribute('src') || '').split('/').pop();
        if (!chosenActivities.has(sourceName)) return;

        item.classList.add('activity-item--chosen');

        const banner = document.createElement('div');
        banner.className = 'chosen-banner';
        banner.innerHTML = '<span aria-hidden="true">★</span><strong>Atividade escolhida</strong><span aria-hidden="true">★</span>';
        item.prepend(banner);

        image.classList.add('chosen-photo');
        image.tabIndex = 0;
        image.setAttribute('role', 'button');
        image.setAttribute('aria-label', `Ampliar atividade escolhida: ${image.alt}`);

        const openChosen = () => openActivityLightbox(image);
        image.addEventListener('click', openChosen);
        image.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openChosen();
            }
        });
    });

    function openActivityLightbox(image) {
        let dialog = document.querySelector('.activity-lightbox');
        if (!dialog) {
            dialog = document.createElement('dialog');
            dialog.className = 'activity-lightbox';
            dialog.innerHTML = `
                <div class="activity-lightbox__bar">
                    <strong>Atividade escolhida</strong>
                    <button type="button" aria-label="Fechar imagem ampliada">Fechar ×</button>
                </div>
                <div class="activity-lightbox__body">
                    <img alt="">
                </div>
            `;
            document.body.append(dialog);
            dialog.querySelector('button').addEventListener('click', () => dialog.close());
            dialog.addEventListener('click', (event) => {
                if (event.target === dialog) dialog.close();
            });
        }

        const fullImage = dialog.querySelector('img');
        fullImage.src = image.currentSrc || image.src;
        fullImage.alt = image.alt;
        dialog.showModal();
    }

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
