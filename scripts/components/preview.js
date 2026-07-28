// scripts/components/preview.js
//
// Preview mode: lets an admin see unpublished CMS changes on the real,
// deployed site — colors/fonts already do this today (see theme.js's
// refreshThemeFromSupabase, "visual changes are instant after saving").
// This extends the same idea to the rest of site.config.js (menu/Canais,
// footer, empresas, splash, cookies, topbar, ticker, idiomas, error pages)
// so the CMS's "Pré-visualizar" button can open this same live site with
// ?preview=1 and see draft edits without a Publicar/redeploy.
//
// Draft matérias/documentos/resultados: those tables only expose
// Publicado/publicado rows to anonymous readers — by design (see RLS
// policies `public_read_published_*`). To preview drafts too, the CMS mints
// a short-lived opaque token (see `mint-preview-token` edge function)
// scoped to this one portal, passed as `?token=` alongside `?preview=1`.
// materias.js / documentos.js / resultados.js call `fetchWithPreview()`
// below instead of fetching PostgREST directly — with no token, it fetches
// the exact same URL as before (byte-for-byte unchanged); with a token, it
// calls the `preview-content` edge function instead, which verifies the
// token and reads every status (draft included) via the service role, so
// no RLS policy needs to be loosened for this.
//
// Deliberately NOT covered here (still shows the last-published version):
//  - Logo/favicon/banner images: the CMS only sends these to the site as
//    committed files on Publicar, so there is no live source to read before
//    that happens.
//  - Brand-new pages that were never published: each canal page is a
//    physical .html file created at Publicar time, so a page that was never
//    published has no URL to preview yet.
//
// Everything here is read-only and strictly opt-in via the `preview` query
// param — importing this module and calling these functions has zero effect
// on the normal (non-preview) page load.

export function isPreviewMode() {
  try { return new URLSearchParams(location.search).has('preview'); } catch { return false; }
}

function previewToken() {
  if (!isPreviewMode()) return null;
  try { return new URLSearchParams(location.search).get('token'); } catch { return null; }
}

// Drop-in replacement for `fetch(directUrl, {...})` in materias.js /
// documentos.js / resultados.js. Without a preview token, behaves exactly
// like the original direct PostgREST fetch. With one, calls the
// `preview-content` edge function instead (service-role read, every
// status) and returns a same-shaped Response so callers' existing
// `res.ok` / `res.json()` handling needs no further changes.
// `kind` + `extraQuery` select which table(s) preview-content reads —
// see that function for the accepted values.
export function fetchWithPreview(sb, directUrl, kind, extraQuery = '') {
  const token = previewToken();
  if (!token) {
    return fetch(directUrl, {
      headers: { apikey: sb.anonKey, Authorization: `Bearer ${sb.anonKey}`, Accept: 'application/json' },
    });
  }
  const url = `${sb.url}/functions/v1/preview-content?portalId=${encodeURIComponent(sb.portalId)}&token=${encodeURIComponent(token)}&kind=${kind}${extraQuery}`;
  return fetch(url, { headers: { apikey: sb.anonKey, Accept: 'application/json' } });
}

// Mirrors the enabled-only, id/label/href/children shape publish-config's
// buildNavSection() writes into site.config.js, so preview nav matches
// exactly what publishing would produce.
function mapCanaisToNav(canais) {
  if (!Array.isArray(canais)) return [];
  return canais.filter(c => c.enabled).map(c => ({
    id: c.id, label: c.label, labels: c.labels, href: c.href ?? '/',
    pageType: c.pageType, listaAgrupadaStyle: c.listaAgrupadaStyle,
    isExternalLink: c.isExternalLink, externalUrl: c.externalUrl,
    children: (c.children ?? []).filter(sc => sc.enabled).map(sc => ({
      id: sc.id, label: sc.label, labels: sc.labels, href: sc.href,
      pageType: sc.pageType, listaAgrupadaStyle: sc.listaAgrupadaStyle,
      isExternalLink: sc.isExternalLink, externalUrl: sc.externalUrl,
    })),
  }));
}

// Overwrites `config`'s fields in place with the live (possibly unpublished)
// portal_config row. Must run BEFORE boot() calls initHeader/initFooter/etc.
// so those components read the fresh values on their first (only) pass —
// no re-render step needed. Best-effort: any failure leaves `config`
// untouched, so a broken preview never breaks the real page.
export async function applyPreviewOverrides(config) {
  if (!isPreviewMode()) return;
  const sb = config.supabase;
  if (!sb?.url || !sb?.anonKey || !sb?.portalId) return;
  try {
    const cols = 'canais,footer,empresas,informacoes,ticker,topbar,splash,cookies,idiomas,error_pages';
    const res = await fetch(
      `${sb.url}/rest/v1/portal_config?select=${cols}&portal_id=eq.${sb.portalId}&limit=1`,
      { headers: { apikey: sb.anonKey, Accept: 'application/json' } }
    );
    if (!res.ok) return;
    const [row] = await res.json();
    if (!row) return;

    if (row.canais) config.nav = mapCanaisToNav(row.canais);
    if (row.footer) config.footer = row.footer;
    if (row.topbar) config.topbar = row.topbar;
    if (row.ticker) config.ticker = row.ticker;
    if (row.idiomas) config.languages = row.idiomas;
    if (row.error_pages) config.errorPages = row.error_pages;
    if (Array.isArray(row.empresas)) {
      config.empresas = row.empresas.filter(e => e.ativo).map(e => ({
        id: e.id, label: e.nome,
        short: (e.nome ?? '').split(' ').filter(w => w.length > 2).map(w => w[0]).join('').toUpperCase() || (e.nome ?? '').slice(0, 3).toUpperCase(),
      }));
    }
    // splash/cookies keep their non-image fields; imageUrl (if a data: URL
    // pre-publish) is intentionally left as-is — see module notes above.
    if (row.splash) config.splash = { ...config.splash, ...row.splash, imageUrl: config.splash?.imageUrl };
    if (row.cookies) config.cookies = row.cookies;
  } catch { /* preview overlay is best-effort; never break the real page */ }
}

// Small on-page indicator so nobody mistakes a preview link for the live
// published site.
export function markPreviewBanner() {
  if (!isPreviewMode()) return;
  const el = document.createElement('div');
  el.textContent = 'Pré-visualização — alterações ainda não publicadas';
  el.setAttribute('style',
    'position:fixed;top:0;left:0;right:0;z-index:99999;background:#141414;color:#fff;' +
    'font:600 12px system-ui,-apple-system,sans-serif;text-align:center;padding:6px 12px;' +
    'letter-spacing:.02em;');
  document.body?.prepend(el);
}
