// scripts/components/filterSelect.js
// Custom dropdown for .filter-box — replaces the native <select>, which had
// two persistent problems: (1) clicking the chevron/label area outside the
// select's own tiny rendered box didn't reliably open the native popup in
// every browser, and (2) the native option list uses OS/browser chrome and
// ignores our font/spacing, so it never matched the rest of the filter's
// look. This renders the closed state identically to the old filter-box but
// opens its own styled menu instead of the browser-native one.

let outsideClickBound = false;

export function filterBoxHtml({ id, label, options, value }) {
  const current = options.find(o => String(o.value) === String(value)) ?? options[0];
  return `<div class="filter-box" data-filter-select="${id}" tabindex="0" role="button"
    aria-haspopup="listbox" aria-expanded="false">
    <span class="filter-box__label">${label}</span>
    <span class="filter-box__value">${current ? current.label : ''}</span>
    <span class="filter-box__chevron" aria-hidden="true"></span>
    <ul class="filter-box__menu" role="listbox">
      ${options.map(o => `<li class="filter-box__option${String(o.value) === String(value) ? ' is-selected' : ''}"
        role="option" aria-selected="${String(o.value) === String(value)}" data-value="${o.value}">${o.label}</li>`).join('')}
    </ul>
  </div>`;
}

function closeBox(box) {
  box.classList.remove('is-open');
  box.setAttribute('aria-expanded', 'false');
}

function closeAllExcept(except) {
  document.querySelectorAll('.filter-box.is-open').forEach(box => {
    if (box !== except) closeBox(box);
  });
}

/**
 * Wires up every `[data-filter-select]` box inside `container` that hasn't
 * been bound yet. Safe to call again after a re-render (rebuilds innerHTML,
 * so previous listeners are gone with the old nodes anyway).
 * `onChange(id, value)` fires whenever an option is picked.
 */
export function initFilterSelects(container, onChange) {
  container.querySelectorAll('[data-filter-select]').forEach(box => {
    const id = box.dataset.filterSelect;
    const valueEl = box.querySelector('.filter-box__value');
    const menu = box.querySelector('.filter-box__menu');

    box.addEventListener('click', (e) => {
      const option = e.target.closest('.filter-box__option');
      if (option) {
        menu.querySelectorAll('.filter-box__option').forEach(o => {
          o.classList.remove('is-selected');
          o.setAttribute('aria-selected', 'false');
        });
        option.classList.add('is-selected');
        option.setAttribute('aria-selected', 'true');
        valueEl.textContent = option.textContent;
        closeBox(box);
        onChange(id, option.dataset.value);
        return;
      }
      if (box.classList.contains('is-open')) {
        closeBox(box);
      } else {
        closeAllExcept(box);
        box.classList.add('is-open');
        box.setAttribute('aria-expanded', 'true');
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeBox(box);
    });
  });

  if (!outsideClickBound) {
    outsideClickBound = true;
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-box.is-open').forEach(box => {
        if (!box.contains(e.target)) closeBox(box);
      });
    }, { capture: true });
  }
}
