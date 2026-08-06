// scripts/components/footer.js
import { getLang, t } from '../lib/i18n.js';

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
      : [{ label: labelOf(item, lang, primaryLang), href: item.href, isExternalLink: item.isExternalLink, externalUrl: item.externalUrl }];
    return `
      <div class="site-footer__block">
        <h4>${labelOf(item, lang, primaryLang)}</h4>
        <ul>${links.map(l => {
          const href = l.isExternalLink ? l.externalUrl : l.href;
          const externalAttrs = l.isExternalLink ? ' target="_blank" rel="noopener noreferrer"' : '';
          return `<li><a href="${href}"${externalAttrs}>${l.labels ? labelOf(l, lang, primaryLang) : l.label}</a></li>`;
        }).join('')}
        </ul>
      </div>`;
  }).join('');

  // Same isExternalLink/externalUrl + labels-per-locale pattern the nav
  // columns above already use (labelOf/href-vs-externalUrl) — legalLinks
  // never had either: an external legal link always resolved to whatever
  // href publish-config baked in (no target="_blank"), and the label was a
  // single fixed string that never changed with the site language.
  const legalLinks = (footer.legalLinks || []).map(l => {
    const href = l.isExternalLink ? (l.externalUrl || '#') : l.href;
    const externalAttrs = l.isExternalLink ? ' target="_blank" rel="noopener noreferrer"' : '';
    const label = l.labels ? labelOf(l, lang, primaryLang) : l.label;
    return `<a href="${href}"${externalAttrs}>${label}</a>`;
  }).join('');

  // Same 5 platforms FooterPage.tsx offers admins — the fixed
  // {linkedin,instagram,facebook} object below (footer.social) only ever
  // carried 3 of them, silently dropping any X (Twitter)/YouTube URL an
  // admin filled in. footer.socials (an array, added alongside it) covers
  // all 5; fall back to the old object only for a still-cached
  // site.config.js published before footer.socials existed.
  const SOCIAL_ICONS = {
    'LinkedIn': '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
    'Instagram': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></svg>',
    'X (Twitter)': '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    'YouTube': '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#fff"/></svg>',
    'Facebook': '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
  };

  function buildSocialLinks() {
    if (Array.isArray(footer.socials) && footer.socials.length > 0) {
      return footer.socials
        .filter(s => s.url)
        .map(s => SOCIAL_ICONS[s.platform]
          ? `<a href="${s.url}" aria-label="${s.platform}" target="_blank" rel="noopener">${SOCIAL_ICONS[s.platform]}</a>`
          : '')
        .filter(Boolean).join('');
    }
    const legacy = footer.social || {};
    return [
      legacy.linkedin  && legacy.linkedin  !== '#' ? `<a href="${legacy.linkedin}"  aria-label="LinkedIn"  target="_blank" rel="noopener">${SOCIAL_ICONS['LinkedIn']}</a>` : '',
      legacy.instagram && legacy.instagram !== '#' ? `<a href="${legacy.instagram}" aria-label="Instagram" target="_blank" rel="noopener">${SOCIAL_ICONS['Instagram']}</a>` : '',
      legacy.facebook  && legacy.facebook  !== '#' ? `<a href="${legacy.facebook}"  aria-label="Facebook"  target="_blank" rel="noopener">${SOCIAL_ICONS['Facebook']}</a>` : '',
    ].filter(Boolean).join('');
  }

  const socialLinks = buildSocialLinks();

  // Três modelos, escolhidos em Personalização → Rodapé:
  //   completo → logo + mapa do site + endereço/contato/sociais
  //   compacto → igual, sem o mapa do site
  //   reduzido → só a barra inferior (links legais, copyright, selo)
  // `variant` continua sendo lido como fallback para configs antigas, que
  // só tinham 'simple' | outro.
  // Sidebar/tabmenu nunca deveriam ter chegado aqui com 'completo'/'compacto'
  // — o rodapé cheio (logo, mapa do site, endereço/contato, redes sociais)
  // só faz sentido no layout Banner — mas publish-config só passou a impor
  // isso no site.config.js gerado depois desta correção; um portal
  // publicado antes disso pode ainda ter um `footer.model` desatualizado
  // salvo. Forçar aqui também garante que o site nunca mostre o rodapé
  // errado enquanto esse portal não republica.
  const isFlatLayout = config.header?.variant === 'sidebar' || config.header?.variant === 'tabmenu';
  const model = isFlatLayout ? 'reduzido' : (footer.model ?? (footer.variant === 'simple' ? 'reduzido' : 'completo'));
  const isSimple = model === 'reduzido';
  const showSiteMap = model === 'completo';
  el.className = isSimple ? 'site-footer site-footer--simple' : 'site-footer';

  const fullSections = isSimple ? '' : `
      <div class="site-footer__top">
        <img src="${company.logoNegative}" alt="${company.name}" class="site-footer__logo" />
      </div>

      ${showSiteMap ? `<div class="site-footer__nav-grid">
        ${columns}
      </div>` : ''}

      <div class="site-footer__info-grid">
        <div class="site-footer__block">
          <h4>${t('enderecoTitulo', lang)}</h4>
          <p class="site-footer__address-text">${texts.address}</p>
        </div>
        <div class="site-footer__block">
          <h4>${t('entreEmContatoTitulo', lang)}</h4>
          <div class="site-footer__contact-details">
            <a href="mailto:${footer.email}">${footer.email}</a>
            <a href="tel:${texts.phone.replace(/\D/g,'')}">${texts.phone}</a>
            <p>${texts.hours}</p>
          </div>
        </div>
        <div class="site-footer__block">
          <h4>${t('redesSociaisTitulo', lang)}</h4>
          <div class="site-footer__social-links">${socialLinks}</div>
        </div>
      </div>`;

  // Sidebar/tabmenu (and Banner "Reduzido") never reach fullSections above —
  // the bottom bar is the only place their footer can show social icons at
  // all, unlike completo/compacto's own dedicated block.
  const bottomBarSocials = isSimple && socialLinks
    ? `<div class="site-footer__social-links">${socialLinks}</div>`
    : '';

  el.innerHTML = `
    <div class="site-footer__inner">
      ${fullSections}
      <div class="site-footer__bottom">
        <div class="site-footer__bottom-links">${legalLinks}</div>
        ${bottomBarSocials}
        <span class="site-footer__copyright">${texts.copyright}</span>
        <a href="https://astri.solutions" class="site-footer__powered" target="_blank" rel="noopener">
          <span>Powered by</span>
          <img src="/assets/logotipo/logotipo-negative.svg" alt="Astri Solutions" />
        </a>
        <p class="site-footer__legal">${texts.disclaimer || ''}</p>
      </div>
    </div>`;
}
