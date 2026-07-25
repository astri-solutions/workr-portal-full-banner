// scripts/components/cookies.js
// Renders the CMS-configured cookie-consent banner (siteConfig.cookies).
// Consent choice persists in localStorage so it's remembered across visits.
import { getLang } from '../lib/i18n.js';

const STORAGE_KEY = 'workr_cookie_consent';

// Each site language has its own independent text bundle (cfg.content),
// falling back to the primary language and then to the legacy flat fields
// (title/description/... directly on cfg) for banners saved before per-locale
// content existed.
function textsOf(cfg, lang, primaryLang) {
  const bundle = cfg.content?.[lang] ?? cfg.content?.[primaryLang];
  return {
    title: bundle?.title ?? cfg.title ?? '',
    description: bundle?.description ?? cfg.description ?? '',
    linkText: bundle?.linkText ?? cfg.linkText ?? '',
    acceptLabel: bundle?.acceptLabel ?? cfg.acceptLabel ?? 'Aceitar todos',
    rejectLabel: bundle?.rejectLabel ?? cfg.rejectLabel ?? 'Rejeitar',
    customizeLabel: bundle?.customizeLabel ?? cfg.customizeLabel ?? 'Personalizar',
  };
}

function buildExtraButtons(buttons, lang, primaryLang) {
  if (!Array.isArray(buttons) || buttons.length === 0) return '';
  return buttons.map(b => {
    const label = b.labels?.[lang] ?? b.labels?.[primaryLang] ?? b.label ?? '';
    return `<a class="cookie-banner__extra-btn cookie-banner__extra-btn--${b.variant ?? 'primary'}" href="${b.url ?? '#'}">${label}</a>`;
  }).join('');
}

export function initCookies(siteConfig) {
  const cfg = siteConfig?.cookies;
  if (!cfg?.enabled) return;
  if (localStorage.getItem(STORAGE_KEY)) return;

  const lang = getLang(siteConfig);
  const primaryLang = siteConfig?.languages?.[0] ?? 'pt-BR';
  const texts = textsOf(cfg, lang, primaryLang);

  const banner = document.createElement('div');
  banner.className = `cookie-banner cookie-banner--${cfg.layout ?? 'full'} cookie-banner--${cfg.theme ?? 'light'}`;
  banner.innerHTML = `
    <div class="cookie-banner__text">
      ${texts.title ? `<strong class="cookie-banner__title">${texts.title}</strong>` : ''}
      <p class="cookie-banner__desc">${texts.description}
        ${texts.linkText && cfg.linkUrl ? ` <a class="cookie-banner__link" href="${cfg.linkUrl}">${texts.linkText}</a>` : ''}
      </p>
    </div>
    <div class="cookie-banner__actions">
      ${buildExtraButtons(cfg.buttons, lang, primaryLang)}
      ${cfg.showCustomize ? `<button type="button" class="cookie-banner__btn cookie-banner__btn--ghost" data-cookie-customize>${texts.customizeLabel}</button>` : ''}
      ${cfg.showReject ? `<button type="button" class="cookie-banner__btn cookie-banner__btn--ghost" data-cookie-reject>${texts.rejectLabel}</button>` : ''}
      <button type="button" class="cookie-banner__btn cookie-banner__btn--accept" data-cookie-accept>${texts.acceptLabel}</button>
    </div>`;

  function choose(value) {
    localStorage.setItem(STORAGE_KEY, value);
    banner.classList.remove('is-visible');
    setTimeout(() => banner.remove(), 250);
  }

  banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => choose('accepted'));
  banner.querySelector('[data-cookie-reject]')?.addEventListener('click', () => choose('rejected'));
  // "Personalizar" has no preference sub-screen configured yet — treat as accept-and-dismiss.
  banner.querySelector('[data-cookie-customize]')?.addEventListener('click', () => choose('customized'));

  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('is-visible'));
}
