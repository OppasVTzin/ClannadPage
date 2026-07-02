/**
 * ClannadPage - camada premium de interatividade.
 * Tudo aqui e aplicado por DOM/CSS injetado, preservando o HTML e o CSS base.
 */
(function () {
    'use strict';

    const CONFIG = {
        revealSelector: [
            '.reveal',
            '.hero-copy',
            '.hero-card',
            '.section-heading',
            '.about-card',
            '.episode-card',
            '.team-card',
            '.character-card',
            '.cta-panel'
        ].join(', '),
        magneticSelector: '.button, .nav a, .team-card, .episode-card, .character-card',
        tiltSelector: '.about-card, .episode-card, .team-card, .character-card, .cta-panel',
        interactiveSelector: 'a, button, .team-card, .episode-card, .about-card, .character-card',
        navLinksSelector: '.nav a[href^="#"]',
        sectionSelector: 'main section[id]',
        reducedMotionQuery: '(prefers-reduced-motion: reduce)'
    };

    const motionMedia = typeof window.matchMedia === 'function'
        ? window.matchMedia(CONFIG.reducedMotionQuery)
        : null;

    const state = {
        raf: 0,
        pointerX: window.innerWidth / 2,
        pointerY: window.innerHeight / 2,
        scrollY: window.scrollY,
        reducedMotion: motionMedia?.matches ?? false
    };

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const closestElement = (target, selector) => {
        if (!(target instanceof Element)) return null;
        return target.closest(selector);
    };

    const ready = (callback) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
            return;
        }

        callback();
    };

    injectInteractionStyles();

    ready(() => {
        setupReducedMotionWatcher();
        setupScrollReveal();
        setupSmoothAnchors();
        setupActiveNavigation();
        setupMagneticElements();
        setupTiltCards();
        setupClickFeedback();
        setupAmbientPointer();
        setupHeroParallax();
    });

    /**
     * Estilos minimos para estados animados e overlays.
     * Mantidos no JS para nao mexer nas regras macro do CSS existente.
     */
    function injectInteractionStyles() {
        if (document.querySelector('style[data-source="clannad-interactions"]')) return;

        const style = document.createElement('style');
        style.dataset.source = 'clannad-interactions';
        style.textContent = `
            :root {
                --js-ease-organic: cubic-bezier(0.22, 1, 0.36, 1);
                --js-ease-soft: cubic-bezier(0.16, 1, 0.3, 1);
            }

            body::before {
                transform: translate3d(var(--ambient-x, 0px), var(--ambient-y, 0px), 0);
                transition: opacity 0.3s ease;
                will-change: transform;
            }

            .reveal,
            .js-reveal {
                opacity: 0;
                transform: translate3d(var(--reveal-x, 0), var(--reveal-y, 26px), 0) scale(var(--reveal-scale, 0.985));
                filter: blur(8px);
                transition:
                    opacity 0.85s var(--js-ease-organic),
                    transform 0.85s var(--js-ease-organic),
                    filter 0.85s var(--js-ease-organic);
                transition-delay: var(--reveal-delay, 0ms);
                will-change: opacity, transform, filter;
            }

            .reveal[data-reveal="up"],
            .js-reveal[data-reveal="up"] {
                --reveal-x: 0;
                --reveal-y: 32px;
                --reveal-scale: 0.985;
            }

            .reveal[data-reveal="down"],
            .js-reveal[data-reveal="down"] {
                --reveal-x: 0;
                --reveal-y: -32px;
                --reveal-scale: 0.985;
            }

            .reveal[data-reveal="left"],
            .js-reveal[data-reveal="left"] {
                --reveal-x: -34px;
                --reveal-y: 0;
                --reveal-scale: 0.99;
            }

            .reveal[data-reveal="right"],
            .js-reveal[data-reveal="right"] {
                --reveal-x: 34px;
                --reveal-y: 0;
                --reveal-scale: 0.99;
            }

            .reveal[data-reveal="zoom"],
            .js-reveal[data-reveal="zoom"] {
                --reveal-x: 0;
                --reveal-y: 0;
                --reveal-scale: 0.92;
            }

            .reveal.is-visible,
            .js-reveal.is-visible {
                opacity: 1;
                transform: translate3d(0, 0, 0) scale(1);
                filter: blur(0);
            }

            .js-magnetic,
            .js-tilt {
                transform:
                    perspective(900px)
                    translate3d(var(--magnet-x, 0px), calc(var(--magnet-y, 0px) + var(--lift-y, 0px)), 0)
                    rotateX(var(--tilt-x, 0deg))
                    rotateY(var(--tilt-y, 0deg));
                transition:
                    transform 0.55s var(--js-ease-soft),
                    box-shadow 0.35s ease,
                    border-color 0.35s ease,
                    filter 0.35s ease;
                will-change: transform;
            }

            .js-magnetic.is-magnetic,
            .js-tilt.is-tilting {
                transform:
                    perspective(900px)
                    translate3d(var(--magnet-x, 0px), calc(var(--magnet-y, 0px) + var(--lift-y, 0px)), 0)
                    rotateX(var(--tilt-x, 0deg))
                    rotateY(var(--tilt-y, 0deg));
                transition-duration: 0.08s, 0.35s, 0.35s, 0.35s;
            }

            .button:hover,
            .button:focus-visible,
            .team-card.js-magnetic:hover,
            .character-card.js-magnetic:hover,
            .team-card.js-magnetic:focus-visible,
            .character-card.js-magnetic:focus-visible {
                --lift-y: -2px;
            }

            .episode-card.js-magnetic:hover,
            .episode-card.js-magnetic:focus-within,
            .episode-card.js-tilt:hover,
            .episode-card.js-tilt:focus-within {
                --lift-y: -4px;
            }

            .js-glow {
                position: relative;
                overflow: hidden;
                isolation: isolate;
            }

            .js-glow::after {
                content: '';
                position: absolute;
                inset: 0;
                z-index: 1;
                pointer-events: none;
                opacity: 0;
                background:
                    radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%),
                    rgba(242, 214, 162, 0.22), transparent 42%);
                transition: opacity 0.35s ease;
            }

            .js-glow:hover::after,
            .js-glow:focus-visible::after {
                opacity: 1;
            }

            .js-ripple {
                position: absolute;
                width: 12px;
                height: 12px;
                left: var(--ripple-x);
                top: var(--ripple-y);
                z-index: 2;
                pointer-events: none;
                border-radius: 999px;
                background:
                    radial-gradient(circle,
                    rgba(255, 248, 234, 0.72) 0%,
                    rgba(224, 192, 121, 0.38) 42%,
                    transparent 72%);
                transform: translate(-50%, -50%) scale(0);
                animation: js-ripple-bloom 680ms var(--js-ease-organic) forwards;
            }

            .js-spark {
                position: fixed;
                width: 6px;
                height: 6px;
                left: 0;
                top: 0;
                z-index: 1000;
                pointer-events: none;
                border-radius: 999px;
                background: rgba(242, 214, 162, 0.86);
                box-shadow: 0 0 18px rgba(213, 165, 73, 0.45);
                transform: translate3d(var(--spark-x), var(--spark-y), 0) scale(1);
                animation: js-spark-fly 620ms var(--js-ease-organic) forwards;
            }

            .nav a.is-active {
                color: #f2d6a2;
                text-shadow: 0 0 18px rgba(242, 214, 162, 0.28);
            }

            @keyframes js-ripple-bloom {
                to {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(20);
                }
            }

            @keyframes js-spark-fly {
                to {
                    opacity: 0;
                    transform:
                        translate3d(calc(var(--spark-x) + var(--spark-dx)), calc(var(--spark-y) + var(--spark-dy)), 0)
                        scale(0);
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .reveal,
                .js-reveal,
                .js-magnetic,
                .js-tilt {
                    opacity: 1;
                    filter: none;
                    transform: none;
                    transition: none;
                }

                .js-ripple,
                .js-spark {
                    display: none;
                }
            }
        `;

        if (document.head) {
            document.head.appendChild(style);
        } else {
            ready(() => document.head?.appendChild(style));
        }
    }

    function setupReducedMotionWatcher() {
        if (!motionMedia) return;

        const update = () => {
            state.reducedMotion = motionMedia.matches;
        };

        if (typeof motionMedia.addEventListener === 'function') {
            motionMedia.addEventListener('change', update);
        } else if (typeof motionMedia.addListener === 'function') {
            motionMedia.addListener(update);
        }
    }

    /**
     * Revelacoes progressivas com Intersection Observer.
     * Cada item ganha delay calculado para parecer coreografado, sem bloquear scroll.
     */
    function setupScrollReveal() {
        const elements = [...new Set(document.querySelectorAll(CONFIG.revealSelector))];

        elements.forEach((element, index) => {
            element.classList.add('js-reveal');

            if (!element.dataset.reveal) {
                element.dataset.reveal = 'up';
            }

            const requestedDelay = Number.parseInt(element.dataset.delay, 10);
            const cascadeDelay = Math.min(index * 45, 360);
            const delay = Number.isFinite(requestedDelay) ? requestedDelay : cascadeDelay;

            element.style.setProperty('--reveal-delay', `${Math.max(delay, 0)}ms`);
        });

        if (state.reducedMotion || !('IntersectionObserver' in window)) {
            elements.forEach((element) => element.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: '0px 0px -12% 0px',
            threshold: 0.16
        });

        elements.forEach((element) => observer.observe(element));
    }

    /**
     * Scroll suave para ancoras internas, preservando links externos.
     */
    function setupSmoothAnchors() {
        document.addEventListener('click', (event) => {
            const link = closestElement(event.target, 'a[href^="#"]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({
                behavior: state.reducedMotion ? 'auto' : 'smooth',
                block: 'start'
            });

            history.pushState(null, '', href);
        });
    }

    /**
     * Realce de navegacao conforme a secao entra no centro visual da pagina.
     */
    function setupActiveNavigation() {
        const links = [...document.querySelectorAll(CONFIG.navLinksSelector)];
        const sections = [...document.querySelectorAll(CONFIG.sectionSelector)];
        if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

        const byId = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const activeLink = byId.get(entry.target.id);
                if (!activeLink || !entry.isIntersecting) return;

                links.forEach((link) => link.classList.remove('is-active'));
                activeLink.classList.add('is-active');
            });
        }, {
            rootMargin: '-42% 0px -46% 0px',
            threshold: 0
        });

        sections.forEach((section) => observer.observe(section));
    }

    /**
     * Efeito magnetico: o elemento acompanha sutilmente o cursor.
     * Usa variaveis CSS para evitar reescrever transform completo a cada evento.
     */
    function setupMagneticElements() {
        const elements = [...document.querySelectorAll(CONFIG.magneticSelector)];
        if (!elements.length || state.reducedMotion) return;

        elements.forEach((element) => {
            element.classList.add('js-magnetic', 'js-glow');

            element.addEventListener('pointermove', (event) => {
                if (event.pointerType === 'touch') return;

                const rect = element.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const strength = element.classList.contains('button') ? 9 : 6;
                const moveX = ((x / rect.width) - 0.5) * strength;
                const moveY = ((y / rect.height) - 0.5) * strength;

                element.classList.add('is-magnetic');
                element.style.setProperty('--magnet-x', `${moveX.toFixed(2)}px`);
                element.style.setProperty('--magnet-y', `${moveY.toFixed(2)}px`);
                element.style.setProperty('--glow-x', `${((x / rect.width) * 100).toFixed(2)}%`);
                element.style.setProperty('--glow-y', `${((y / rect.height) * 100).toFixed(2)}%`);
            }, { passive: true });

            element.addEventListener('pointerleave', () => {
                element.classList.remove('is-magnetic');
                element.style.setProperty('--magnet-x', '0px');
                element.style.setProperty('--magnet-y', '0px');
            });
        });
    }

    /**
     * Tilt 3D muito leve nos cards para dar sensacao de profundidade premium.
     */
    function setupTiltCards() {
        const cards = [...document.querySelectorAll(CONFIG.tiltSelector)];
        if (!cards.length || state.reducedMotion) return;

        cards.forEach((card) => {
            card.classList.add('js-tilt', 'js-glow');

            card.addEventListener('pointermove', (event) => {
                if (event.pointerType === 'touch') return;

                const rect = card.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const rotateY = clamp(((x / rect.width) - 0.5) * 7, -4, 4);
                const rotateX = clamp(((0.5 - (y / rect.height)) * 7), -4, 4);

                card.classList.add('is-tilting');
                card.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
                card.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
                card.style.setProperty('--glow-x', `${((x / rect.width) * 100).toFixed(2)}%`);
                card.style.setProperty('--glow-y', `${((y / rect.height) * 100).toFixed(2)}%`);
            }, { passive: true });

            card.addEventListener('pointerleave', () => {
                card.classList.remove('is-tilting');
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
            });
        });
    }

    /**
     * Feedback imediato: ripple avancado dentro do alvo + particulas discretas no clique.
     */
    function setupClickFeedback() {
        document.addEventListener('pointerdown', (event) => {
            const target = closestElement(event.target, CONFIG.interactiveSelector);
            if (!target || event.button !== 0) return;

            createRipple(target, event);

            if (!state.reducedMotion && event.pointerType !== 'touch') {
                createSparks(event.clientX, event.clientY);
            }
        });
    }

    function createRipple(target, event) {
        if (state.reducedMotion) return;

        const computed = window.getComputedStyle(target);
        if (computed.position === 'static') {
            target.style.position = 'relative';
        }

        target.style.overflow = 'hidden';

        const rect = target.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'js-ripple';
        ripple.style.setProperty('--ripple-x', `${event.clientX - rect.left}px`);
        ripple.style.setProperty('--ripple-y', `${event.clientY - rect.top}px`);

        target.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }

    function createSparks(x, y) {
        const fragment = document.createDocumentFragment();
        const total = 7;

        for (let index = 0; index < total; index += 1) {
            const angle = (Math.PI * 2 * index) / total;
            const distance = 22 + Math.random() * 20;
            const spark = document.createElement('span');

            spark.className = 'js-spark';
            spark.style.setProperty('--spark-x', `${x}px`);
            spark.style.setProperty('--spark-y', `${y}px`);
            spark.style.setProperty('--spark-dx', `${Math.cos(angle) * distance}px`);
            spark.style.setProperty('--spark-dy', `${Math.sin(angle) * distance}px`);
            fragment.appendChild(spark);
            spark.addEventListener('animationend', () => spark.remove(), { once: true });
        }

        document.body.appendChild(fragment);
    }

    /**
     * Ponteiro ambiental: desloca o brilho de fundo e da resposta global ao cursor.
     * A escrita no DOM e agrupada em requestAnimationFrame para manter 60 FPS.
     */
    function setupAmbientPointer() {
        if (state.reducedMotion || !document.body) return;

        window.addEventListener('pointermove', (event) => {
            state.pointerX = event.clientX;
            state.pointerY = event.clientY;
            requestTick(updateAmbientFrame);
        }, { passive: true });
    }

    /**
     * Paralaxe suave no hero: logo/copy e card respiram em velocidades diferentes.
     */
    function setupHeroParallax() {
        const heroCopy = document.querySelector('.hero-copy');
        const heroCard = document.querySelector('.hero-card');
        if (state.reducedMotion || (!heroCopy && !heroCard)) return;

        window.addEventListener('scroll', () => {
            state.scrollY = window.scrollY;
            requestTick(() => updateAmbientFrame(heroCopy, heroCard));
        }, { passive: true });

        updateAmbientFrame(heroCopy, heroCard);
    }

    function requestTick(callback) {
        if (state.raf) return;

        state.raf = window.requestAnimationFrame(() => {
            state.raf = 0;
            callback();
        });
    }

    function updateAmbientFrame(heroCopy = null, heroCard = null) {
        if (state.reducedMotion) return;

        const viewportX = (state.pointerX / window.innerWidth) - 0.5;
        const viewportY = (state.pointerY / window.innerHeight) - 0.5;
        const ambientX = `${(viewportX * 12).toFixed(2)}px`;
        const ambientY = `${(viewportY * 12).toFixed(2)}px`;

        document.documentElement.style.setProperty('--ambient-x', ambientX);
        document.documentElement.style.setProperty('--ambient-y', ambientY);

        const scrollOffset = Math.min(state.scrollY, 420);

        if (heroCopy) {
            heroCopy.style.transform = `translate3d(${(-viewportX * 5).toFixed(2)}px, ${(scrollOffset * 0.025).toFixed(2)}px, 0)`;
        }

        if (heroCard) {
            heroCard.style.transform = `
                perspective(900px)
                translate3d(${(viewportX * 8).toFixed(2)}px, ${(viewportY * 8 + scrollOffset * 0.045).toFixed(2)}px, 0)
                rotateX(${(-viewportY * 2).toFixed(2)}deg)
                rotateY(${(viewportX * 2).toFixed(2)}deg)
            `;
        }
    }
}());
