// scripts/components/seo.js
// Consumes siteConfig.seo (meta título/descrição, Google Analytics/GTM,
// Microsoft Clarity) — set from Painel de Controle (super_admin). This did
// not exist before: the fields were collected in the New Portal wizard and
// written into site.config.js, but nothing on the site ever read them.

function isHomePage() {
  const path = location.pathname.replace(/\/index\.html$/, '/');
  return path === '/' || path === '';
}

export function initSeo(siteConfig) {
  const seo = siteConfig?.seo;
  if (!seo) return;

  // Meta título/descrição describem o SITE como um todo para os resultados
  // de busca — só sobrescreve na home; páginas internas já têm seu próprio
  // <title>/<meta description> específicos no HTML.
  if (isHomePage()) {
    if (seo.title) document.title = seo.title;
    if (seo.description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', seo.description);
    }
  }

  // Google Analytics 4 / Google Tag Manager — o mesmo snippet gtag.js cobre
  // os dois formatos de id (G-XXXX e GTM-XXXX).
  if (seo.googleAnalyticsId && !document.getElementById('wl-ga')) {
    const loader = document.createElement('script');
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(seo.googleAnalyticsId)}`;
    document.head.appendChild(loader);

    const inline = document.createElement('script');
    inline.id = 'wl-ga';
    inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.googleAnalyticsId}');`;
    document.head.appendChild(inline);
  }

  // Microsoft Clarity
  if (seo.clarityId && !document.getElementById('wl-clarity')) {
    const inline = document.createElement('script');
    inline.id = 'wl-clarity';
    inline.textContent = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${seo.clarityId}");`;
    document.head.appendChild(inline);
  }
}
