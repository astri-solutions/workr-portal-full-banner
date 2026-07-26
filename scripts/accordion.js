// scripts/accordion.js
// Event delegation instead of binding each trigger at import time: matéria
// content is fetched and injected long after this module runs, so any
// accordion inside a matéria would otherwise be dead on arrival.
document.addEventListener('click', e => {
  const trigger = e.target.closest('.accordion__trigger');
  if (!trigger) return;

  const item = trigger.closest('.accordion__item');
  if (!item) return;
  const isOpen = item.classList.contains('accordion__item--open');

  item.closest('.accordion')
    ?.querySelectorAll('.accordion__item--open')
    .forEach(el => {
      el.classList.remove('accordion__item--open');
      el.querySelector('.accordion__trigger')?.setAttribute('aria-expanded', 'false');
    });

  if (!isOpen) {
    item.classList.add('accordion__item--open');
    trigger.setAttribute('aria-expanded', 'true');
  }
});
