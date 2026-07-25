// scripts/components/pageHeader.js
// Applies the per-page (or, failing that, per-canal) header image configured
// in the CMS's Canais screen to this page's `.page-header__bg`. Every
// blank/generic page ships with the same static placeholder image baked in
// at publish time (see publish-config's buildBlankPage) — this overrides it
// client-side when a real one is configured, walking own → parent canal for
// the fallback, same precedence the admin's "herda do canal" hint promises.
export function applyPageHeaderImage(config) {
  const bg = document.querySelector('.page-header__bg');
  if (!bg) return;

  const path = location.pathname.replace(/\/$/, '') || '/';
  const matches = (href) => !!href && (path === href.replace(/\.html$/, '') || path + '.html' === href || path === href);

  for (const canal of config.nav ?? []) {
    if (matches(canal.href)) {
      if (canal.headerImage) bg.src = canal.headerImage;
      return;
    }
    for (const sub of canal.children ?? []) {
      if (matches(sub.href)) {
        const img = sub.headerImage ?? canal.headerImage;
        if (img) bg.src = img;
        return;
      }
      for (const ss of sub.children ?? []) {
        if (matches(ss.href)) {
          const img = ss.headerImage ?? sub.headerImage ?? canal.headerImage;
          if (img) bg.src = img;
          return;
        }
      }
    }
  }
}
