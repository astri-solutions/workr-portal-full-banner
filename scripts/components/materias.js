// scripts/components/materias.js
// Fetches published matérias from Supabase and renders them into the current page.
import { fetchWithPreview } from './preview.js';
import { initTimelines } from './timeline.js';
import { observeReveals } from '../reveal.js';
import { initCounters } from '../counter.js';
import { getLang } from '../lib/i18n.js';
import './contentTabs.js';

/**
 * Determines the current pageId by matching the current URL against siteConfig.nav.
 * Returns undefined if no match is found.
 */
function resolvePageId(nav) {
  const path = location.pathname.replace(/\/$/, '') || '/';
  for (const canal of nav ?? []) {
    if (canal.href && (path === canal.href.replace(/\.html$/, '') || path + '.html' === canal.href || path === canal.href)) {
      return canal.id;
    }
    for (const sub of canal.children ?? []) {
      if (sub.href && (path === sub.href.replace(/\.html$/, '') || path + '.html' === sub.href || path === sub.href)) {
        return sub.id;
      }
    }
  }
  return undefined;
}

// Rich-text block fields (html/html2/html3) are per-locale objects saved by
// NovaMateriaPage's LangTabs editor — `string` is only the legacy shape
// (every matéria saved before locales were tracked), which shows the same
// content regardless of the visitor's chosen language.
function htmlFor(field, lang, primaryLang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] ?? field[primaryLang] ?? '';
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderGaleriaCards(cards) {
  if (!Array.isArray(cards) || cards.length === 0) return '';
  return `<div class="materia-block materia-block--galeria">
    ${cards.map(c => {
      const inner = c.link && c.link.startsWith('http') ? 'target="_blank" rel="noreferrer"' : '';
      const body = `
        ${c.imageUrl ? `<div class="materia-galeria-card__img"><img src="${c.imageUrl}" alt="" loading="lazy" /></div>` : ''}
        <div class="materia-galeria-card__body">
          ${c.titulo ? `<h3 class="materia-galeria-card__title">${esc(c.titulo)}</h3>` : ''}
          ${c.descricao ? `<p class="materia-galeria-card__desc">${esc(c.descricao)}</p>` : ''}
          ${c.data ? `<time class="materia-galeria-card__date">${esc(c.data)}</time>` : ''}
        </div>`;
      return c.link
        ? `<a class="materia-galeria-card" href="${c.link}" ${inner}>${body}</a>`
        : `<div class="materia-galeria-card">${body}</div>`;
    }).join('')}
  </div>`;
}

