// scripts/page.js
import { siteConfig }  from './site.config.js';
import { initTheme, refreshThemeFromSupabase } from './components/theme.js';
import { initTopbar }  from './components/topbar.js';
import { initHeader }  from './components/header.js';
import { initFooter }  from './components/footer.js';
import { initSearch }  from './components/search.js';
import { initMaterias } from './components/materias.js';
import { initDocumentos } from './components/documentos.js';
import { initResultados } from './components/resultados.js';
import { initSplash }  from './components/splash.js';
import { initCookies } from './components/cookies.js';
import { isPreviewMode, applyPreviewOverrides, markPreviewBanner } from './components/preview.js';
import { applyPageHeaderImage } from './components/pageHeader.js';
import { initAutoRefresh } from './autoRefresh.js';
import { applyStoredContrast } from './topbar.js';
import { getLang, t } from './lib/i18n.js';
import './icons.js';
import './reveal.js';
import './accordion.js';
import './counter.js';
import './empresa-tabs.js';

// Reflete o idioma escolhido no topbar antes de qualquer render
document.documentElement.lang = getLang(siteConfig);

// Modo de manutenção — ligado via Painel de Controle (super_admin). Nenhum
// outro componente é inicializado; o visitante só vê o aviso, sem
// navegação/conteúdo carregado por baixo. Em modo preview (?preview=1), o
// admin sempre vê a página real, mesmo com manutenção ligada.
if (siteConfig.maintenance && !isPreviewMode()) {
  showMaintenancePage();
} else if (isPreviewMode()) {
  // Busca canais/footer/empresas/etc. ao vivo do Supabase (rascunho incluso)
  // ANTES de inicializar nav/footer/etc., para que já nasçam com os dados
  // atualizados — sem isso, a página renderizaria com o último publicado.
  applyPreviewOverrides(siteConfig).finally(() => { boot(); markPreviewBanner(); });
} else {
  boot();
}

