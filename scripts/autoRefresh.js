// scripts/autoRefresh.js
// Reloads the page automatically every REFRESH_MINUTES so a tab left open
// (kiosk display, someone keeping IR data on a second monitor) picks up
// newly published documentos/matérias/resultados without a manual F5 —
// none of that content re-fetches itself otherwise, it's only ever loaded
// once at page load.
//
// 15 minutes: frequent enough that same-day publications (a fato relevante,
// a result released mid-morning) show up within the hour without anyone
// remembering to refresh, infrequent enough to not interrupt reading or
// generate noisy analytics/traffic.
const REFRESH_MINUTES = 15;
const REFRESH_MS = REFRESH_MINUTES * 60 * 1000;

// Never reload out from under someone mid-input — the contact/form
// components on this site (Fale com RI, Mailing, matéria-embedded
// formulários) all render plain <form> elements.
function hasUnsavedInput() {
  for (const form of document.querySelectorAll('form')) {
    for (const el of form.querySelectorAll('input, textarea, select')) {
      if (el.type === 'submit' || el.type === 'button' || el.type === 'checkbox' || el.type === 'radio') continue;
      if ((el.value ?? '').trim() !== '') return true;
    }
  }
  return false;
}

export function initAutoRefresh() {
  let dueAt = Date.now() + REFRESH_MS;

  function tryReload() {
    if (Date.now() < dueAt) return;
    // Hidden tabs get throttled timers anyway, and reloading a page nobody
    // is looking at is pointless — wait for it to come back into view.
    if (document.hidden || hasUnsavedInput()) {
      dueAt = Date.now() + 60 * 1000; // recheck in a minute
      return;
    }
    location.reload();
  }

  setInterval(tryReload, 30 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tryReload(); });
}
