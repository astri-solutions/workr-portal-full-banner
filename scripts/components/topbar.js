// scripts/components/topbar.js
import { initTopbarBehavior } from '../topbar.js';
import { getLang } from '../lib/i18n.js';

const LANG_SHORT = { 'pt-BR': 'PT', 'pt': 'PT', 'en': 'EN', 'en-US': 'EN', 'es': 'ES', 'es-ES': 'ES' };
const LANG_LABEL = { 'pt-BR': 'Português', 'pt': 'Português', 'en': 'English', 'en-US': 'English', 'es': 'Español', 'es-ES': 'Español' };

function langShort(code) {
  return LANG_SHORT[code] ?? code.slice(0, 2).toUpperCase();
}

function langLabel(code) {
  return LANG_LABEL[code] ?? code;
}

// Small circular flag glyphs for the language dropdown — kept inline (no
// external image requests) and simplified enough to read clearly at 18px.
const FLAG_SVG = {
  'pt-BR': `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#009C3B"/><polygon points="10,3 17,10 10,17 3,10" fill="#FFDF00"/><circle cx="10" cy="10" r="4" fill="#002776"/></svg>`,
  'en': `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="c-en"><circle cx="10" cy="10" r="10"/></clipPath></defs><g clip-path="url(#c-en)"><rect width="20" height="20" fill="#B22234"/><g fill="#fff"><rect y="1.5" width="20" height="1.5"/><rect y="4.5" width="20" height="1.5"/><rect y="7.5" width="20" height="1.5"/><rect y="10.5" width="20" height="1.5"/><rect y="13.5" width="20" height="1.5"/><rect y="16.5" width="20" height="1.5"/></g><rect width="9" height="9.5" fill="#3C3B6E"/></g></svg>`,
  'es': `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="c-es"><circle cx="10" cy="10" r="10"/></clipPath></defs><g clip-path="url(#c-es)"><rect width="20" height="20" fill="#AA151B"/><rect y="5" width="20" height="10" fill="#F1BF00"/></g></svg>`,
};

function flagSvg(code) {
  const svg = FLAG_SVG[code];
  if (!svg) return `<span class="topbar__lang-flag-fallback">${langShort(code)}</span>`;
  return svg;
}

