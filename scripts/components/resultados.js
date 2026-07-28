// scripts/components/resultados.js
import { fetchWithPreview } from './preview.js';
// Fetches published trimestres/anos (portal_resultado_periodos) and their
// files (portal_resultado_arquivos) and renders them as a year-grouped
// accordion — mirrors the CMS's own "Central de Resultados" list. Unlike
// documentos.js, results aren't scoped to a page/canal — they're scoped to
// the portal + empresa, so this triggers whenever the current page/panel
// looks like the results channel (slug/href containing "resultado").
import { fileBadgeSvg, resolvePageEntry } from './documentos.js';
import { getLang, t } from '../lib/i18n.js';
import { filterBoxHtml, initFilterSelects } from './filterSelect.js';

function looksLikeResultadosPage(entry) {
  const slug = String(entry?.id ?? '').toLowerCase();
  const href = String(entry?.href ?? '').toLowerCase();
  const label = String(entry?.label ?? '').toLowerCase();
  return slug.includes('resultado') || href.includes('resultado') || label.includes('resultado');
}

function fileUrl(sb, filePath) {
  return `${sb.url}/storage/v1/object/public/portal-documents/${filePath}`;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

// "1T26" -> "2026"; "2026" (anual) -> "2026"
function periodYear(period) {
  const m = String(period ?? '').match(/(\d{2,4})$/);
  if (!m) return null;
  return m[1].length === 2 ? `20${m[1]}` : m[1];
}

// "Apenas Português" is a período-level flag (same file replicated across
// every idioma), not per-arquivo — the caption comes from the parent
// período, unlike documentos.js where each row carries its own pt_only.
function ptOnlyCaptionHtml(periodo) {
  return periodo?.pt_only ? ` <span class="doc-list__pt-only">(Portuguese only)</span>` : '';
}

function docItemHtml(a, sb, periodo) {
  const href = a.external_link || fileUrl(sb, a.file_path);
  return `<li class="doc-list__item">
    <div class="doc-list__info">
      <span class="doc-list__date">${formatDate(a.created_at)}</span>
      <span class="doc-list__sep" aria-hidden="true">—</span>
      <a href="${href}" class="doc-list__title doc-list__title-link" target="_blank" rel="noopener">${a.nome}</a>${ptOnlyCaptionHtml(periodo)}
    </div>
    <div class="doc-list__actions">
      <a href="${href}" class="doc-list__link doc-list__icon" aria-label="Baixar ${a.nome}" target="_blank" rel="noopener">
        ${fileBadgeSvg(a.file_path ?? a.external_link ?? '')}
      </a>
    </div>
  </li>`;
}

function tableRowHtml(periodo, a, sb) {
  const href = a.external_link || fileUrl(sb, a.file_path);
  return `<tr class="doc-table__row">
    <td class="doc-table__cell doc-table__cell--date">${formatDate(a.created_at)}</td>
    <td class="doc-table__cell doc-table__cell--periodo">${periodo.period}</td>
    <td class="doc-table__cell doc-table__cell--name"><a href="${href}" class="doc-table__title-link" target="_blank" rel="noopener">${a.nome}</a>${ptOnlyCaptionHtml(periodo)}</td>
    <td class="doc-table__cell doc-table__cell--action">
      <a href="${href}" class="doc-list__link doc-list__icon" aria-label="Baixar ${a.nome}" target="_blank" rel="noopener">
        ${fileBadgeSvg(a.file_path ?? a.external_link ?? '')}
      </a>
    </td>
  </tr>`;
}

// Row order/labels for the "Tabela Resultados" matrix — mirrors the tipo
// options in the CMS's Central de Resultados file editor.
const TIPO_ROWS = [
  { tipo: 'release',      label: 'Release de Resultados' },
  { tipo: 'apresentacao', label: 'Apresentação de Resultados' },
  { tipo: 'planilha',     label: 'Planilha de Apoio' },
  { tipo: 'dfs',          label: 'Demonstrações Financeiras' },
  { tipo: 'transcricao',  label: 'Transcrição' },
  { tipo: 'audio',        label: 'Áudio' },
  { tipo: 'transmissao',  label: 'Transmissão' },
  { tipo: 'ata',          label: 'Ata RCA' },
  { tipo: 'outros',       label: 'Outros' },
];

function matrixCellHtml(arquivo, sb) {
  if (!arquivo) {
    return `<td class="doc-matrix__cell doc-matrix__cell--empty">
      <span class="doc-matrix__link doc-matrix__link--disabled" aria-hidden="true">
        ${fileBadgeSvg('')}
      </span>
    </td>`;
  }
  const href = arquivo.external_link || fileUrl(sb, arquivo.file_path);
  return `<td class="doc-matrix__cell">
    <a href="${href}" class="doc-matrix__link" aria-label="Baixar ${arquivo.nome}" target="_blank" rel="noopener">
      ${fileBadgeSvg(arquivo.file_path ?? arquivo.external_link ?? '')}
    </a>
  </td>`;
}

// "Tabela Resultados" pageType — a category × trimestre matrix (one table
// per year), matching the reference layout: rows are document categories,
// columns are the year's trimestres, and a cell is either the file's icon
// (linked) or empty/transparent when that category has no file that quarter.
function renderResultadosMatrix(periodos, arquivosByPeriodo, sb) {
  const byYear = [];
  for (const p of periodos) {
    const year = periodYear(p.period) ?? '—';
    let g = byYear.find(g => g.year === year);
    if (!g) { g = { year, periodos: [] }; byYear.push(g); }
    g.periodos.push(p);
  }
  byYear.forEach(g => g.periodos.sort((a, b) => a.period.localeCompare(b.period)));

  return byYear.map(g => {
    const rows = TIPO_ROWS.filter(row =>
      g.periodos.some(p => (arquivosByPeriodo[p.id] ?? []).some(a => a.tipo === row.tipo))
    );
    if (!rows.length) return '';
    const rowsHtml = rows.map(row => {
      const cells = g.periodos.map(p => {
        const arquivo = (arquivosByPeriodo[p.id] ?? []).find(a => a.tipo === row.tipo);
        return matrixCellHtml(arquivo, sb);
      }).join('');
      return `<tr><th class="doc-matrix__cell doc-matrix__cell--row" scope="row">${row.label}</th>${cells}</tr>`;
    }).join('');
    return `<div class="doc-matrix-wrap">
      <table class="doc-matrix">
        <thead>
          <tr>
            <th class="doc-matrix__cell doc-matrix__cell--year">${g.year}</th>
            ${g.periodos.map(p => `<th class="doc-matrix__cell">${p.period}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;
  }).join('');
}

// Tabela pageType — same período/arquivo data as the accordion, laid out as
// rows instead of grouped/collapsible sections. Content is identical either
// way; only the presentation changes.
function renderResultadosTable(periodos, arquivosByPeriodo, sb, lang) {
  const rows = periodos.flatMap(p => (arquivosByPeriodo[p.id] ?? []).map(a => ({ p, a })));
  if (!rows.length) return `<p class="docs-vazio">${t('nenhumResultado', lang)}</p>`;
  return `<div class="doc-table-wrap">
    <table class="doc-table">
      <thead>
        <tr>
          <th class="doc-table__cell">Data</th>
          <th class="doc-table__cell">Trimestre</th>
          <th class="doc-table__cell">Arquivo</th>
          <th class="doc-table__cell"></th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(({ p, a }) => tableRowHtml(p, a, sb)).join('')}
      </tbody>
    </table>
  </div>`;
}

// No local click binding here — scripts/accordion.js owns a single
// document-level delegated listener for every `.accordion__trigger` on the
// page. A second, per-container listener bound here double-fires on every
// click (open then immediately re-close) — see documentos.js's identical
// note. All periods start closed (idx is now unused for the open state).
function renderPeriodoItem(periodo, arquivos, sb, idx, lang) {
  const body = arquivos.length
    ? `<ul class="doc-list" role="list">${arquivos.map(a => docItemHtml(a, sb, periodo)).join('')}</ul>`
    : `<p class="docs-vazio">${t('nenhumArquivo', lang)}</p>`;
  return `<div class="accordion__item" data-accordion-item>
    <button class="accordion__trigger" type="button" aria-expanded="false">
      <span class="accordion__label">📁 ${periodo.period}</span>
      <span class="accordion__icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </button>
    <div class="accordion__body">${body}</div>
  </div>`;
}

function renderResultados(periodos, arquivosByPeriodo, container, sb, siteConfig, pageType) {
  const empresas = siteConfig.empresas ?? [];
  const variant = siteConfig.header?.variant ?? 'sidebar';
  const showEmpresaTabs = empresas.length > 1 && variant !== 'tabmenu';
  const showEmpresaFilter = empresas.length > 1 && variant === 'tabmenu';
  const lang = getLang(siteConfig);

  const years = [...new Set(periodos.map(periodYear).filter(Boolean))].sort((a, b) => b - a);

  // With more than one empresa, results/documents must never mix between
  // companies in the same view — default to the principal (first) empresa
  // rather than an "all companies" state, for both the tab and select UIs.
  const filters = {
    ano: years.length === 1 ? String(years[0]) : '',
    empresa: empresas.length > 1 ? (empresas[0]?.id ?? '') : '',
  };

  function passesFilters(p) {
    if (filters.ano && periodYear(p.period) !== filters.ano) return false;
    if (filters.empresa && p.entity_id !== filters.empresa) return false;
    return true;
  }

  function controlsHtml() {
    const parts = [`<div class="filter-bar__group">`];
    parts.push(filterBoxHtml({
      id: 'ano',
      label: t('filtrarAno', lang),
      value: filters.ano,
      options: [{ value: '', label: t('todosOsAnos', lang) }, ...years.map(y => ({ value: String(y), label: String(y) }))],
    }));
    if (showEmpresaFilter) {
      parts.push(filterBoxHtml({
        id: 'empresa',
        label: t('filtrarEmpresa', lang),
        value: filters.empresa,
        options: empresas.map(e => ({ value: e.id, label: e.label })),
      }));
    }
    parts.push(`</div>`);
    return `<div class="filter-bar">${parts.join('')}</div>`;
  }

  function empresaTabsHtml() {
    if (!showEmpresaTabs) return '';
    const tabs = empresas.map(e => `
      <button class="tab-menu__tab${e.id === filters.empresa ? ' is-active' : ''}"
        type="button" role="tab" data-res-empresa-tab="${e.id}"
        aria-selected="${e.id === filters.empresa}">${e.label}</button>`).join('');
    return `<nav class="tab-menu__nav" data-res-empresa-tabs role="tablist" aria-label="Selecionar empresa">${tabs}</nav>`;
  }

  function render() {
    const filtered = periodos.filter(passesFilters);
    let body;
    if (!filtered.length) {
      body = `<p class="docs-vazio">${t('nenhumResultado', lang)}</p>`;
    } else if (pageType === 'tabela-resultados') {
      body = renderResultadosMatrix(filtered, arquivosByPeriodo, sb);
    } else if (pageType === 'tabela') {
      body = renderResultadosTable(filtered, arquivosByPeriodo, sb, lang);
    } else {
      const byYear = [];
      for (const p of filtered) {
        const year = periodYear(p.period) ?? '—';
        let g = byYear.find(g => g.year === year);
        if (!g) { g = { year, periodos: [] }; byYear.push(g); }
        g.periodos.push(p);
      }
      body = byYear.map(g => `
        <h3 class="resultados-year-label">${g.year}</h3>
        <div class="accordion" data-accordion>
          ${g.periodos.map((p, idx) => renderPeriodoItem(p, arquivosByPeriodo[p.id] ?? [], sb, idx, lang)).join('')}
        </div>`).join('');
    }
    container.innerHTML = `${controlsHtml()}${empresaTabsHtml()}<div data-res-content>${body}</div>`;
    bind();
  }

  function bind() {
    initFilterSelects(container, (id, value) => {
      if (id === 'ano') filters.ano = value;
      if (id === 'empresa') filters.empresa = value;
      render();
    });
    container.querySelectorAll('[data-res-empresa-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        filters.empresa = tab.dataset.resEmpresaTab;
        render();
      });
    });
  }

  render();
}

