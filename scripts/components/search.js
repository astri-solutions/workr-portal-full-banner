// scripts/components/search.js
export function initSearch() {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;

  const input = overlay.querySelector('[data-search-input]');
  const closeBtn = overlay.querySelector('[data-search-close]');

  function open() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => input?.focus(), 50);
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-search-toggle]').forEach(btn =>
    btn.addEventListener('click', open));

  closeBtn?.addEventListener('click', close);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });
}
