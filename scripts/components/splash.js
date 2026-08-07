// scripts/components/splash.js
// Renders the CMS-configured splash modal (siteConfig.splash) on every load
// of the home page — not once per session, and not on internal pages, per
// how a splash/announcement modal is meant to be used (a notice shown right
// when someone lands on the site).

import { getLang } from '../lib/i18n.js';

const SIZE_PX = { sm: 360, md: 540, lg: 740 };

function buildButtons(buttons) {
  if (!Array.isArray(buttons) || buttons.length === 0) return '';
  return `<div class="splash-modal__btns">
    ${buttons.map(b => `<a class="splash-modal__btn splash-modal__btn--${b.variant ?? 'primary'}" href="${b.url ?? '#'}">${b.label ?? ''}</a>`).join('')}
  </div>`;
}

function isHomePage() {
  const path = location.pathname.replace(/\/index\.html$/, '/');
  return path === '/' || path === '';
}

export function initSplash(siteConfig) {
  const cfg = siteConfig?.splash;
  if (!cfg?.enabled) return;
  if (!isHomePage()) return;

  // Scheduling — a splash can be configured ahead of time (publishAt) and/or
  // set to come down on its own (unpublishAt), both compared as plain
  // yyyy-mm-dd strings so this never depends on timezone/time-of-day.
  const today = new Date().toISOString().slice(0, 10);
  if (cfg.publishAt && today < cfg.publishAt) return;
  if (cfg.unpublishAt && today > cfg.unpublishAt) return;

  const lang = getLang(siteConfig);
  const primaryLang = siteConfig?.languages?.[0] ?? 'pt-BR';
  // Content (titulo/texto/conteudo/legenda/imageUrl) is per-locale:
  // { [lang]: {...} }. Portals published before this existed still have
  // those fields flat on `cfg` until they republish — support both shapes
  // so an already-live splash doesn't just disappear.
  const texts = cfg.content
    ? (cfg.content[lang] ?? cfg.content[primaryLang] ?? Object.values(cfg.content)[0] ?? {})
    : cfg;

  const size = SIZE_PX[cfg.size] ?? SIZE_PX.md;
  const overlay = document.createElement('div');
  overlay.className = 'splash-modal-overlay';
  overlay.innerHTML = `
    <div class="splash-modal" style="max-width:${size}px" role="dialog" aria-modal="true">
      ${texts.imageUrl ? `<img class="splash-modal__img" src="${texts.imageUrl}" alt="" />` : ''}
      <div class="splash-modal__body">
        ${texts.titulo ? `<h2 class="splash-modal__title">${texts.titulo}</h2>` : ''}
        ${texts.texto ? `<p class="splash-modal__lead">${texts.texto}</p>` : ''}
        ${texts.conteudo ? `<p class="splash-modal__content">${texts.conteudo}</p>` : ''}
        ${texts.legenda ? `<p class="splash-modal__legenda">${texts.legenda}</p>` : ''}
        ${buildButtons(cfg.buttons)}
      </div>
      <button type="button" class="splash-modal__close" aria-label="Fechar">&times;</button>
    </div>`;

  function dismiss() {
    overlay.classList.remove('is-visible');
    setTimeout(() => overlay.remove(), 250);
  }

  overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); });
  overlay.querySelector('.splash-modal__close')?.addEventListener('click', dismiss);

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));
}
