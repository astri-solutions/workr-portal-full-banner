// scripts/carousel.js
import { siteConfig } from './site.config.js';
import { getLang } from './lib/i18n.js';

const SLIDES_DEFAULT = [
  {
    img:      '/assets/img/banners/banner-full.jpg',
    title:    'Relações com Investidores',
    subtitle: 'Transparência e acesso às informações financeiras da companhia.',
    cta:      { label: 'Central de Resultados', href: '/central-resultados.html' },
  },
];

const SLIDES_V2 = [
  {
    img:      '/assets/img/banners/banner-01.jpg',
    title:    'Relações com Investidores',
    subtitle: 'Transparência e acesso às informações financeiras da companhia.',
    cta:      { label: 'Central de Resultados', href: '/central-resultados.html' },
  },
  {
    img:      '/assets/img/banners/banner-02.jpg',
    title:    'Resultados Financeiros',
    subtitle: 'Acesse os relatórios trimestrais, apresentações e demonstrações financeiras.',
    cta:      { label: 'Ver Resultados', href: '/central-resultados.html' },
  },
  {
    img:      '/assets/img/banners/banner-03.jpg',
    title:    'Calendário de Eventos',
    subtitle: 'Fique por dentro dos próximos eventos e teleconferências de resultados.',
    cta:      { label: 'Ver Calendário', href: '/calendario-eventos.html' },
  },
];

let current = 0;
let autoplayTimer = null;
let SLIDES = [];

// Slides configured in Personalizar → Banner (CMS), translated to the
// current site language — falls back to the static placeholders above when
// the portal hasn't configured any banner slide yet.
function slidesFromConfig() {
  const raw = siteConfig.banner;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const lang = getLang(siteConfig);
  const primaryLang = siteConfig.languages?.[0] ?? 'pt-BR';
  const primaryHref = (siteConfig.nav ?? []).find(ch => ch.enabled !== false)?.href ?? '#';
  const slides = raw.map(s => {
    const content = s.content ?? {};
    // Fall back per FIELD to the primary locale, not per whole content
    // object — a slide translated only partially for this language (e.g.
    // título only) must still show the primary locale's subtítulo/CTA for
    // whatever was left blank, instead of an empty subtitle/button.
    const c = content[lang] ?? {};
    const primary = content[primaryLang] ?? {};
    return {
      img: s.imagem || SLIDES_DEFAULT[0].img,
      title: c.titulo || primary.titulo || '',
      subtitle: c.subtitulo || primary.subtitulo || '',
      cta: { label: c.cta || primary.cta || '', href: primaryHref },
    };
  }).filter(s => s.title || s.subtitle);
  return slides.length > 0 ? slides : null;
}

function renderCarousel() {
  const el = document.getElementById('home-carousel');
  if (!el) return;

  // Pick slide set based on data-slides attribute on the carousel element,
  // falling back to CMS-configured slides when available.
  const slideSet = el.dataset.slides;
  SLIDES = slidesFromConfig() ?? (slideSet === 'v2' ? SLIDES_V2 : SLIDES_DEFAULT);

  el.innerHTML = `
    <div class="carousel__track" id="carousel-track">
      ${SLIDES.map((s, i) => `
        <div class="carousel__slide${i === 0 ? ' is-active' : ''}" aria-hidden="${i !== 0}">
          <img class="carousel__bg" src="${s.img}" alt="" aria-hidden="true" />
          <div class="carousel__overlay" aria-hidden="true"></div>
          <div class="carousel__body">
            <h1 class="carousel__title">${s.title}</h1>
            <p class="carousel__subtitle">${s.subtitle}</p>
            ${s.cta.label ? `<a href="${s.cta.href}" class="carousel__cta">${s.cta.label}</a>` : ''}
          </div>
        </div>`).join('')}
    </div>
    ${SLIDES.length > 1 ? `
    <div class="carousel__controls" aria-label="Navegação do carrossel">
      <button class="carousel__btn carousel__btn--prev" id="carousel-prev" aria-label="Slide anterior">
        <img src="/assets/icons/chevron-left.svg" width="20" height="20" aria-hidden="true" alt="">
      </button>
      <div class="carousel__dots" role="tablist" aria-label="Slides">
        ${SLIDES.map((_, i) => `
          <button class="carousel__dot${i === 0 ? ' is-active' : ''}" role="tab" aria-selected="${i === 0}" aria-label="Slide ${i + 1}" data-index="${i}"></button>
        `).join('')}
      </div>
      <button class="carousel__btn carousel__btn--next" id="carousel-next" aria-label="Próximo slide">
        <img src="/assets/icons/chevron-right.svg" width="20" height="20" aria-hidden="true" alt="">
      </button>
    </div>` : ''}`;

  // A single slide has nothing to navigate to or cycle through — the
  // controls above aren't rendered at all in that case.
  if (SLIDES.length <= 1) return;

  el.querySelector('#carousel-prev').addEventListener('click', () => goTo(current - 1));
  el.querySelector('#carousel-next').addEventListener('click', () => goTo(current + 1));
  el.querySelectorAll('.carousel__dot').forEach(btn => {
    btn.addEventListener('click', () => goTo(parseInt(btn.dataset.index)));
  });

  startAutoplay();
}

function goTo(index) {
  const el = document.getElementById('home-carousel');
  if (!el) return;
  const slides = el.querySelectorAll('.carousel__slide');
  const dots   = el.querySelectorAll('.carousel__dot');

  slides[current].classList.remove('is-active');
  slides[current].setAttribute('aria-hidden', 'true');
  dots[current].classList.remove('is-active');
  dots[current].setAttribute('aria-selected', 'false');

  current = ((index % SLIDES.length) + SLIDES.length) % SLIDES.length;

  slides[current].classList.add('is-active');
  slides[current].setAttribute('aria-hidden', 'false');
  dots[current].classList.add('is-active');
  dots[current].setAttribute('aria-selected', 'true');

  restartAutoplay();
}

function startAutoplay() {
  autoplayTimer = setInterval(() => goTo(current + 1), 5000);
}

function restartAutoplay() {
  clearInterval(autoplayTimer);
  startAutoplay();
}

renderCarousel();
