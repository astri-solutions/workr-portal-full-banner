// scripts/calendar.js
import { siteConfig } from './site.config.js';
import { fetchWithPreview } from './components/preview.js';

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const DAYS_PT = ['D','S','T','Q','Q','S','S'];

// portal_eventos.tipo is free text typed in the CMS (CalendarioPage.tsx's
// TIPOS list), not a fixed enum with its own color slot — every type maps to
// the same neutral dot/legend color. Only a dedicated "category" field would
// let this vary per type the way the old hardcoded demo data faked it.
const EVENT_COLOR = '#0B5B68';

// Sample events shown ONLY when this deploy has no real portal wired up
// (siteConfig.supabase.portalId empty) — same rule as materias.js's
// renderDemoMateria: the cliente-workr-lite template's own preview/test
// deployment, never an actual client portal (every provisioned portal gets
// a real portalId injected into its own site.config.js).
const DEMO_EVENTS = [
  { id: 'demo-1', titulo: 'Divulgação de Resultados (exemplo)', data: '2026-05-03', hora: '00:00', local: 'Horário de Brasília', tipo: 'Divulgação de Resultados', status: 'publicado' },
  { id: 'demo-2', titulo: 'Teleconferência de Resultados (exemplo)', data: '2026-05-08', hora: '10:00', local: 'Horário de Brasília', tipo: 'Teleconferência', status: 'publicado' },
];

let allEvents = [];
let currentYear;
let currentMonth;