/**
 * Fetches published períodos + arquivos for the portal and renders them into
 * container. Not page-scoped (unlike documentos.js) — Central de Resultados
 * is a single portal-wide page, scoped only by empresa.
 */
export async function loadResultadosInto(pageEntry, container, sb, siteConfig = {}) {
  const entry = typeof pageEntry === 'string' ? { id: pageEntry } : pageEntry;
  if (!container || !looksLikeResultadosPage(entry)) return false;
  if (!sb?.url || !sb?.anonKey || !sb?.portalId) return false;

  try {
    const periodosUrl = `${sb.url}/rest/v1/portal_resultado_periodos?portal_id=eq.${encodeURIComponent(sb.portalId)}&status=eq.Publicado&order=created_at.desc`;
    const periodosRes = await fetchWithPreview(sb, periodosUrl, 'resultado_periodos');
    if (!periodosRes.ok) return false;
    const periodos = await periodosRes.json();
    if (!Array.isArray(periodos) || periodos.length === 0) return false;

    const arquivosUrl = `${sb.url}/rest/v1/portal_resultado_arquivos?portal_id=eq.${encodeURIComponent(sb.portalId)}&status=eq.Publicado&order=ordem.asc`;
    const arquivosRes = await fetchWithPreview(sb, arquivosUrl, 'resultado_arquivos');
    const arquivos = arquivosRes.ok ? await arquivosRes.json() : [];
    const arquivosByPeriodo = {};
    (Array.isArray(arquivos) ? arquivos : []).forEach(a => {
      (arquivosByPeriodo[a.periodo_id] ??= []).push(a);
    });

    renderResultados(periodos, arquivosByPeriodo, container, sb, siteConfig ?? {}, entry.pageType);
    container.classList.add('resultados--loaded');
    container.parentElement?.querySelector('.page-empty, .em-construcao')?.remove();
    return true;
  } catch {
    return false;
  }
}

export async function initResultados(siteConfig, alreadyRendered) {
  if (alreadyRendered) return;
  const path = location.pathname.replace(/\/$/, '') || '/';
  if (!path.toLowerCase().includes('resultado')) return;
  const sb = siteConfig?.supabase;
  const container = document.querySelector('[data-materias]');
  // Resolve the real nav entry (not just a synthetic {id: path}) so its
  // pageType (lista / lista-agrupada / tabela, set via Canais → Editar
  // canal) is honored — same content, different presentation.
  const entry = resolvePageEntry(siteConfig?.nav) ?? { id: path };
  await loadResultadosInto(entry, container, sb, siteConfig);
}
