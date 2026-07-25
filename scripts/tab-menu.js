// scripts/tab-menu.js
import { siteConfig } from './site.config.js';
import { loadMateriasInto } from './components/materias.js';
import { loadDocumentosInto } from './components/documentos.js';
import { loadResultadosInto } from './components/resultados.js';

const TAB_NAV_ID = 'home-tabs';

// Tabmenu-model portals (header.variant === 'tabmenu') show every channel's
// matéria content inline, below the tab bar — clicking a tab loads its
// content into the panel below without leaving the page.
function buildTabMenu() {
  const nav = document.querySelector('[data-tab-nav="home-tabs"]');
  const panelArea = document.querySelector('.tab-menu__panels');
  if (!nav || !panelArea) return;

  const channels = (siteConfig.nav ?? []).filter(ch => ch.enabled !== false);
  if (!channels.length) return;

  const sb = siteConfig.supabase;
  const loaded = new Set();

  nav.innerHTML = '';
  panelArea.innerHTML = '';

  channels.forEach((ch, i) => {
    const slug = ch.id ?? ch.slug ?? ch.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const btn = document.createElement('button');
    btn.className = 'tab-menu__tab' + (i === 0 ? ' is-active' : '');
    btn.dataset.tab = slug;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.textContent = ch.label;
    nav.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'tab-menu__panel' + (i === 0 ? ' is-active' : '');
    panel.dataset.tabPanel = TAB_NAV_ID;
    panel.dataset.panel = slug;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-label', ch.label);
    // No .page-empty here — it must only appear once loadPanel() has
    // actually tried and failed to find content. The global MutationObserver
    // in page.js converts .page-empty into "Em construção" the instant it's
    // inserted, so adding it upfront (before the async fetch even starts)
    // showed that message on every tab switch and every reload, even when
    // the channel had real content.
    panel.innerHTML = `<div data-materias></div>`;
    panelArea.appendChild(panel);
  });

  const tabs = nav.querySelectorAll('.tab-menu__tab');
  const panels = panelArea.querySelectorAll('.tab-menu__panel');

  const channelBySlug = new Map(channels.map(ch => [
    ch.id ?? ch.slug ?? ch.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''), ch,
  ]));

  async function loadPanel(slug) {
    if (loaded.has(slug)) return;
    loaded.add(slug);
    const panel = panelArea.querySelector(`[data-panel="${slug}"]`);
    const container = panel?.querySelector('[data-materias]');
    const found = await loadMateriasInto(slug, container, sb);
    const ch = channelBySlug.get(slug) ?? slug;
    const found2 = found || await loadDocumentosInto(ch, container, sb, siteConfig);
    const found3 = found2 || await loadResultadosInto(ch, container, sb, siteConfig);
    // Only now — after every loader has actually tried — do we know the
    // channel really has nothing to show.
    if (!found3 && panel && !panel.querySelector('.page-empty, .em-construcao')) {
      panel.insertAdjacentHTML('beforeend', '<div class="page-empty"></div>');
    }
  }

  function activate(slug) {
    if (!channelBySlug.has(slug)) return false;
    tabs.forEach(t => { t.classList.toggle('is-active', t.dataset.tab === slug); t.setAttribute('aria-selected', String(t.dataset.tab === slug)); });
    panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === slug));
    loadPanel(slug);
    return true;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activate(tab.dataset.tab));
  });

  // The mobile menu links to home+hash instead of a standalone page (there
  // isn't one — everything renders inline here), so hash changes need to
  // swap tabs the same way clicking one does.
  window.addEventListener('hashchange', () => activate(location.hash.slice(1)));

  const initialSlug = location.hash.slice(1);
  if (!activate(initialSlug)) {
    loadPanel(channels[0].id ?? channels[0].slug ?? channels[0].label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  }
}

// Also handle any static [data-tab-nav] sets that are not home-tabs (other pages)
document.querySelectorAll('[data-tab-nav]:not([data-tab-nav="home-tabs"])').forEach(staticNav => {
  const group = staticNav.dataset.tabNav;
  const tabs = staticNav.querySelectorAll('[data-tab]');
  const panels = document.querySelectorAll(`[data-tab-panel="${group}"]`);

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      document.querySelector(`[data-tab-panel="${group}"][data-panel="${tab.dataset.tab}"]`)
        ?.classList.add('is-active');
    });
  });
});

buildTabMenu();