export function initTopbar(config) {
  const el = document.getElementById('site-topbar');
  if (!el) return;

  // Suporte ao novo formato ticker.type / ticker.items (retro-compatível com tickers[])
  const ticker = config.ticker ?? {};
  const tickerType = ticker.type ?? 'static';
  const tickerItems = ticker.items ?? config.tickers ?? [];

  const topbarCfg = config.topbar ?? {};
  const linkRi = topbarCfg.ri ?? { label: 'Relações com Investidores', url: '/' };
  const linkInstitucional = topbarCfg.institucional ?? { label: 'Institucional', url: '#' };
  const topbarShowTicker = topbarCfg.showTicker ?? true;

  let tickersHtml = '';
  const hasTickerContent = tickerType !== 'none' && (tickerType !== 'iframe' || !!ticker.iframeUrl) && tickerItems.length > 0 || (tickerType === 'iframe' && !!ticker.iframeUrl);
  const showTicker = topbarShowTicker && hasTickerContent;

  if (tickerType === 'iframe' && ticker.iframeUrl) {
    // Widget externo (ex.: Enfoque cotação)
    tickersHtml = `
      <div class="topbar__ticker-iframe-wrap" aria-label="Cotação">
        <iframe
          src="${ticker.iframeUrl}"
          class="topbar__ticker-iframe"
          title="Cotação"
          loading="lazy"
          frameborder="0"
          scrolling="no"
          tabindex="-1"
        ></iframe>
      </div>`;
  } else {
    // Ticker estático (valores de site.config.js)
    tickersHtml = tickerItems.map((t, i) => `
      <div class="topbar__ticker${i === 0 ? ' is-active' : ''}" data-topbar-ticker>
        <span class="topbar__ticker-symbol">${t.symbol}</span>
        <span class="topbar__ticker-dot" aria-hidden="true">·</span>
        <span class="topbar__ticker-price">${t.price}</span>
        <span class="topbar__ticker-change topbar__ticker-change--${t.direction}"
          aria-label="${t.direction === 'up' ? 'Alta' : 'Baixa'} de ${t.change}">
          <svg viewBox="0 0 10 10" width="8" height="8" fill="currentColor" aria-hidden="true">
            <path d="${t.direction === 'up' ? 'M5 2 9 8H1z' : 'M5 8 9 2H1z'}"/>
          </svg>
          ${t.change}
        </span>
      </div>`).join('');
  }

  // O seletor de idioma só existe quando o portal foi criado com mais de um
  // idioma — portais monolíngues (a maioria) não mostram PT/EN.
  const languages = config.languages ?? ['pt-BR'];
  const showLangSwitcher = languages.length > 1;
  const currentLang = getLang(config);
  document.documentElement.lang = currentLang;
  const langOptionsHtml = languages.map(code => `
    <button class="topbar__lang-option${code === currentLang ? ' is-active' : ''}" type="button"
      data-lang="${code}" role="menuitemradio" aria-checked="${code === currentLang ? 'true' : 'false'}">
      <span class="topbar__lang-flag">${flagSvg(code)}</span>
      <span class="topbar__lang-code">${langShort(code)}</span>
      <span class="topbar__lang-name">${langLabel(code)}</span>
    </button>`).join('');
  const langDropdownHtml = `
    <div class="topbar__lang" data-lang-dropdown>
      <button class="topbar__lang-trigger" type="button" data-lang-trigger
        aria-haspopup="true" aria-expanded="false" data-tooltip="${langLabel(currentLang)}">
        <span class="topbar__lang-flag">${flagSvg(currentLang)}</span>
        <span class="topbar__lang-code">${langShort(currentLang)}</span>
        <svg class="topbar__lang-chevron" viewBox="0 0 16 16" width="10" height="10" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="4 6 8 10 12 6"/>
        </svg>
      </button>
      <div class="topbar__lang-menu" data-lang-menu role="menu" aria-label="Selecionar idioma">
        ${langOptionsHtml}
      </div>
    </div>`;

  el.className = 'topbar';
  el.setAttribute('role', 'navigation');
  el.setAttribute('aria-label', 'Barra de utilitários');
  el.innerHTML = `
    <div class="topbar__inner">
      <div class="topbar__left">
        <a href="${linkRi.url}" class="topbar__link topbar__link--active">${linkRi.label}</a>
        <span class="topbar__sep" aria-hidden="true"></span>
        <a href="${linkInstitucional.url}" class="topbar__link">${linkInstitucional.label}</a>
      </div>
      ${showTicker ? `<div class="topbar__tickers" aria-label="Cotação" aria-live="polite">
        ${tickersHtml}
      </div>` : ''}
      <div class="topbar__right">
        <div class="topbar__a11y" role="group" aria-label="Acessibilidade">
          <span class="topbar__a11y-label">Acessibilidade</span>
          <button class="topbar__a11y-btn" type="button" data-a11y="contrast"
            aria-label="Alternar alto contraste" data-tooltip="Alto contraste">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
              <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>
            </svg>
          </button>
          <button class="topbar__a11y-btn topbar__a11y-btn--font-up" type="button"
            data-a11y="font-up" aria-label="Aumentar fonte" data-tooltip="Aumentar texto">A<sup>+</sup></button>
          <button class="topbar__a11y-btn topbar__a11y-btn--font-down" type="button"
            data-a11y="font-down" aria-label="Reduzir fonte" data-tooltip="Reduzir texto">A<sup>-</sup></button>
        </div>
        ${showLangSwitcher ? `
        <div class="topbar__sep" aria-hidden="true"></div>
        ${langDropdownHtml}` : ''}
      </div>
    </div>`;

  initTopbarBehavior();
  if (showLangSwitcher) initLangDropdown(el);
}

// Trigger opens/closes the option list; clicking outside or picking a
// language (handled by the existing [data-lang] listener in topbar.js,
// which reloads the page) both need to close it.
function initLangDropdown(scope) {
  const dropdown = scope.querySelector('[data-lang-dropdown]');
  const trigger = scope.querySelector('[data-lang-trigger]');
  if (!dropdown || !trigger) return;

  function close() {
    dropdown.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }
  function toggle() {
    const open = dropdown.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', String(open));
  }

  trigger.addEventListener('click', e => { e.stopPropagation(); toggle(); });
  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target)) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}