function showMaintenancePage() {
  const lang = getLang(siteConfig);
  const nome = siteConfig.company?.name ?? '';
  document.title = nome ? `${nome} — Em manutenção` : 'Em manutenção';
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px;text-align:center;font-family:system-ui,-apple-system,sans-serif;background:#F4F4F4;color:#141414;">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0B5B68" stroke-width="1.5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
      <h1 style="font-size:20px;font-weight:700;margin:0;">${t('manutencaoTitulo', lang) || 'Site em manutenção'}</h1>
      <p style="font-size:14px;color:#6F6F6F;max-width:420px;margin:0;">${t('manutencaoDesc', lang) || 'Estamos realizando atualizações. Volte novamente em breve.'}</p>
    </div>
  `;
}

function boot() {
  // Reaplica alto contraste antes de qualquer render — sem isso, cada
  // navegação (site multi-página) resetava para desligado.
  applyStoredContrast();

  // Injeta cores e fontes do CMS antes de qualquer outro componente
  initTheme(siteConfig);
  // Reaplica em background do Supabase — sem push/redeploy para mudanças visuais
  refreshThemeFromSupabase(siteConfig);

  // Atualiza title e favicon com os dados do portal
  if (siteConfig.company?.name) {
    const raw = document.title.trim();
    if (!raw || raw.includes('Workr Lite')) {
      document.title = siteConfig.company.name + ' — RI';
    } else {
      document.title = raw + ' — ' + siteConfig.company.name;
    }
  }
  if (siteConfig.company?.favicon) {
    const faviconEl = document.querySelector('link[rel="icon"]');
    if (faviconEl) {
      faviconEl.setAttribute('href', siteConfig.company.favicon);
      const ext = siteConfig.company.favicon.split('.').pop()?.toLowerCase();
      faviconEl.setAttribute('type', ext === 'svg' ? 'image/svg+xml' : ext === 'ico' ? 'image/x-icon' : `image/${ext}`);
    }
  }

  // Inicializa todos os componentes compartilhados
  initTopbar(siteConfig);
  initHeader(siteConfig);
  initFooter(siteConfig);
  applyPageHeaderImage(siteConfig);
  initSearch();
  initMaterias(siteConfig)
    .then(found => initDocumentos(siteConfig, found))
    .then(found => initResultados(siteConfig, found))
    .then(() => {
      // Só marca como "em construção" o que sobrou vazio DEPOIS de tentar
      // carregar o conteúdo real — convertê-los assim que a página abre
      // (antes do fetch assíncrono responder) piscava esse aviso em toda
      // página com conteúdo cadastrado, mesmo quando ele carregava normalmente
      // logo em seguida.
      document.querySelectorAll('.page-empty').forEach(el => { el.outerHTML = emConstrucaoHTML(); });
    });
  initSplash(siteConfig);
  initCookies(siteConfig);
  // Skipped in preview mode — an admin actively testing draft changes
  // shouldn't have the tab reload out from under them.
  if (!isPreviewMode()) initAutoRefresh();

  // ── Banner hero — conteúdo, imagem e atalhos ──────────────────────────────────
  // Todos os slides configurados em Personalização → Banner substituem o
  // texto/imagem estáticos do template (título, subtítulo, CTA, fundo) —
  // com mais de um, o hero alterna entre eles automaticamente, como o
  // carrossel do modelo tabmenu (carousel.js), só que sem os controles de
  // navegação (o hero aqui é uma seção única, não uma faixa dedicada).
  const heroSlides = siteConfig.banner ?? [];
  const heroTitleEl = document.querySelector('.home-hero__title');
  const heroSubtitleEl = document.querySelector('.home-hero__subtitle');
  const heroBgEl = document.getElementById('hero-bg');
  const heroCta = document.querySelector('[data-hero-cta]');

  function applyHeroSlide(slide) {
    if (!slide) return;
    const lang = getLang(siteConfig);
    const primaryLang = siteConfig.languages?.[0] ?? 'pt-BR';
    const content = slide.content?.[lang] ?? slide.content?.[primaryLang] ?? {};
    if (heroTitleEl && content.titulo) heroTitleEl.textContent = content.titulo;
    if (heroSubtitleEl && content.subtitulo) heroSubtitleEl.textContent = content.subtitulo;
    if (heroBgEl && slide.imagem) heroBgEl.src = slide.imagem;
    if (heroCta) {
      if (slide.ctaEnabled === false) {
        heroCta.style.display = 'none';
      } else {
        heroCta.style.display = '';
        if (content.cta) heroCta.textContent = content.cta;
        if (slide.ctaLink) {
          heroCta.setAttribute('href', slide.ctaLink);
        } else if (siteConfig.nav?.length) {
          const first = siteConfig.nav.find(ch => ch.enabled !== false);
          if (first) heroCta.setAttribute('href', first.href);
        }
      }
    }
  }

  if (heroSlides.length > 0) {
    let heroIndex = 0;
    applyHeroSlide(heroSlides[0]);
    if (heroSlides.length > 1) {
      const HERO_ROTATE_MS = 6000;
      const fadeTargets = [heroTitleEl, heroSubtitleEl, heroBgEl].filter(Boolean);
      setInterval(() => {
        heroIndex = (heroIndex + 1) % heroSlides.length;
        fadeTargets.forEach(el => { el.style.transition = 'opacity 0.4s ease'; el.style.opacity = '0'; });
        setTimeout(() => {
          applyHeroSlide(heroSlides[heroIndex]);
          fadeTargets.forEach(el => { el.style.opacity = '1'; });
        }, 400);
      }, HERO_ROTATE_MS);
    }
  }

  // Atalhos — até 4 páginas escolhidas em Personalização → Banner
  // (siteConfig.home.shortcuts). Sem nenhum configurado, nada é exibido —
  // não cai mais para o menu completo, que era confuso para quem queria só
  // alguns atalhos ou nenhum.
  const shortcutsNav = document.querySelector('.home-hero__shortcuts');
  const shortcutsInner = document.querySelector('[data-hero-shortcuts]');
  const homeShortcuts = siteConfig.home?.shortcuts;
  if (shortcutsInner && homeShortcuts?.length) {
    shortcutsInner.innerHTML = homeShortcuts.map(ch =>
      `<a href="${ch.href}" class="home-hero__shortcut">
        <span class="home-hero__shortcut-label">${ch.label}</span>
      </a>`
    ).join('');
  } else if (shortcutsNav) {
    shortcutsNav.style.display = 'none';
  }

  // Marca o link ativo no nav
  document.querySelectorAll('.nav-dropdown__link').forEach(link => {
    if (link.getAttribute('href') === location.pathname.replace(/\/$/, '') ||
        link.getAttribute('href') === location.pathname + 'index.html') {
      link.setAttribute('aria-current', 'page');
    }
  });

  // Substitui elementos .page-empty por bloco "Em construção"
  function emConstrucaoHTML() {
    const lang = getLang(siteConfig);
    return `<div class="em-construcao">
      <svg class="em-construcao__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.654-4.654m5.598-2.346a3.025 3.025 0 0 0-4.243-2.43L8.31 9.5l-2.5-1.25-1.81.906L3 10.531l1.16 1.628.637-.22 2.24 1.12 5.154-5.154M17.25 3l.591.591a2.25 2.25 0 0 1 0 3.182l-8.862 8.862a4.5 4.5 0 0 1-1.897 1.13L6 16.5l.497-1.582a4.5 4.5 0 0 1 1.13-1.897l8.862-8.862A2.25 2.25 0 0 1 17.25 3Z" />
      </svg>
      <p class="em-construcao__title">${t('emConstrucaoTitulo', lang)}</p>
      <p class="em-construcao__desc">${t('emConstrucaoDesc', lang)}</p>
    </div>`;
  }

  // MutationObserver para capturar .page-empty adicionados dinamicamente
  const emConstrucaoObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        node.querySelectorAll?.('.page-empty').forEach(el => { el.outerHTML = emConstrucaoHTML(); });
        if (node.classList?.contains('page-empty')) node.outerHTML = emConstrucaoHTML();
      }
    }
  });
  emConstrucaoObserver.observe(document.body, { childList: true, subtree: true });

  // Formulário de contato simples
  document.querySelectorAll('[data-contact-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      form.querySelector('[data-form-success]')?.classList.add('is-visible');
      form.reset();
    });
  });
}
