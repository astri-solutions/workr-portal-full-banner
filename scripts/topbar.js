// scripts/topbar.js
import { setLang } from './lib/i18n.js';

const CONTRAST_KEY = 'workr_contrast';

// Every page here is a full reload (multi-page static site, not an SPA), so
// without persisting the choice, alto contraste reset to off on every single
// navigation — reads as "não converte o site todo" even though it worked on
// the page it was toggled on. Call this as early as possible (before paint)
// so there's no color flash on pages where it's already enabled.
export function applyStoredContrast() {
  try {
    if (localStorage.getItem(CONTRAST_KEY) === 'on') {
      document.documentElement.dataset.contrast = 'on';
    }
  } catch { /* localStorage unavailable — falls back to session-only toggle */ }
}

export function initTopbarBehavior() {
  // Tickers: rotação automática se houver mais de um
  const tickers = document.querySelectorAll('[data-topbar-ticker]');
  if (tickers.length > 1) {
    let current = 0;
    setInterval(() => {
      tickers[current].classList.remove('is-active');
      current = (current + 1) % tickers.length;
      tickers[current].classList.add('is-active');
    }, 4000);
  }

  // Acessibilidade
  document.querySelectorAll('[data-a11y="contrast"]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(document.documentElement.dataset.contrast === 'on'));
  });
  document.querySelectorAll('[data-a11y]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.a11y;
      const html   = document.documentElement;

      if (action === 'contrast') {
        const on = html.dataset.contrast === 'on';
        html.dataset.contrast = on ? 'off' : 'on';
        btn.setAttribute('aria-pressed', String(!on));
        try { localStorage.setItem(CONTRAST_KEY, on ? 'off' : 'on'); } catch { /* ignore */ }
      }

      if (action === 'font-up' || action === 'font-down') {
        const current = parseFloat(getComputedStyle(html).fontSize) || 16;
        const next    = action === 'font-up'
          ? Math.min(current + 2, 22)
          : Math.max(current - 2, 12);
        html.style.fontSize = next + 'px';
      }
    });
  });

  // Idioma — troca o idioma de todo o conteúdo do site, não só o botão ativo.
  // A escolha é persistida e a página recarrega para que todo componente
  // (documentos, resultados, textos estáticos) releia o idioma atual.
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.lang;
      if (document.documentElement.lang === code) return;
      setLang(code);
      document.documentElement.lang = code;
      location.reload();
    });
  });
}
