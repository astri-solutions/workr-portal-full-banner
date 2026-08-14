// scripts/components/documentos.js
import { getLang, pick, t } from '../lib/i18n.js';
import { filterBoxHtml, initFilterSelects } from './filterSelect.js';
import { fetchWithPreview } from './preview.js';
// Fetches published documents (portal_documents) for a page and renders them
// either as a flat filterable list ("lista") or as an accordion grouped by
// sub-grupo/ano ("lista-agrupada"), mirroring cms-lista.html / cms-lista-agrupada.html.
// Also handles the empresa dimension: when the portal has more than one empresa,
// sidebar/banner layouts get an in-content tab menu (one company at a time,
// like a nested nav), while tabmenu layouts get a second "Empresa" filter select
// next to "Ano" (adding tabs-inside-tabs there would be confusing).

export function resolvePageEntry(nav) {
  const path = location.pathname.replace(/\/$/, '') || '/';
  const matches = href => href && (path === href.replace(/\.html$/, '') || path + '.html' === href || path === href);
  for (const canal of nav ?? []) {
    if (matches(canal.href)) return canal;
    for (const sub of canal.children ?? []) {
      if (matches(sub.href)) return sub;
    }
  }
  return undefined;
}

const EXT_LABEL = {
  pdf: 'PDF',
  xls: 'XLS', xlsx: 'XLS',
  doc: 'DOC', docx: 'DOC',
  ppt: 'PPT', pptx: 'PPT',
  mp3: 'MP3', wav: 'WAV', m4a: 'AUD',
  mp4: 'MP4', mov: 'MOV', avi: 'AVI',
};

function extOf(path) {
  const m = String(path ?? '').match(/\.([^.?]+)(?:\?.*)?$/);
  return m ? m[1].toLowerCase() : '';
}