// Números / indicadores. `data-counter` faz counter.js animar a contagem;
// se o valor não for parseável (ex.: "1.234.567"), ele simplesmente fica
// estático — nada quebra.
function renderKpis(items) {
  const list = Array.isArray(items) ? items.filter(i => i.valor || i.rotulo) : [];
  if (list.length === 0) return '';
  return `<div class="materia-block materia-kpis">
    ${list.map(i => {
      // "-3,2%" desce, qualquer outra coisa sobe — só afeta a cor.
      const dir = String(i.variacao ?? '').trim().startsWith('-') ? 'down' : 'up';
      return `<div class="materia-kpi">
        <span class="materia-kpi__value" data-counter>${esc(i.valor)}</span>
        ${i.rotulo ? `<span class="materia-kpi__label">${esc(i.rotulo)}</span>` : ''}
        ${i.variacao ? `<span class="materia-kpi__delta materia-kpi__delta--${dir}">${esc(i.variacao)}</span>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

// Reaproveita as classes .accordion já existentes no template (e o
// accordion.js, que agora usa delegação e por isso pega estes itens
// injetados depois do load).
function renderAccordion(items) {
  const list = Array.isArray(items) ? items.filter(i => i.pergunta) : [];
  if (list.length === 0) return '';
  return `<div class="materia-block accordion">
    ${list.map(i => `
      <div class="accordion__item">
        <button class="accordion__trigger" type="button" aria-expanded="false">
          <span>${esc(i.pergunta)}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="accordion__body">${i.resposta ?? ''}</div>
      </div>`).join('')}
  </div>`;
}

function renderTabs(items) {
  const list = Array.isArray(items) ? items.filter(i => i.titulo || i.html) : [];
  if (list.length === 0) return '';
  return `<div class="materia-block materia-tabs" data-materia-tabs>
    <div class="materia-tabs__nav" role="tablist">
      ${list.map((i, idx) => `
        <button class="materia-tabs__tab${idx === 0 ? ' is-active' : ''}" type="button" role="tab"
                aria-selected="${idx === 0}" data-tab-index="${idx}">${esc(i.titulo || `Aba ${idx + 1}`)}</button>`).join('')}
    </div>
    <div class="materia-tabs__panels">
      ${list.map((i, idx) => `
        <div class="materia-tabs__panel${idx === 0 ? ' is-active' : ''}" role="tabpanel" data-tab-panel="${idx}">${i.html ?? ''}</div>`).join('')}
    </div>
  </div>`;
}

function renderPessoas(items) {
  const list = Array.isArray(items) ? items.filter(i => i.nome) : [];
  if (list.length === 0) return '';
  return `<div class="materia-block materia-pessoas">
    ${list.map(p => `
      <div class="materia-pessoa">
        <div class="materia-pessoa__photo">
          ${p.imageUrl
            ? `<img src="${p.imageUrl}" alt="${esc(p.nome)}" loading="lazy" />`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`}
        </div>
        <h3 class="materia-pessoa__nome">${esc(p.nome)}</h3>
        ${p.cargo ? `<span class="materia-pessoa__cargo">${esc(p.cargo)}</span>` : ''}
        ${p.bio ? `<p class="materia-pessoa__bio">${esc(p.bio)}</p>` : ''}
      </div>`).join('')}
  </div>`;
}

// Linha do tempo — items: { ano, titulo, descricao, imageUrl }[]. Vertical
// only for now (orientation === 'horizontal' falls back to vertical until
// the horizontal layout ships); scroll-driven fill/active-year animation is
// wired up client-side by scripts/components/timeline.js.
function renderTimeline(block) {
  const items = Array.isArray(block.items) ? block.items : [];
  if (items.length === 0) return '';
  const orientation = block.orientation === 'horizontal' ? 'horizontal' : 'vertical';
  return `<div class="materia-block timeline timeline--${orientation}" data-timeline>
    <div class="timeline__track"><div class="timeline__track-fill" data-timeline-fill></div></div>
    <div class="timeline__items">
      ${items.map(it => `
        <div class="timeline__item" data-timeline-item>
          <div class="timeline__media">${it.imageUrl ? `<img src="${it.imageUrl}" alt="" loading="lazy" />` : ''}</div>
          <div class="timeline__marker"><span class="timeline__year">${esc(it.ano)}</span></div>
          <div class="timeline__content">
            ${it.titulo ? `<h3 class="timeline__title">${esc(it.titulo)}</h3>` : ''}
            ${it.descricao ? `<p class="timeline__desc">${esc(it.descricao)}</p>` : ''}
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}

// Renders one authored section from NovaMateriaPage's section editor. Kept
// in sync with `ContentSection` there — `html`/`html2`/`html3` are the rich
// text editor's HTML, `imageUrl`/`imageAlt` a Storage-hosted image, `cards`
// the gallery-card list. Also understands the older flat block shape
// (paragraph/heading/image/quote/divider) for forward compatibility.
// Só hex é aceito. O valor vem do banco e entra num atributo style, então
// qualquer coisa fora desse formato é descartada em vez de injetada como CSS.
function safeColor(value) {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value ?? '').trim()) ? value.trim() : null;
}

// Cores são opcionais e por seção: sem elas o bloco herda o tema do portal
// e nem sequer ganha um wrapper. Com fundo, o bloco vira uma Section cheia
// (faixa full-bleed, como .page-section) em vez de um cartão dentro do
// container da página — por isso o wrapper externo (full-bleed, cor de
// fundo) e o __inner (largura de leitura normal, cor de texto) são
// elementos diferentes; sem fundo, cor de texto sozinha não precisa de
// nenhuma faixa, só herda no próprio bloco.
function renderBlock(block, lang, primaryLang) {
  const html = renderBlockInner(block, lang, primaryLang);
  if (!html) return '';
  const bg = safeColor(block.bgColor);
  const fg = safeColor(block.textColor);
  if (!bg && !fg) return html;
  if (!bg) {
    return `<div class="materia-block-tint" style="color:${fg}">${html}</div>`;
  }
  const innerStyle = fg ? ` style="color:${fg}"` : '';
  return `<div class="materia-block-tint materia-block-tint--filled" style="background:${bg}">
    <div class="materia-block-tint__inner"${innerStyle}>${html}</div>
  </div>`;
}

