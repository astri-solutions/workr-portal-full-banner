// scripts/carousel.js
import { siteConfig } from './site.config.js';
import { getLang } from './lib/i18n.js';

// Obviously-a-placeholder image (flat gray + picture glyph, no stock photo)
// — a brand-new portal that hasn't configured a banner yet must never show
// something that reads as real photography/copy, since none of it exists
// in the CMS and a client could easily mistake it for already-published
// content instead of a prompt to go fill it in.
const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="700" viewBox="0 0 1600 700">
    <rect width="1600" height="700" fill="#C7CDD3"/>
    <g fill="none" stroke="#9AA3AC" stroke-width="6">
      <rect x="620" y="260" width="360" height="220" rx="8"/>
      <circle cx="700" cy="330" r="24"/>
      <path d="M620 440 L740 350 L830 420 L900 360 L980 440" stroke-linejoin="round" stroke-linecap="round"/>
    </g>
  </svg>
`);

const PLACEHOLDER_SLIDE = {
  img:      PLACEHOLDER_IMG,
  title:    'Banner de exemplo',
  subtitle: 'Este conteúdo ainda não foi configurado — acesse Personalizar → Banner no painel para adicionar a imagem e o texto reais.',
  cta:      { label: '', href: '#' },
};

const SLIDES_DEFAULT = [PLACEHOLDER_SLIDE];

const SLIDES_V2 = [PLACEHOLDER_SLIDE];

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
  const primaryChannel = (siteConfig.nav ?? []).find(ch => ch.enabled !== false);
  const primaryHref = primaryChannel ? (primaryChannel.isExternalLink ? primaryChannel.externalUrl : primaryChannel.href) : '#';
  const slides = raw
    // A slide with only an uploaded image and no título/subtítulo is still
    // real, deliberately-added content — dropping it (as this used to do,
    // by checking the post-fallback `title`/`subtitle` instead of the raw
    // slide) silently turned a real 2-slide banner into 1, hiding the dots
    // entirely and making it look like the second slide was never saved.
    .filter(s => s.imagem || (s.content && Object.values(s.content).some(c => c?.titulo || c?.subtitulo)))
    .map(s => {
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
    });
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