// Inline vector badge — crisp at any size, unlike the raster-in-SVG assets
// under /assets/icons (those embed a bitmap pattern fill and blur when
// scaled down to list-icon size). Exported for reuse by resultados.js.
// `isExternal` swaps the file-shape badge for an external-link glyph — an
// external link isn't a file at all, so a "LINK" label stamped on a file
// icon read as a wrong file type rather than as "opens elsewhere".
export function fileBadgeSvg(pathOrUrl, isExternal = false) {
  if (isExternal) {
    return `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M15 3h6v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 14L21 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
  const label = pathOrUrl ? (EXT_LABEL[extOf(pathOrUrl)] ?? '') : '';
  return `<svg width="26" height="30" viewBox="0 0 26 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M2 3.5C2 2.67157 2.67157 2 3.5 2H14.5L23 10.5V26.5C23 27.3284 22.3284 28 21.5 28H3.5C2.67157 28 2 27.3284 2 26.5V3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M14.5 2V9.5C14.5 10.0523 14.9477 10.5 15.5 10.5H23" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    ${label ? `<text x="12.5" y="21" text-anchor="middle" font-size="6.5" font-weight="700" letter-spacing="0.2" font-family="inherit" fill="currentColor">${label}</text>` : ''}
  </svg>`;
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

function titleOf(doc, lang) {
  return pick(doc.titulo, lang) || 'Documento';
}

// CVM-imported documents carry their real filing date in data_publicacao —
// created_at is just when the row was inserted (import time), which would
// show "today" for a document the CVM published months or years ago.
function dateOf(doc) {
  return doc.data_publicacao ?? doc.created_at;
}

// Each locale can have its own independent file/link (doc.arquivos), falling
// back to the row's legacy flat file_path/external_link for documents saved
// before per-locale files existed, or when this locale simply has nothing
// of its own — the primary language's file is a reasonable default rather
// than showing no document at all.
function fileOf(doc, lang, primaryLang) {
  const entry = doc.arquivos?.[lang] ?? doc.arquivos?.[primaryLang];
  return {
    filePath: entry?.filePath ?? doc.file_path,
    externalLink: entry?.externalLink ?? doc.external_link,
  };
}

function yearOf(doc) {
  const d = dateOf(doc);
  return d ? new Date(d).getFullYear() : null;
}

// Groups by the CMS-configured sub-grupo for this page (e.g. "Fatos Relevantes"),
// falling back to the document's creation year.
function groupLabel(doc, pageId) {
  const subs = doc.sub_group_ids?.[pageId];
  if (Array.isArray(subs) && subs.length > 0) return subs[0];
  const year = yearOf(doc);
  return year ? String(year) : 'Documentos';
}

// A document marked "Apenas Português" in the CMS uses the same file for
// every idioma — this caption only makes sense to a visitor NOT reading the
// primary (Portuguese) locale already; showing it on the pt-BR site itself
// would be telling a Portuguese speaker "this is in Portuguese", which is
// meaningless noise for them.
function ptOnlyCaptionHtml(d, lang, primaryLang) {
  return d.pt_only && lang !== primaryLang ? ` <span class="doc-list__pt-only">(Portuguese only)</span>` : '';
}

function docItemHtml(d, sb, lang, primaryLang) {
  const file = fileOf(d, lang, primaryLang);
  const href = file.externalLink || fileUrl(sb, file.filePath);
  const title = titleOf(d, lang);
  return `<li class="doc-list__item">
    <div class="doc-list__info">
      <span class="doc-list__date">${formatDate(dateOf(d))}</span>
      <span class="doc-list__sep" aria-hidden="true">—</span>
      <a href="${href}" class="doc-list__title doc-list__title-link" target="_blank" rel="noopener">${title}</a>${ptOnlyCaptionHtml(d, lang, primaryLang)}
    </div>
    <div class="doc-list__actions">
      <a href="${href}" class="doc-list__link doc-list__icon" aria-label="Baixar ${title}" target="_blank" rel="noopener">
        ${fileBadgeSvg(file.filePath ?? file.externalLink ?? '', !!file.externalLink)}
      </a>
    </div>
  </li>`;
}

function tableRowHtml(d, sb, lang, primaryLang) {
  const file = fileOf(d, lang, primaryLang);
  const href = file.externalLink || fileUrl(sb, file.filePath);
  const title = titleOf(d, lang);
  return `<tr class="doc-table__row">
    <td class="doc-table__cell doc-table__cell--date">${formatDate(dateOf(d))}</td>
    <td class="doc-table__cell doc-table__cell--name">
      <a href="${href}" class="doc-table__title-link" target="_blank" rel="noopener">${title}</a>${ptOnlyCaptionHtml(d, lang, primaryLang)}
    </td>
    <td class="doc-table__cell doc-table__cell--action">
      <a href="${href}" class="doc-list__link doc-list__icon" aria-label="Baixar ${title}" target="_blank" rel="noopener">
        ${fileBadgeSvg(file.filePath ?? file.externalLink ?? '', !!file.externalLink)}
      </a>
    </td>
  </tr>`;
}

// A portal can accumulate hundreds of documents (Auto CVM imports whole
// years of filings at once) — showing them all in one page load makes the
// list unusably long, so every list/table view paginates client-side.
const PAGE_SIZE = 20;

function loadMoreHtml(key, total, shown) {
  if (shown >= total) return '';
  return `<div class="doc-list__loadmore">
    <button type="button" class="btn btn--outline btn--sm doc-list__loadmore-btn" data-loadmore="${key}">
      Carregar mais (${shown}/${total})
    </button>
  </div>`;
}

// Tabela pageType — same documents as lista/lista-agrupada, laid out as rows
// instead of a list or accordion. Content is identical either way; only the
// presentation changes.
function renderTable(list, sb, lang, primaryLang, visibleCounts) {
  if (!list.length) return `<p class="docs-vazio">${t('nenhumDocumento', lang)}</p>`;
  const shown = Math.min(visibleCounts.tabela ?? PAGE_SIZE, list.length);
  const slice = list.slice(0, shown);
  return `<div class="doc-table-wrap">
    <table class="doc-table">
      <thead>
        <tr>
          <th class="doc-table__cell">${t('colData', lang)}</th>
          <th class="doc-table__cell">${t('colDocumento', lang)}</th>
          <th class="doc-table__cell"></th>
        </tr>
      </thead>
      <tbody>
        ${slice.map(d => tableRowHtml(d, sb, lang, primaryLang)).join('')}
      </tbody>
    </table>
  </div>${loadMoreHtml('tabela', list.length, shown)}`;
}

function renderFlatList(list, sb, lang, primaryLang, visibleCounts) {
  if (!list.length) return `<p class="docs-vazio">${t('nenhumDocumento', lang)}</p>`;
  const shown = Math.min(visibleCounts.flat ?? PAGE_SIZE, list.length);
  const slice = list.slice(0, shown);
  return `<ul class="doc-list" role="list">${slice.map(d => docItemHtml(d, sb, lang, primaryLang)).join('')}</ul>${loadMoreHtml('flat', list.length, shown)}`;
}

// A marker restricted to specific empresas (Marcador.empresaIds — set
// automatically by Auto CVM to whichever empresa's sync created/used it, or
// by hand when an admin fills a separate marker list per empresa in Canais)
// only counts as a valid group while that empresa is the active filter.
// Unset (every marker created before this field existed, and every marker
// in a single-empresa portal) always counts — nothing to migrate.
function markerVisible(m, empresaId) {
  return !m.empresaIds?.length || !empresaId || m.empresaIds.includes(empresaId);
}

// listaAgrupadaStyle === 'secao' (set via Canais → Editar canal/página →
// Lista Agrupada → Estilo de agrupamento) renders the same grouped data as
// plain, always-open headed sections instead of a collapsible accordion —
// no trigger/chevron, no bindAccordion wiring needed for this branch.
// A group with sub-marcadores (g.children) renders its own direct docs (if
// any were tagged straight to the parent) followed by one nested <section>
// per child — always-open like the parent, just a smaller heading and a
// left indent, no extra JS state needed either.
function renderSectionedList(groups, sb, lang, primaryLang, visibleCounts) {
  return groups.map(g => {
    const key = `group:${g.label}`;
    const shown = Math.min(visibleCounts[key] ?? PAGE_SIZE, g.docs.length);
    const slice = g.docs.slice(0, shown);
    const childrenHtml = (g.children ?? []).map(c => {
      const childKey = `group:${g.label}:${c.label}`;
      const childShown = Math.min(visibleCounts[childKey] ?? PAGE_SIZE, c.docs.length);
      const childSlice = c.docs.slice(0, childShown);
      return `
      <div class="la-section la-section--nested">
        <h4 class="la-section__title la-section__title--sub">${c.label}</h4>
        <ul class="doc-list" role="list">${childSlice.map(d => docItemHtml(d, sb, lang, primaryLang)).join('')}</ul>
        ${loadMoreHtml(childKey, c.docs.length, childShown)}
      </div>`;
    }).join('');
    return `
    <div class="la-section">
      <h3 class="la-section__title">${g.label}</h3>
      ${g.docs.length > 0 ? `<ul class="doc-list" role="list">${slice.map(d => docItemHtml(d, sb, lang, primaryLang)).join('')}</ul>
      ${loadMoreHtml(key, g.docs.length, shown)}` : ''}
      ${childrenHtml}
    </div>`;
  }).join('');
}

// Builds the accordion/section groups in the order an admin defined in
// Canais → Editar → Lista Agrupada (entry.listaAgrupadaCategories), using
// each marker's CURRENT label as the section title — instead of deriving
// order/labels purely from whichever document happens to be newest, which
// never reflected a reorder or rename made in the admin. A document matches
// a marker by either its id or its current label (a marker's id equals its
// original label for anything tagged before markers became id-based, and a
// freshly tagged document's sub_group_ids value is always the marker's
// label at tagging time) — anything that matches neither (an orphaned/
// deleted marker) still gets its own trailing group instead of being
// dropped, same as before this existed.
//
// One level of sub-marcador (Marcador.children) is supported: sub_group_ids
// index 1, when present, is the child marker's id/label — index 0 alone
// (every document tagged before sub-marcadores existed) still resolves at
// the top level exactly as before. `empresaId` (the active empresa
// filter, if any) drops markers scoped to a different empresa from the
// group list entirely — a marker only Auto CVM's empresa A sync ever used
// must not show up as an empty group while viewing empresa B's tab.
function groupsFromMarkers(list, pageId, markers, empresaId) {
  const ordered = markers.filter(m => markerVisible(m, empresaId)).map(m => ({
    id: m.id, label: m.label, docs: [],
    children: (m.children ?? []).filter(c => markerVisible(c, empresaId)).map(c => ({ id: c.id, label: c.label, docs: [] })),
  }));
  const byKey = new Map();
  const childByKey = new Map();
  for (const g of ordered) {
    byKey.set(g.id, g);
    byKey.set(g.label, g);
    for (const c of g.children) {
      childByKey.set(c.id, c);
      childByKey.set(c.label, c);
    }
  }
  const leftover = [];
  for (const d of list) {
    const subs = d.sub_group_ids?.[pageId];
    const rawParent = Array.isArray(subs) && subs.length > 0 ? subs[0] : null;
    const rawChild = Array.isArray(subs) && subs.length > 1 ? subs[1] : null;
    const childMatch = rawChild ? childByKey.get(rawChild) : null;
    if (childMatch) { childMatch.docs.push(d); continue; }
    const match = rawParent ? byKey.get(rawParent) : null;
    if (match) { match.docs.push(d); continue; }
    const label = rawParent ?? (yearOf(d) ? String(yearOf(d)) : 'Documentos');
    let g = leftover.find(g => g.label === label);
    if (!g) { g = { id: null, label, docs: [], children: [] }; leftover.push(g); }
    g.docs.push(d);
  }
  const totalDocs = g => g.docs.length + g.children.reduce((n, c) => n + c.docs.length, 0);
  return [...ordered.filter(g => totalDocs(g) > 0), ...leftover]
    .map(g => ({ ...g, children: g.children.filter(c => c.docs.length > 0) }));
}

function renderGroupedList(list, pageId, sb, lang, primaryLang, visibleCounts, style, markers, empresaId) {
  if (!list.length) return `<p class="docs-vazio">${t('nenhumDocumento', lang)}</p>`;
  let groups;
  if (Array.isArray(markers) && markers.length > 0) {
    groups = groupsFromMarkers(list, pageId, markers, empresaId);
  } else {
    // No marker list published for this page (older portal pending a
    // republish, or a page with no markers configured yet) — fall back to
    // the original first-seen-label grouping.
    groups = [];
    for (const d of list) {
      const label = groupLabel(d, pageId);
      let g = groups.find(g => g.label === label);
      if (!g) { g = { label, docs: [], children: [] }; groups.push(g); }
      g.docs.push(d);
    }
  }
  if (style === 'secao') {
    return `<div class="la-sections">${renderSectionedList(groups, sb, lang, primaryLang, visibleCounts)}</div>`;
  }
  // No "Carregar mais" here, unlike the other list styles below — an
  // accordion item is already collapsed by default, so there's no need to
  // additionally paginate what's inside it once it's opened. Every doc in
  // the group renders; visibleCounts/PAGE_SIZE only apply to flat/tabela/
  // secao, where everything is visible at once and needs its own limit.
  //
  // A group with sub-marcadores nests a second <div class="accordion"> right
  // inside its own .accordion__body — accordion.js already scopes sibling-
  // closing to the nearest .accordion ancestor (`closest('.accordion')`), so
  // opening a child accordion item never closes/interferes with its parent
  // or any other top-level group, with no change needed there.
  const accordionItemHtml = (g, nested) => `
    <div class="accordion__item${nested ? ' accordion__item--nested' : ''}" data-accordion-item>
      <button class="accordion__trigger${nested ? ' accordion__trigger--nested' : ''}" type="button" aria-expanded="false">
        <span class="accordion__label">${g.label}</span>
        <span class="accordion__icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>
      <div class="accordion__body">
        ${g.docs.length > 0 ? `<ul class="doc-list" role="list">${g.docs.map(d => docItemHtml(d, sb, lang, primaryLang)).join('')}</ul>` : ''}
        ${(g.children ?? []).length > 0 ? `<div class="accordion accordion--nested" data-accordion>${g.children.map(c => accordionItemHtml(c, true)).join('')}</div>` : ''}
      </div>
    </div>`;
  const groupHtml = groups.map(g => accordionItemHtml(g, false)).join('');
  return `<div class="accordion" data-accordion>${groupHtml}</div>`;
}

/**
 * Renders the full documentos UI (filters + optional empresa tabs/select +
 * flat or grouped list) into container, and wires up client-side filtering
 * (no refetch — all published docs for the page are already in memory).
 */
function renderDocumentos(entry, docs, container, sb, siteConfig) {
  const pageId = entry.id;
  const listType = entry.pageType === 'lista' || entry.pageType === 'tabela' ? entry.pageType : 'lista-agrupada';
  const empresas = siteConfig.empresas ?? [];
  const variant = siteConfig.header?.variant ?? 'sidebar';
  const lang = getLang(siteConfig);
  const primaryLang = siteConfig.languages?.[0] ?? 'pt-BR';
  const showEmpresaTabs = empresas.length > 1 && variant !== 'tabmenu';
  const showEmpresaFilter = empresas.length > 1 && variant === 'tabmenu';

  const years = [...new Set(docs.map(yearOf).filter(Boolean))].sort((a, b) => b - a);

  // With more than one empresa, documents must never mix between companies
  // in the same view — default to the principal (first) empresa rather than
  // an "all companies" state, for both the tab and select UIs. Likewise,
  // opening straight to "todos os anos" dumped every document ever
  // published onto the page at once — defaulting to the most recent year
  // (years is already sorted desc) keeps the initial view short; older
  // years are still one filter click away.
  const filters = {
    ano: years.length > 0 ? String(years[0]) : '',
    empresa: empresas.length > 1 ? (empresas[0]?.id ?? '') : '',
  };

  function passesFilters(d) {
    if (filters.ano && String(yearOf(d)) !== filters.ano) return false;
    if (filters.empresa && d.entity_id !== filters.empresa) return false;
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
        type="button" role="tab" data-doc-empresa-tab="${e.id}"
        aria-selected="${e.id === filters.empresa}">${e.label}</button>`).join('');
    return `<nav class="tab-menu__nav" data-doc-empresa-tabs role="tablist" aria-label="Selecionar empresa">${tabs}</nav>`;
  }

  // Reset whenever a filter changes (a new filtered set starts back at page
  // one); preserved across a "load more" click, which re-renders without
  // resetting so earlier pages stay expanded.
  let visibleCounts = {};

  function render(resetPaging = true) {
    if (resetPaging) visibleCounts = {};
    const filtered = docs.filter(passesFilters);
    const body = listType === 'lista' ? renderFlatList(filtered, sb, lang, primaryLang, visibleCounts)
      : listType === 'tabela' ? renderTable(filtered, sb, lang, primaryLang, visibleCounts)
      : renderGroupedList(filtered, pageId, sb, lang, primaryLang, visibleCounts, entry.listaAgrupadaStyle, entry.listaAgrupadaCategories, filters.empresa);
    container.innerHTML = `${controlsHtml()}${empresaTabsHtml()}<div data-doc-content>${body}</div>`;
    bind();
  }

  function bind() {
    initFilterSelects(container, (id, value) => {
      if (id === 'ano') filters.ano = value;
      if (id === 'empresa') filters.empresa = value;
      render();
    });
    container.querySelectorAll('[data-doc-empresa-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        filters.empresa = tab.dataset.docEmpresaTab;
        render();
      });
    });
    container.querySelectorAll('[data-loadmore]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.loadmore;
        visibleCounts[key] = (visibleCounts[key] ?? PAGE_SIZE) + PAGE_SIZE;
        render(false);
      });
    });
    // Accordion open/close is handled by scripts/accordion.js's single
    // document-level delegated listener — it already matches the exact
    // .accordion__trigger/.accordion__item classes rendered here, so no
    // per-page binding is needed. A second, directly-bound listener used to
    // live here (bindAccordion) and fired on the SAME click as the delegated
    // one: it would open the clicked item, then accordion.js's listener ran
    // right after (bubbling) and read the class it had just set as "already
    // open", closing it again — the item never stayed open.
  }

  render();
}

