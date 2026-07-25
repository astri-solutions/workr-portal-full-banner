// scripts/lib/i18n.js
// Shared runtime language state for the whole site. The topbar's PT|EN|ES
// switcher writes here; every component that renders translatable content
// reads from here so a language change is consistent across the page.
const LANG_KEY = 'site_lang';

export function getLang(config = {}) {
  const langs = config.languages ?? ['pt-BR'];
  const stored = localStorage.getItem(LANG_KEY);
  return stored && langs.includes(stored) ? stored : langs[0];
}

export function setLang(code) {
  localStorage.setItem(LANG_KEY, code);
}

// Picks the value for `lang` out of a per-language field (e.g. a document
// titulo saved as {'pt-BR': '...', en: '...'}), falling back to the primary
// language and then to whatever is available, so missing translations never
// render blank.
export function pick(field, lang, primaryLang = 'pt-BR') {
  if (field == null || typeof field === 'string') return field ?? '';
  return field[lang] ?? field[primaryLang] ?? Object.values(field)[0] ?? '';
}

// Static UI microcopy (filters, empty states) that isn't authored per-portal
// in the CMS but still needs to follow the selected language.
const UI_STRINGS = {
  'pt-BR': {
    filtrarAno: 'Filtrar por Ano',
    filtrarEmpresa: 'Filtrar por Empresa',
    todosOsAnos: 'Todos os anos',
    nenhumDocumento: 'Nenhum documento disponível.',
    nenhumResultado: 'Nenhum resultado disponível.',
    nenhumArquivo: 'Nenhum arquivo disponível.',
    emConstrucaoTitulo: 'Em construção',
    emConstrucaoDesc: 'Este conteúdo ainda não foi publicado. Em breve estará disponível.',
    manutencaoTitulo: 'Site em manutenção',
    manutencaoDesc: 'Estamos realizando atualizações. Volte novamente em breve.',
  },
  en: {
    filtrarAno: 'Filter by Year',
    filtrarEmpresa: 'Filter by Company',
    todosOsAnos: 'All years',
    nenhumDocumento: 'No documents available.',
    nenhumResultado: 'No results available.',
    nenhumArquivo: 'No files available.',
    emConstrucaoTitulo: 'Under construction',
    emConstrucaoDesc: 'This content hasn’t been published yet. Check back soon.',
    manutencaoTitulo: 'Site under maintenance',
    manutencaoDesc: 'We are performing updates. Please check back shortly.',
  },
  es: {
    filtrarAno: 'Filtrar por Año',
    filtrarEmpresa: 'Filtrar por Empresa',
    todosOsAnos: 'Todos los años',
    nenhumDocumento: 'Ningún documento disponible.',
    nenhumResultado: 'Ningún resultado disponible.',
    nenhumArquivo: 'Ningún archivo disponible.',
    emConstrucaoTitulo: 'En construcción',
    emConstrucaoDesc: 'Este contenido aún no fue publicado. Estará disponible pronto.',
    manutencaoTitulo: 'Sitio en mantenimiento',
    manutencaoDesc: 'Estamos realizando actualizaciones. Vuelve pronto.',
  },
};

export function t(key, lang) {
  const dict = UI_STRINGS[lang] ?? UI_STRINGS['pt-BR'];
  return dict[key] ?? UI_STRINGS['pt-BR'][key] ?? key;
}
