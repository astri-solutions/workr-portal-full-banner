// scripts/components/header.js
import { initNav } from '../nav.js';
import { isAuthenticated, openModal, logout } from './auth.js';
import { getLang } from '../lib/i18n.js';

const LANG_SHORT = { 'pt-BR': 'PT', 'pt': 'PT', 'en': 'EN', 'en-US': 'EN', 'es': 'ES', 'es-ES': 'ES' };
const LANG_LABEL = { 'pt-BR': 'Português', 'pt': 'Português', 'en': 'English', 'en-US': 'English', 'es': 'Español', 'es-ES': 'Español' };
function langShort(code) { return LANG_SHORT[code] ?? code.slice(0, 2).toUpperCase(); }
function langLabel(code) { return LANG_LABEL[code] ?? code; }

function lockIconSVG(open) {
  return open
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
      </svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>`;
}

function lockBtnHTML(auth) {
  return `${lockIconSVG(auth)}<span class="site-header__lock-label">Área Restrita</span>`;
}

// Same slug derivation used by sidebar-nav.js / tab-menu.js — needed so the
// mobile drawer link for a channel matches the in-page panel it should
// activate, instead of navigating to that channel's old standalone page.
function channelSlug(ch) {
  return ch.id ?? ch.slug ?? ch.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Channel names are translatable (item.labels, keyed by locale) — falls
// back to the primary locale and then to the legacy flat `label` for nav
// items saved before per-locale channel names existed.
function labelOf(item, lang, primaryLang) {
  return item.labels?.[lang] ?? item.labels?.[primaryLang] ?? item.label ?? '';
}

function buildNavItem(item, restricted, isFlatLayout, lang, primaryLang) {
  if (!item.children || item.children.length === 0) {
    // Sidebar/tabmenu layouts render every channel inline on the home page
    // (sidebar-nav.js / tab-menu.js) — there's no real standalone page to
    // navigate to. Point the link at home+hash and let those scripts read
    // the hash to activate the right panel, instead of leaving to the old
    // per-channel .html page (a different layout's navigation model).
    const href = isFlatLayout ? `/#${channelSlug(item)}` : item.href;
    return `
      <li class="nav-list__item${restricted ? ' nav-list__item--restricted' : ''}">
        <a class="nav-list__trigger nav-list__trigger--link" href="${href}">
          ${labelOf(item, lang, primaryLang)}
        </a>
      </li>`;
  }
  const children = item.children.map(child =>
    `<li><a class="nav-dropdown__link" href="${child.href}">${labelOf(child, lang, primaryLang)}</a></li>`
  ).join('');
  return `
    <li class="nav-list__item nav-list__item--has-sub${restricted ? ' nav-list__item--restricted' : ''}">
      <button class="nav-list__trigger" type="button"
        aria-haspopup="true" aria-expanded="false" data-nav-trigger>
        ${labelOf(item, lang, primaryLang)}
        <img class="nav-list__chevron" src="/assets/icons/chevron-down.svg" width="16" height="16" aria-hidden="true" alt="">
      </button>
      <ul class="nav-dropdown">${children}</ul>
    </li>`;
}

function syncRestrictedItems() {
  const auth = isAuthenticated();
  document.querySelectorAll('.nav-list__item--restricted').forEach(el => {
    el.classList.toggle('is-visible', auth);
  });
}

function syncLockButton() {
  // Target only the desktop button
  const btn = document.querySelector('[data-lock-desktop]');
  if (!btn) return;

  const auth = isAuthenticated();
  btn.classList.toggle('is-authenticated', auth);
  btn.setAttribute('aria-label', auth ? 'Área Restrita — você está conectado' : 'Área Restrita — fazer login');
  btn.innerHTML = lockBtnHTML(auth);

  // Sync drawer button too
  const drawerBtn = document.querySelector('[data-lock-drawer]');
  if (drawerBtn) {
    drawerBtn.classList.toggle('is-authenticated', auth);
    drawerBtn.innerHTML = lockBtnHTML(auth);
  }

  // Remove old dropdown
  const existing = document.getElementById('auth-dropdown');
  if (existing) existing.remove();

  if (auth) {
    const email = sessionStorage.getItem('ri_auth_email') || '';
    btn.insertAdjacentHTML('afterend', `
      <div class="auth-dropdown" id="auth-dropdown">
        <div class="auth-dropdown__header">
          <span class="auth-dropdown__label">Conectado como</span>
          <span class="auth-dropdown__email">${email || 'Investidor'}</span>
        </div>
        <button class="auth-dropdown__btn auth-dropdown__btn--logout" type="button" data-auth-logout>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair da Área Restrita
        </button>
      </div>`);
    document.getElementById('auth-dropdown')
      .querySelector('[data-auth-logout]')
      .addEventListener('click', () => {
        logout();
        const d = document.getElementById('auth-dropdown');
        if (d) d.classList.remove('is-open');
      });
  }
}