/**
 * Fetches published documents for a given page and renders them into
 * container. Shared by initDocumentos (single-page) and the sidebar/tabmenu
 * inline panel loaders (one page's worth of documents per channel, loaded
 * on demand without navigating away).
 *
 * `pageEntry` is the channel's nav entry ({ id, pageType, ... }); a bare
 * string pageId is also accepted for backwards compatibility.
 */
export async function loadDocumentosInto(pageEntry, container, sb, siteConfig = {}) {
  const entry = typeof pageEntry === 'string' ? { id: pageEntry } : pageEntry;
  const pageId = entry?.id;
  if (!pageId || !container) return false;
  if (!sb?.url || !sb?.anonKey || !sb?.portalId) return false;

  try {
    const containsFilter = `cs.%7B${encodeURIComponent(pageId)}%7D`;
    const url = `${sb.url}/rest/v1/portal_documents?portal_id=eq.${encodeURIComponent(sb.portalId)}&pagina_ids=${containsFilter}&status=eq.Publicado&order=created_at.desc`;
    const res = await fetchWithPreview(sb, url, 'documentos', `&pageId=${encodeURIComponent(pageId)}`);
    if (!res.ok) return false;
    const docs = await res.json();
    if (!Array.isArray(docs) || docs.length === 0) return false;

    // The query already orders by created_at, but CVM-imported documents
    // need to sort by their real filing date (data_publicacao) instead —
    // otherwise an old document imported today would jump to the top.
    docs.sort((a, b) => new Date(dateOf(b) ?? 0) - new Date(dateOf(a) ?? 0));

    renderDocumentos(entry, docs, container, sb, siteConfig ?? {});
    container.classList.add('documentos--loaded');
    container.parentElement?.querySelector('.page-empty, .em-construcao')?.remove();
    return true;
  } catch {
    return false;
  }
}

export async function initDocumentos(siteConfig, alreadyRendered) {
  if (alreadyRendered) return true;
  const sb = siteConfig?.supabase;
  const entry = resolvePageEntry(siteConfig.nav);
  const container = document.querySelector('[data-materias]');
  return loadDocumentosInto(entry, container, sb, siteConfig);
}
