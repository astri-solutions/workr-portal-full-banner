// scripts/accordion.js
document.querySelectorAll('.accordion__trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item   = trigger.closest('.accordion__item');
    const isOpen = item.classList.contains('accordion__item--open');
    item.closest('.accordion')
      ?.querySelectorAll('.accordion__item--open')
      .forEach(el => el.classList.remove('accordion__item--open'));
    if (!isOpen) item.classList.add('accordion__item--open');
  });
});