export function initHeader(config) {
  const el = document.getElementById('site-header');
  if (!el) return;

  const publicItems     = config.nav || [];
  const restrictedItems = config.restrictedNav || [];
  // Not to be confused with `variant` below (visual navbar style) — this is
  // the actual layout model (sidebar/tabmenu render every channel inline on
  // the home page; banner navigates to real per-channel pages).
  const isFlatLayout = config.header?.variant === 'sidebar' || config.header?.variant === 'tabmenu';
  const lang = getLang(config);
  const primaryLang = config.languages?.[0] ?? 'pt-BR';

  const navItems = [
    ...publicItems.map(item => buildNavItem(item, false, isFlatLayout, lang, primaryLang)),
    ...restrictedItems.map(item => buildNavItem(item, true, isFlatLayout, lang, primaryLang)),
  ].join('');

  const hideNav = el.hasAttribute('data-hide-nav');
  const variant = el.dataset.navbarVariant || config.header?.variant || 'navbar-default';
  const isDark  = variant === 'navbar-dark';
  const isBlur  = variant === 'navbar-blur';
  const logoSrc = (isDark || isBlur) ? config.company.logoNegative : config.company.logoOriginal;
  const auth    = isAuthenticated();

  // Mesma regra do topbar: só mostra o seletor de idioma no drawer quando o
  // portal foi criado com mais de um idioma.
  const languages = config.languages ?? ['pt-BR'];
  const showLangSwitcher = languages.length > 1;
  const currentLang = getLang(config);
  const drawerLangHtml = languages.map(code => `
    <button class="topbar__lang-btn${code === currentLang ? ' is-active' : ''}" type="button"
      data-lang="${code}" aria-pressed="${code === currentLang ? 'true' : 'false'}" aria-label="${langLabel(code)}">${langShort(code)}</button>`)
    .join(`<span aria-hidden="true" style="opacity:0.3">|</span>`);

  el.className = `site-header site-header--${variant}`;
  el.innerHTML = `
    <div class="site-header__inner">
      <a href="/" class="site-header__brand" aria-label="${config.company.name}">
        <img src="${logoSrc}" alt="${config.company.name}" class="site-header__logo" />
      </a>
      <nav class="site-header__nav${hideNav ? ' site-header__nav--hidden' : ''}" id="site-nav" data-nav aria-label="Principal">
        <div class="site-header__drawer-top">
          <img src="${config.company.logoNegative}" alt="${config.company.name}" class="site-header__drawer-logo" />
          <button class="site-header__drawer-close" type="button" aria-label="Fechar menu" data-nav-close>
            <img src="/assets/icons/close.svg" width="24" height="24" aria-hidden="true" alt="">
          </button>
        </div>
        <div class="site-header__drawer-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" placeholder="Buscar..." aria-label="Buscar" data-search-input />
        </div>
        ${showLangSwitcher ? `<div class="site-header__drawer-lang" role="group" aria-label="Idioma">
          ${drawerLangHtml}
        </div>` : ''}
        <ul class="nav-list">${navItems}</ul>
        <div class="site-header__drawer-lock">
          <button class="site-header__lock site-header__lock--drawer${auth ? ' is-authenticated' : ''}"
            type="button" aria-label="Área Restrita" data-lock-drawer>
            ${lockBtnHTML(auth)}
          </button>
        </div>
      </nav>
      <div class="site-header__actions">
        ${hideNav ? '' : `
        <button class="site-header__search" type="button" aria-label="Buscar" data-search-toggle>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        <div class="site-header__lock-wrap" style="position:relative">
          <button class="site-header__lock${auth ? ' is-authenticated' : ''}" type="button"
            aria-label="Área Restrita — fazer login" data-lock-desktop>
            ${lockBtnHTML(auth)}
          </button>
        </div>`}
        <button class="site-header__hamburger" type="button" aria-label="Abrir menu"
          aria-expanded="false" aria-controls="site-nav" data-nav-hamburger>
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
    <div class="site-header__overlay" data-nav-overlay aria-hidden="true"></div>`;

  // The mobile drawer (nav) and its dimming overlay are position: fixed,
  // meant to cover the full viewport — but the navbar-blur header variant
  // puts backdrop-filter on this same <header>, which creates a new
  // containing block for any position: fixed descendant. Left inside, the
  // drawer and overlay were confined to the header's own (tiny) box instead
  // of the viewport, showing as a squashed strip with no dimmed background.
  // Moving them out to be direct children of <body> sidesteps that
  // entirely, regardless of any future filter/transform on the header.
  const navEl = el.querySelector('[data-nav]');
  const overlayEl = el.querySelector('[data-nav-overlay]');
  if (navEl) document.body.appendChild(navEl);
  if (overlayEl) document.body.appendChild(overlayEl);

  initNav();
  syncRestrictedItems();
  syncLockButton();

  // Desktop lock button
  el.querySelector('[data-lock-desktop]')?.addEventListener('click', () => {
    if (isAuthenticated()) {
      const dropdown = document.getElementById('auth-dropdown');
      if (dropdown) dropdown.classList.toggle('is-open');
    } else {
      openModal();
    }
  });

  // Drawer lock button
  el.querySelector('[data-lock-drawer]')?.addEventListener('click', () => {
    openModal();
  });

  // Close dropdown when clicking outside the lock-wrap
  document.addEventListener('click', e => {
    const dropdown = document.getElementById('auth-dropdown');
    if (!dropdown) return;
    const wrap = el.querySelector('.site-header__lock-wrap');
    if (wrap && !wrap.contains(e.target)) dropdown.classList.remove('is-open');
  });

  document.addEventListener('ri:auth-change', () => {
    syncRestrictedItems();
    syncLockButton();
  });

  const logoEl = el.querySelector('.site-header__logo');
  if (logoEl) {
    // Fallback to company name text if logo file is missing
    logoEl.addEventListener('error', () => {
      const brand = logoEl.closest('.site-header__brand');
      if (brand) {
        logoEl.remove();
        brand.textContent = config.company.name;
        brand.style.cssText = 'font-weight:600;font-size:1.1rem;';
      }
    });

    if (config.company.logoContrast) {
      const html = document.documentElement;
      const observer = new MutationObserver(() => {
        logoEl.src = html.dataset.contrast === 'on' ? config.company.logoContrast : logoSrc;
      });
      observer.observe(html, { attributes: true, attributeFilter: ['data-contrast'] });
    }
  }
}
