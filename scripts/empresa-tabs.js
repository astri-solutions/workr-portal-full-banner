// scripts/empresa-tabs.js
// Inicializa o tabmenu por empresa em páginas de lista/resultados/documentos.
// Gera abas e painéis dinamicamente a partir de siteConfig.empresas.
import { siteConfig } from './site.config.js';

const empresas = siteConfig.empresas ?? [];

document.querySelectorAll('[data-empresa-section]').forEach(section => {
  const template = section.querySelector('[data-empresa-panel-template]');
  if (!template) return; // página sem template de painel — skip

  const group = section.dataset.empresaGroup ?? 'empresa';

  // ── Build tab nav ────────────────────────────────────────────────────────
  const nav = document.createElement('nav');
  nav.className = 'tab-menu__nav';
  nav.dataset.tabNav = group;
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Selecionar empresa');

  // ── Build panels ─────────────────────────────────────────────────────────
  const panels = empresas.map((emp, i) => {
    const clone = template.content.cloneNode(true);
    const panel = clone.querySelector('[data-empresa-panel]');
    if (panel) {
      panel.dataset.tabPanel = group;
      panel.dataset.panel    = emp.id;
      if (i === 0) panel.classList.add('is-active');
    }
    return { emp, el: clone, panelEl: panel };
  });

  // Single-empresa: hide nav, show all panels without tabs
  if (empresas.length <= 1) {
    section.innerHTML = '';
    panels.forEach(({ el }) => section.appendChild(el));
    return;
  }

  // Multi-empresa: build tab buttons
  empresas.forEach((emp, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab-menu__tab' + (i === 0 ? ' is-active' : '');
    btn.dataset.tab = emp.id;
    btn.type = 'button';
    btn.role = 'tab';
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.textContent = emp.label;
    nav.appendChild(btn);
  });

  // Insert nav + panels
  section.innerHTML = '';
  section.appendChild(nav);
  panels.forEach(({ el }) => section.appendChild(el));

  // Tab switching
  const allTabs   = () => nav.querySelectorAll('[data-tab]');
  const allPanels = () => section.querySelectorAll(`[data-tab-panel="${group}"]`);

  allTabs().forEach(tab => {
    tab.addEventListener('click', () => {
      allTabs().forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      allPanels().forEach(p => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      section.querySelector(`[data-tab-panel="${group}"][data-panel="${tab.dataset.tab}"]`)
        ?.classList.add('is-active');
    });
  });
});