function gmailUrl(e) {
  const dt = e.data.replace(/-/g, '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.titulo)}&dates=${dt}/${dt}`;
}
function outlookUrl(e) {
  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(e.titulo)}&startdt=${e.data}&enddt=${e.data}&allday=true`;
}

// Tooltip
let tooltip = null;
function getTooltip() {
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'cal-tooltip';
    document.body.appendChild(tooltip);
  }
  return tooltip;
}
function showTooltip(el, events) {
  const t = getTooltip();
  t.innerHTML = events.map(e => `
    <div class="cal-tooltip__item" style="border-left-color:${EVENT_COLOR}">
      <strong>${Number(e.data.slice(8, 10))}/${MONTHS_PT[Number(e.data.slice(5, 7)) - 1].slice(0, 3)}</strong> — ${e.titulo}
      ${e.hora ? `<div class="cal-tooltip__time">${e.hora}</div>` : ''}
    </div>`).join('');
  t.classList.add('is-visible');
  const rect = el.getBoundingClientRect();
  t.style.top  = `${rect.bottom + 8}px`;
  t.style.left = `${rect.left + rect.width / 2}px`;
}
function hideTooltip() { tooltip?.classList.remove('is-visible'); }

function eventsForMonth(year, month) {
  return allEvents.filter(e => {
    const [y, m] = e.data.split('-').map(Number);
    return y === year && (m - 1) === month;
  });
}

function renderCalendar() {
  const calEl    = document.getElementById('event-calendar');
  const legendEl = document.getElementById('event-legend');
  const pastEl   = document.getElementById('past-events');
  if (!calEl) return;
  hideTooltip();

  const events      = eventsForMonth(currentYear, currentMonth);
  const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevDays    = new Date(currentYear, currentMonth, 0).getDate();

  let cells = '';
  for (let i = 0; i < firstDay; i++) {
    cells += `<div class="cal-cell cal-cell--out">${prevDays - firstDay + 1 + i}</div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEvents = events.filter(e => Number(e.data.slice(8, 10)) === d);
    const dots = dayEvents.map(() =>
      `<span class="cal-cell__dot" style="background:${EVENT_COLOR}"></span>`
    ).join('');
    cells += `<div class="cal-cell${dayEvents.length ? ' cal-cell--has-event' : ''}" data-day="${d}">${d}${dots ? `<div class="cal-cell__dots">${dots}</div>` : ''}</div>`;
  }
  const remaining = (7 - (firstDay + daysInMonth) % 7) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells += `<div class="cal-cell cal-cell--out">${i}</div>`;
  }

  const eventItems = events.map(e => {
    const day = e.data.slice(8, 10);
    const mon = MONTHS_SHORT[Number(e.data.slice(5, 7)) - 1];
    return `
      <div class="event-item">
        <div class="event-item__body">
          <span class="event-item__date">${day}/${mon}</span>
          <span class="event-item__label">${e.titulo}</span>
          <span class="event-item__time">${[e.hora, e.local].filter(Boolean).join(' — ')}</span>
        </div>
        <div class="event-item__actions">
          <span class="event-item__export-label">Exportar</span>
          <a href="${gmailUrl(e)}" class="event-item__export" target="_blank" rel="noopener" title="Google Calendar" aria-label="Exportar para Google Calendar"><img src="/assets/icons/gmail.svg" width="20" height="20" aria-hidden="true" alt=""></a>
          <a href="${outlookUrl(e)}" class="event-item__export" target="_blank" rel="noopener" title="Outlook" aria-label="Exportar para Outlook"><img src="/assets/icons/outlook.svg" width="20" height="20" aria-hidden="true" alt=""></a>
        </div>
      </div>`;
  }).join('');

  calEl.innerHTML = `
    <div class="cal-box">
      <div class="cal-box__nav">
        <button class="cal-nav__btn" id="cal-prev" aria-label="Mês anterior">
          <img src="/assets/icons/chevron-left.svg" width="16" height="16" aria-hidden="true" alt="">
        </button>
        <span class="cal-box__title">${MONTHS_PT[currentMonth]} / ${currentYear}</span>
        <button class="cal-nav__btn" id="cal-next" aria-label="Próximo mês">
          <img src="/assets/icons/chevron-right.svg" width="16" height="16" aria-hidden="true" alt="">
        </button>
      </div>
      <div class="cal-header">
        ${DAYS_PT.map(d => `<div class="cal-header__day">${d}</div>`).join('')}
      </div>
      <div class="cal-body">${cells}</div>
    </div>
    <div class="event-list-wrap">
      <p class="event-list-wrap__title">Próximos eventos</p>
      <div class="event-list">${eventItems || '<p style="color:var(--color-text-muted);font-size:0.875rem;padding:16px 0">Nenhum evento neste mês.</p>'}</div>
    </div>`;

  calEl.querySelectorAll('.cal-cell--has-event').forEach(cell => {
    const d = parseInt(cell.dataset.day);
    const dayEvents = events.filter(e => Number(e.data.slice(8, 10)) === d);
    cell.addEventListener('mouseenter', () => showTooltip(cell, dayEvents));
    cell.addEventListener('mouseleave', hideTooltip);
  });

  document.getElementById('cal-prev').addEventListener('click', () => {
    if (--currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    if (++currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
  });

  // Legend — one entry per tipo actually in use, not a fixed category list.
  const usedTipos = [...new Set(allEvents.map(e => e.tipo).filter(Boolean))];
  legendEl.innerHTML = usedTipos.map(tipo => `
    <span class="event-legend__item">
      <span class="event-legend__dot" style="background:${EVENT_COLOR}"></span>
      ${tipo}
    </span>`).join('');

  // Past events: same date-string comparison used across the CMS
  // (CalendarioPage.tsx) — data is already YYYY-MM-DD, so lexicographic
  // comparison sorts identically to a date comparison with no TZ surprises.
  const today = new Date().toISOString().slice(0, 10);
  const past = allEvents.filter(e => e.data < today).sort((a, b) => b.data.localeCompare(a.data));
  pastEl.innerHTML = `
    <div class="filter-bar" style="margin-bottom:24px">
      <h2 class="past-events__title">Eventos realizados</h2>
    </div>
    ${past.length === 0
      ? '<p style="color:var(--color-text-muted);font-size:0.875rem;padding:16px 0">Nenhum evento realizado ainda.</p>'
      : past.map(e => `
        <div class="doc-row" aria-label="${e.titulo}">
          <span class="doc-row__date">${e.data.slice(8, 10)}/${e.data.slice(5, 7)}/${e.data.slice(0, 4)}</span>
          <span class="doc-row__sep">-</span>
          <span class="doc-row__title">${e.titulo}</span>
        </div>`).join('')}`;
}

async function loadEvents() {
  const sb = siteConfig?.supabase;
  if (!sb?.url || !sb?.anonKey || !sb?.portalId) {
    allEvents = DEMO_EVENTS;
    return;
  }
  try {
    const url = `${sb.url}/rest/v1/portal_eventos?portal_id=eq.${encodeURIComponent(sb.portalId)}&status=eq.publicado&order=data.asc`;
    const res = await fetchWithPreview(sb, url, 'eventos');
    if (!res.ok) { allEvents = []; return; }
    allEvents = await res.json();
  } catch {
    allEvents = [];
  }
}

async function init() {
  await loadEvents();
  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  // Land on the first month that actually has an upcoming event, so a
  // portal with events scheduled months out doesn't open on an empty grid.
  const upcoming = allEvents.filter(e => e.data >= today.toISOString().slice(0, 10)).sort((a, b) => a.data.localeCompare(b.data));
  if (upcoming.length > 0) {
    const [y, m] = upcoming[0].data.split('-').map(Number);
    currentYear = y;
    currentMonth = m - 1;
  }
  renderCalendar();
}

init();