function renderBlockInner(block, lang, primaryLang) {
  const type = block.type;
  if (type === 'text') {
    // Optional simple image (Tabs de conteúdo / Sidebar only, from the CMS
    // side) — stacked BELOW the text, full width, unlike image-text/
    // text-image's side-by-side layout.
    const img = block.imageUrl ? `<img class="materia-block__text-image" src="${block.imageUrl}" alt="${esc(block.imageAlt ?? '')}" loading="lazy" />` : '';
    return `<div class="materia-block materia-block--text">${htmlFor(block.html, lang, primaryLang) || block.content || ''}${img}</div>`;
  }
  if (type === 'paragraph') {
    return `<p class="materia-block materia-block--text">${block.content ?? ''}</p>`;
  }
  if (type === 'heading') {
    const level = block.level ?? 2;
    return `<h${level} class="materia-block materia-block--heading">${block.content ?? ''}</h${level}>`;
  }
  // Same markup for both; only the CSS modifier differs, so the mirrored
  // variant can't drift out of sync with the original.
  if (type === 'image-text' || type === 'text-image') {
    return `<div class="materia-block materia-block--${type}">
      <div class="materia-block__media">${block.imageUrl ? `<img src="${block.imageUrl}" alt="${esc(block.imageAlt ?? '')}" loading="lazy" />` : ''}</div>
      <div class="materia-block__content">${htmlFor(block.html, lang, primaryLang)}</div>
    </div>`;
  }
  if (type === 'bg-image') {
    return `<div class="materia-block materia-block--bg-image" style="background-image:url('${block.imageUrl ?? ''}')">
      <div class="materia-block__overlay">${htmlFor(block.html, lang, primaryLang)}</div>
    </div>`;
  }
  if (type === 'two-col' || type === 'three-col') {
    const cols = [block.html, block.html2, type === 'three-col' ? block.html3 : null]
      .filter(c => c != null)
      .map(c => htmlFor(c, lang, primaryLang));
    return `<div class="materia-block materia-block--cols materia-block--cols-${cols.length}">
      ${cols.map(c => `<div class="materia-block__col">${c ?? ''}</div>`).join('')}
    </div>`;
  }
  if (type === 'image') {
    return `<figure class="materia-block materia-block--image">
      ${block.imageUrl ? `<img src="${block.imageUrl}" alt="${esc(block.imageAlt ?? block.alt ?? '')}" loading="lazy" />` : `<img src="${block.src ?? ''}" alt="${esc(block.alt ?? '')}" loading="lazy" />`}
      ${block.caption ? `<figcaption>${block.caption}</figcaption>` : ''}
    </figure>`;
  }
  if (type === 'image-full') {
    return `<figure class="materia-block materia-block--image-full">
      <img src="${block.imageUrl ?? ''}" alt="${esc(block.imageAlt ?? '')}" loading="lazy" />
    </figure>`;
  }
  if (type === 'galeria') {
    return renderGaleriaCards(block.cards);
  }
  if (type === 'timeline') {
    return renderTimeline({ items: block.timelineItems, orientation: block.timelineOrientation });
  }
  if (type === 'kpis') return renderKpis(block.kpiItems);
  if (type === 'accordion') return renderAccordion(block.accordionItems);
  if (type === 'tabs') return renderTabs(block.tabItems);
  if (type === 'pessoas') return renderPessoas(block.pessoaItems);
  if (type === 'quote') {
    return `<blockquote class="materia-block materia-block--quote">${block.content ?? ''}</blockquote>`;
  }
  if (type === 'divider') {
    return `<hr class="materia-block materia-block--divider" />`;
  }
  return '';
}

// Keys match FormField['type'] from apps/web-admin NovoFormularioPage.tsx
const FIELD_INPUT = {
  text:     (f) => `<input type="text" name="${f.id}" placeholder="${f.placeholder ?? ''}" ${f.required ? 'required' : ''} />`,
  email:    (f) => `<input type="email" name="${f.id}" placeholder="${f.placeholder ?? ''}" ${f.required ? 'required' : ''} />`,
  phone:    (f) => `<input type="tel" name="${f.id}" placeholder="${f.placeholder ?? ''}" ${f.required ? 'required' : ''} />`,
  textarea: (f) => `<textarea name="${f.id}" rows="5" placeholder="${f.placeholder ?? ''}" ${f.required ? 'required' : ''}></textarea>`,
  company:  (f) => `<input type="text" name="${f.id}" placeholder="${f.placeholder ?? ''}" ${f.required ? 'required' : ''} />`,
  date:     (f) => `<input type="date" name="${f.id}" ${f.required ? 'required' : ''} />`,
  checkbox: (f) => `<input type="checkbox" name="${f.id}" ${f.required ? 'required' : ''} />`,
};

