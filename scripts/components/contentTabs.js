// scripts/components/contentTabs.js
// Tabbed content block inside a matéria (bloco "Abas"). Distinct from
// scripts/tab-menu.js, which drives the tabmenu *layout*'s channel nav.
//
// Delegated from document so blocks injected after load work with no
// re-initialisation.
document.addEventListener('click', e => {
  const tab = e.target.closest('[data-tab-index]');
  if (!tab) return;
  const root = tab.closest('[data-materia-tabs]');
  if (!root) return;

  const index = tab.dataset.tabIndex;

  root.querySelectorAll('[data-tab-index]').forEach(el => {
    const active = el === tab;
    el.classList.toggle('is-active', active);
    el.setAttribute('aria-selected', String(active));
  });

  root.querySelectorAll('[data-tab-panel]').forEach(panel => {
    panel.classList.toggle('is-active', panel.dataset.tabPanel === index);
  });
});
