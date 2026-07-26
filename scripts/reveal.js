// scripts/reveal.js
// Fades content in as it enters the viewport. Paired with
// styles/components/_reveal.scss, which only hides anything once the
// `reveal-ready` class below is present — so a JS failure degrades to a
// plain, fully visible page instead of a blank one.
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });

/**
 * Observes every not-yet-observed reveal target under `root`. Safe to call
 * repeatedly — matérias, documentos and resultados are fetched and injected
 * long after this module first runs, and the original one-shot query at
 * import time never saw any of them.
 */
export function observeReveals(root = document) {
  root.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach(el => {
    if (el.dataset.revealBound) return;
    el.dataset.revealBound = '1';
    observer.observe(el);
  });
}

document.documentElement.classList.add('reveal-ready');
observeReveals();