function renderFieldInput(f) {
  const key = (f.type ?? '').toLowerCase();
  // 'subject' and 'select' render as <select> whenever options are configured
  const opts = String(f.options ?? '').split(',').map(o => o.trim()).filter(Boolean);
  if ((key === 'subject' || key === 'select') && opts.length > 0) {
    return `<select name="${f.id}" ${f.required ? 'required' : ''}>
      <option value="" disabled selected>Selecionar…</option>
      ${opts.map(o => `<option value="${o}">${o}</option>`).join('')}
    </select>`;
  }
  if (FIELD_INPUT[key]) return FIELD_INPUT[key](f);
  return `<input type="text" name="${f.id}" placeholder="${f.placeholder ?? ''}" ${f.required ? 'required' : ''} />`;
}

function renderInfoCard(infoCard) {
  if (!infoCard?.enabled) return '';
  const paragrafos = String(infoCard.corpo ?? '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p class="materia-info-card__text">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `<aside class="materia-info-card">
    ${infoCard.titulo ? `<h3 class="materia-info-card__title">${infoCard.titulo}</h3>` : ''}
    ${paragrafos}
  </aside>`;
}

function renderFormulario(m) {
  const cfg = m.content ?? {};
  const fields = Array.isArray(cfg.fields) ? cfg.fields : [];
  const hasRequired = fields.some(f => f.required);
  const fieldsHtml = fields.map(f => `
    <label class="materia-form__field">
      <span class="materia-form__label">${f.label ?? ''}${f.required ? ' *' : ''}</span>
      ${renderFieldInput(f)}
    </label>`).join('');

  const formHtml = `<div class="materia-card materia-card--form">
    ${m.titulo ? `<h2 class="materia-card__title">${m.titulo}</h2>` : ''}
    ${m.subtitulo ? `<p class="materia-card__subtitle">${m.subtitulo}</p>` : ''}
    <form class="materia-form" data-materia-form data-materia-id="${m.id}" novalidate>
      ${fieldsHtml}
      ${hasRequired ? `<p class="materia-form__hint">Todos os campos com (*) são obrigatórios</p>` : ''}
      <div class="materia-form__actions">
        <button class="btn btn--outline" type="reset">Limpar</button>
        <button class="btn btn--primary" type="submit">${cfg.submitLabel ?? 'Enviar'}</button>
      </div>
      <div class="materia-form__error" data-form-error aria-live="polite"></div>
      <div class="materia-form__success" data-form-success aria-live="polite">${cfg.successMessage ?? 'Mensagem enviada com sucesso!'}</div>
    </form>
  </div>`;

  const infoCardHtml = renderInfoCard(cfg.infoCard);
  if (!infoCardHtml) {
    return `<article class="materia-card--form-wrap" id="materia-${m.id}">${formHtml}</article>`;
  }
  return `<article class="materia-form-layout" id="materia-${m.id}">
    ${formHtml}
    ${infoCardHtml}
  </article>`;
}

function bindForms(container, sb) {
  container.querySelectorAll('[data-materia-form]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;

      const errorEl = form.querySelector('[data-form-error]');
      const successEl = form.querySelector('[data-form-success]');
      errorEl?.classList.remove('is-visible');
      successEl?.classList.remove('is-visible');

      const values = {};
      new FormData(form).forEach((v, k) => { values[k] = String(v); });

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalLabel = submitBtn?.textContent;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando…'; }

      try {
        const res = await fetch(`${sb.url}/functions/v1/submit-form`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': sb.anonKey },
          body: JSON.stringify({ portalId: sb.portalId, materiaId: form.dataset.materiaId, values }),
        });
        if (!res.ok) throw new Error('submit failed');
        successEl?.classList.add('is-visible');
        form.reset();
      } catch {
        if (errorEl) {
          errorEl.textContent = 'Não foi possível enviar agora. Tente novamente em instantes.';
          errorEl.classList.add('is-visible');
        }
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      }
    });
  });
}

// Tabela — content is { headers: string[], rows: { id, cells: {value}[] }[] }
// (NovaMateriaPage's TabelaEditor shape), rendered as a plain data table.
function renderTabela(m) {
  const cfg = m.content ?? {};
  const headers = Array.isArray(cfg.headers) ? cfg.headers : [];
  const rows = Array.isArray(cfg.rows) ? cfg.rows : [];
  return `<article class="materia-card materia-card--tabela" id="materia-${m.id}">
    <div class="materia-card__body">
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map(r => `<tr>${(r.cells ?? []).map(c => `<td>${esc(c.value)}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </article>`;
}

function renderMateria(m, lang, primaryLang) {
  if (m.content && !Array.isArray(m.content) && typeof m.content === 'object') {
    if (m.content.kind === 'formulario') return renderFormulario(m);
    if (Array.isArray(m.content.headers) || Array.isArray(m.content.rows)) return renderTabela(m);
  }
  // HTML type — content is a raw HTML string authored directly in the CMS,
  // meant to be self-contained (its own headings/classes), so it's injected
  // verbatim rather than wrapped in the materia-card title/subtitle chrome.
  if (typeof m.content === 'string') {
    return `<div id="materia-${m.id}">${m.content}</div>`;
  }
  // No title/subtitle/date header: the page's own name (rendered as the h1
  // in the header banner) is the heading, and everything else comes from
  // the authored blocks. The matéria's `titulo` is just its name in the
  // CMS listing, not something the visitor should see repeated here.
  const blocks = Array.isArray(m.content) ? m.content : [];
  const body = blocks.map(b => renderBlock(b, lang, primaryLang)).join('');

  return `<article class="materia-card" id="materia-${m.id}">
    <div class="materia-card__body">${body}</div>
  </article>`;
}

// Placeholder content shown ONLY when this deploy has no real portal wired
// up (siteConfig.supabase.portalId is empty) — i.e. the cliente-workr-lite
// template's own preview/test deployment, never an actual client portal.
// Every portal generated by the CMS always gets a real portalId injected
// into its own site.config.js at provisioning/publish time, so this branch
// is structurally unreachable for real client sites.
function renderDemoMateria() {
  return `<article class="materia-card">
    <header class="materia-card__header">
      <h2 class="materia-card__title">Conteúdo de exemplo</h2>
      <p class="materia-card__subtitle">Este é um texto fictício usado apenas para visualização do template — nenhum portal real exibe este conteúdo.</p>
      <time class="materia-card__date">01/01/2026</time>
    </header>
    <div class="materia-card__body">
      <p class="materia-block materia-block--text">
        Quando este canal for publicado por um portal real, o conteúdo cadastrado via CMS aparecerá aqui no lugar deste texto de exemplo.
      </p>
    </div>
  </article>`;
}

/**
 * Fetches published matérias for a given pageId and renders them into
 * container. Shared by initMaterias (single-page) and the sidebar/tabmenu
 * inline panel loaders (one page's worth of matérias per channel, loaded
 * on demand without navigating away).
 */
export async function loadMateriasInto(pageId, container, sb, siteConfig) {
  if (!pageId || !container) return false;

  const lang = getLang(siteConfig);
  const primaryLang = siteConfig?.languages?.[0] ?? 'pt-BR';

  if (!sb?.url || !sb?.anonKey || !sb?.portalId) {
    container.innerHTML = renderDemoMateria();
    container.classList.add('materias--loaded');
    container.parentElement?.querySelector('.page-empty, .em-construcao')?.remove();
    return true;
  }

  try {
    const url = `${sb.url}/rest/v1/portal_materias?portal_id=eq.${encodeURIComponent(sb.portalId)}&page_id=eq.${encodeURIComponent(pageId)}&status=eq.publicado&order=data.desc`;
    const res = await fetchWithPreview(sb, url, 'materias', `&pageId=${encodeURIComponent(pageId)}`);

    if (!res.ok) return false;
    const materias = await res.json();
    if (!Array.isArray(materias) || materias.length === 0) return false;

    container.innerHTML = materias.map(m => renderMateria({
      id: m.id,
      titulo: m.titulo,
      subtitulo: m.subtitulo,
      data: m.data,
      content: m.content,
    }, lang, primaryLang)).join('');
    bindForms(container, sb);
    initTimelines(container);
    initCounters(container);
    // Each block fades in on its own as the visitor scrolls. The timeline
    // is skipped — it already animates its own items, and a second
    // transform on the wrapper would fight with that.
    container.querySelectorAll('.materia-block:not(.timeline)').forEach(el => el.setAttribute('data-reveal', ''));
    observeReveals(container);
    container.classList.add('materias--loaded');

    // The blank-page template always ships a sibling "Em construção"
    // placeholder (page.js converts .page-empty to it on load, before this
    // fetch resolves) — once real content renders, that placeholder is
    // stale and must go, or both show stacked on top of each other.
    container.parentElement?.querySelector('.page-empty, .em-construcao')?.remove();
    return true;
  } catch {
    return false;
  }
}

export async function initMaterias(siteConfig) {
  const sb = siteConfig?.supabase;
  const pageId = resolvePageId(siteConfig.nav);
  const container = document.querySelector('[data-materias]');
  return loadMateriasInto(pageId, container, sb, siteConfig);
}
