// scripts/components/footer.js
import { getLang } from '../lib/i18n.js';

// Same per-locale/per-field fallback used by carousel.js/cookies.js — each
// site language has its own independent text, falling back to the primary
// language for anything left blank.
function textsOf(footer, lang, primaryLang) {
  const bundle = footer.content?.[lang] ?? footer.content?.[primaryLang] ?? {};
  return {
    address: bundle.address ?? '',
    phone: bundle.phone ?? '',
    hours: bundle.hours ?? '',
    copyright: bundle.copyright ?? '',
    disclaimer: bundle.disclaimer ?? '',
  };
}

function labelOf(item, lang, primaryLang) {
  return item.labels?.[lang] ?? item.labels?.[primaryLang] ?? item.label ?? '';
}

export function initFooter(config) {
  const el = document.getElementById('site-footer');
  if (!el) return;

  const { footer, company } = config;
  const lang = getLang(config);
  const primaryLang = config.languages?.[0] ?? 'pt-BR';
  const texts = textsOf(footer, lang, primaryLang);

  // Usa config.nav como fonte única da árvore de canais
  const navTree = config.nav || [];
  const columns = navTree.map(item => {
    const links = item.children && item.children.length
      ? item.children
      : [{ label: labelOf(item, lang, primaryLang), href: item.href }];
    return `
      <div class="site-footer__block">
        <h4>${labelOf(item, lang, primaryLang)}</h4>
        <ul>${links.map(l =>
          `<li><a href="${l.href}">${l.labels ? labelOf(l, lang, primaryLang) : l.label}</a></li>`).join('')}
        </ul>
      </div>`;
  }).join('');

  const legalLinks = (footer.legalLinks || []).map(l =>
    `<a href="${l.href}">${l.label}</a>`).join('');

  const socialLinks = [
    footer.social.linkedin  !== '#' ? `<a href="${footer.social.linkedin}"  aria-label="LinkedIn"  target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>` : '',
    footer.social.instagram !== '#' ? `<a href="${footer.social.instagram}" aria-label="Instagram" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></svg></a>` : '',
    footer.social.facebook  !== '#' ? `<a href="${footer.social.facebook}"  aria-label="Facebook"  target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>` : '',
  ].filter(Boolean).join('');

  const isSimple = footer.variant === 'simple';
  el.className = isSimple ? 'site-footer site-footer--simple' : 'site-footer';

  const fullSections = isSimple ? '' : `
      <div class="site-footer__top">
        <img src="${company.logoNegative}" alt="${company.name}" class="site-footer__logo" />
      </div>

      <div class="site-footer__nav-grid">
        ${columns}
      </div>

      <div class="site-footer__info-grid">
        <div class="site-footer__block">
          <h4>Endereço</h4>
          <p class="site-footer__address-text">${texts.address}</p>
        </div>
        <div class="site-footer__block">
          <h4>Entre em Contato</h4>
          <div class="site-footer__contact-details">
            <a href="mailto:${footer.email}">${footer.email}</a>
            <a href="tel:${texts.phone.replace(/\D/g,'')}">${texts.phone}</a>
            <p>${texts.hours}</p>
          </div>
        </div>
        <div class="site-footer__block">
          <h4>Redes Sociais</h4>
          <div class="site-footer__social-links">${socialLinks}</div>
        </div>
      </div>`;

  el.innerHTML = `
    <div class="site-footer__inner">
      ${fullSections}
      <div class="site-footer__bottom">
        <div class="site-footer__bottom-links">${legalLinks}</div>
        <span class="site-footer__copyright">${texts.copyright}</span>
        <a href="https://astri.solutions" class="site-footer__powered" target="_blank" rel="noopener">
          <span>Powered by</span>
          <img src="/assets/logotipo/logotipo-negative.svg" alt="Astri Solutions" />
        </a>
        <p class="site-footer__legal">${texts.disclaimer || ''}</p>
      </div>
    </div>`;
}
