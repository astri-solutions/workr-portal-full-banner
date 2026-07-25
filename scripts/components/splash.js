// scripts/components/splash.js
// Renders the CMS-configured splash modal (siteConfig.splash) on every load
// of the home page — not once per session, and not on internal pages, per
// how a splash/announcement modal is meant to be used (a notice shown right
// when someone lands on the site).

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

  const size = SIZE_PX[cfg.size] ?? SIZE_PX.md;
  const overlay = document.createElement('div');
  overlay.className = 'splash-modal-overlay';
  overlay.innerHTML = `
    <div class="splash-modal" style="max-width:${size}px" role="dialog" aria-modal="true">
      ${cfg.imageUrl ? `<img class="splash-modal__img" src="${cfg.imageUrl}" alt="" />` : ''}
      <div class="splash-modal__body">
        ${cfg.titulo ? `<h2 class="splash-modal__title">${cfg.titulo}</h2>` : ''}
        ${cfg.texto ? `<p class="splash-modal__lead">${cfg.texto}</p>` : ''}
        ${cfg.conteudo ? `<p class="splash-modal__content">${cfg.conteudo}</p>` : ''}
        ${cfg.legenda ? `<p class="splash-modal__legenda">${cfg.legenda}</p>` : ''}
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
