// scripts/site.config.js
// Gerado pelo Workr Lite CMS — não editar manualmente.
export const siteConfig = {

  // Ligado via Painel de Controle (super_admin) — quando true, page.js
  // mostra só uma tela de aviso e não inicializa o resto do site.
  maintenance: false,

  company: {
    name:        "Full Banner",
    nameShort:   "Full Banner",
    description: 'Relações com Investidores — Full Banner.',
    logoOriginal: '/assets/logotipo/logotipo-original.webp',
    logoNegative: '/assets/logotipo/logotipo-negative.webp',
    logoContrast: '/assets/logotipo/logotipo-negative.webp',
    favicon:      '/favicon.png',
  },

  colors: {
    primary:   "#d4e23a",
    secondary: "#04343F",
    tertiary:  "#b3b3b3",
  },

  fonts: {
    display: "plus-jakarta",
    body:    "inter",
  },

  ticker: {
    type:      "iframe",
    iframeUrl: "",
    items: [
      { symbol: 'WRLT3', price: 'R$ 00,00', change: '0,00%', direction: 'up' }
    ],
  },

  nav: [
    { id: "a-companhia", label: "A Companhia", href: "/a-companhia.html", children: [
      { id: "npxjvo2", label: "Quem Somos", href: "/u9rmss2.html" },
      { id: "hwx03aq", label: "Linha do Tempo", href: "/dchb0w1.html" },
      { id: "v68l4fa", label: "Sustentabilidade", href: "/0nc6aiw.html" },
    ] },
    { id: "governanca", label: "Governança", children: [
      { id: "composicao", label: "Composição Acionária", href: "/composicao-acionaria.html" },
      { id: "atas", label: "Atas e Assembleias", href: "/atas-assembleias.html" },
      { id: "docs-cvm", label: "Documentos CVM", href: "/documentos-cvm.html" },
    ] },
    { id: "investidores", label: "Investidores", children: [
      { id: "resultados", label: "Resultados", href: "/central-resultados.html" },
      { id: "calendario", label: "Calendário de Eventos", href: "/calendario-eventos.html" },
      { id: "ratings", label: "Ratings", href: "/ratings.html" },
    ] },
    { id: "contato", label: "Contato", children: [
      { id: "fale-ri", label: "Fale com RI", href: "/fale-com-ri.html" },
      { id: "mailing", label: "Mailing", href: "/mailing.html" },
      { id: "i9bnwfw", label: "Glossário", href: "/khfe7cu.html" },
    ] },
  ],

  empresas: [
    { id: "principal-1785017311409", label: "Full Banner", short: "FB" }
  ],

  header: { variant: 'banner' },

  languages: ["pt-BR","en"],

  topbar: {
    ri: { label: "Relações com Investidores", url: "/" },
    institucional: { label: "Institucional", url: "#" },
    showTicker: true,
  },

  restrictedNav: [],

  footer: {
    variant: 'simple',
    email: "",
    content: {"pt-BR":{"address":"","phone":"","hours":"","copyright":"©Copyright Full Banner 2026","disclaimer":"As informações contidas neste site são de caráter meramente informativo e não constituem oferta de valores mobiliários."}},
    social: { linkedin: "#", instagram: "#", facebook: "#" },
    legalLinks: [
      { label: "Termos e Condições", href: "/termos-e-condicoes.html" },
      { label: "Política de Privacidade", href: "/politica-de-privacidade.html" },
      { label: "Definições de Cookies", href: "/definicao-de-cookies.html" }
    ],
  },

  splash: {
    enabled: false,
    size: 'md',
    titulo: '',
    texto: '',
    conteudo: '',
    legenda: '',
    buttons: [],
  },

  cookies: {
    enabled: true,
    layout: 'full',
    theme: 'light',
    title: 'Utilizamos cookies',
    description: 'Usamos cookies para melhorar sua experiência.',
    acceptLabel: 'Aceitar todos',
    rejectLabel: 'Rejeitar',
    showReject: true,
    showCustomize: false,
  },

  errorPages: [],

  banner: [],

  supabase: {
    url:      "https://mmhuwlpsgnvoxyuofliq.supabase.co",
    anonKey:  "sb_publishable_BBSPbQc2kZngiK45ecfXaA_X4NANiGj",
    portalId: "0cf615fe-783b-4dc2-8064-3205c18a4f6d",
  },

};
