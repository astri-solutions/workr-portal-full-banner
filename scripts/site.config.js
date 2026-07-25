// scripts/site.config.js
// Este arquivo é gerado/substituído pelo Workr Lite CMS ao criar um novo portal.
// Todos os campos marcados com ← são injetados automaticamente na criação do portal.
export const siteConfig = {

  company: {
    name:        'Workr Lite - Astri teste',   // ← company.name
    nameShort:   'Workr Lite Teste',            // ← company.nameShort
    description:  'Relações com Investidores — Workr Lite Teste.',
    logoOriginal: '/assets/logotipo/logotipo-original.svg',
    logoNegative: '/assets/logotipo/logotipo-negative.svg',
    logoContrast: '/assets/logotipo/logotipo-negative.svg',
    favicon:      '/favicon.svg',
  },

  // Paleta de cores — injetada em runtime como CSS custom properties por theme.js.
  // Sobrescreve os valores estáticos de _colors.scss sem necessitar rebuild.
  colors: {
    primary:   '#00D865',   // ← cores.primary (500)
    secondary: '#0B5B68',   // ← cores.secondary (500)
    tertiary:  '#F4A261',   // ← cores.tertiary (500)
  },

  // Tipografia — carregada via Google Fonts em runtime por theme.js.
  fonts: {
    display: 'Plus Jakarta Sans',   // ← fontes.display
    body:    'Inter',               // ← fontes.body
  },

  // Ticker de cotação.
  // type 'static' → valores definidos em items[] (placeholder).
  // type 'iframe'  → embed do widget Enfoque via iframeUrl.
  ticker: {
    type:      'static',  // ← ticker.type ('static' | 'iframe')
    iframeUrl: '',        // ← ticker.iframeUrl (URL Enfoque)
    items: [
      { symbol: 'WKLA3', price: 'R$ 00,00', change: '0,00%', direction: 'up' },
    ],
  },

  nav: [
    {
      label: 'A Companhia',
      href:  '/a-companhia.html',
      children: [],
    },
    {
      label: 'Governança',
      children: [
        { label: 'Composição Acionária', href: '/composicao-acionaria.html' },
        { label: 'Atas e Assembleias',   href: '/atas-assembleias.html'     },
        { label: 'Documentos CVM',       href: '/documentos-cvm.html'       },
      ],
    },
    {
      label: 'Investidores',
      children: [
        { label: 'Central de Resultados',  href: '/central-resultados.html'  },
        { label: 'Calendário de Eventos',  href: '/calendario-eventos.html'  },
        { label: 'Ratings',                href: '/ratings.html'             },
      ],
    },
    {
      label: 'Contato',
      children: [
        { label: 'Fale com RI', href: '/fale-com-ri.html' },
        { label: 'Mailing',     href: '/mailing.html'     },
      ],
    },
  ],

  // Empresas (sub-entidades do portal). Se length > 1, páginas de lista/resultados
  // exibem um tabmenu por empresa. Gerado pelo Workr Lite CMS na criação do portal.
  empresas: [
    { id: 'imc',     label: 'International Meal Company', short: 'IMC'     },
    { id: 'imc-fii', label: 'IMC Recebíveis FII',         short: 'IMC FII' },
  ],

  // Supabase — injetado pelo CMS ao provisionar/publicar.
  // Permite que cores e fontes sejam atualizadas em runtime sem Publicar.
  supabase: {
    url:      null,  // ← SUPABASE_URL
    anonKey:  null,  // ← SUPABASE_ANON_KEY
    portalId: null,  // ← portals.id (UUID)
  },

  header: {
    variant: 'navbar-default', // 'navbar-default' | 'navbar-dark' | 'navbar-blur'
  },

  // Nav items only visible after login (área restrita)
  restrictedNav: [
    {
      label: 'Área Restrita',
      children: [
        { label: 'Relatórios Exclusivos',        href: '/area-restrita.html' },
        { label: 'Apresentações a Investidores', href: '/area-restrita.html' },
        { label: 'Acordos de Acionistas',        href: '/area-restrita.html' },
        { label: 'Documentos Confidenciais',     href: '/area-restrita.html' },
      ],
    },
  ],

  footer: {
    variant: 'simple', // 'full' | 'simple'
    address:   'Av. Brigadeiro Faria Lima, 2.277, 17º andar — São Paulo/SP, CEP 01452-000',
    email:     'workrlite@astri.com',
    phone:     '(11) 1234-5678',
    hours:     'Segunda a sexta, das 08h às 18h, exceto feriados.',
    copyright: `©Copyright Workr Lite - Astri teste ${new Date().getFullYear()}`,
    social: {
      linkedin:  '#',
      instagram: '#',
      facebook:  '#',
    },
    legalLinks: [
      { label: 'Termos e Condições',      href: '/termos-e-condicoes.html'      },
      { label: 'Política de Privacidade', href: '/politica-de-privacidade.html' },
      { label: 'Definições de Cookies',   href: '/definicao-de-cookies.html'    },
    ],
    legalText: 'As informações contidas neste site são de caráter meramente informativo e não constituem oferta de valores mobiliários.',
  },

};
