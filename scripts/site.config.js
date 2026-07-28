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
    type:      "static",
    iframeUrl: "",
    items: [
      { symbol: "XPTO3", price: "R$ 00,00", change: "0,00%", direction: "up" }
    ],
  },

  nav: [
    { id: "a-companhia", label: "A Companhia", href: "/a-companhia.html", children: [
      { id: "npxjvo2", label: "Quem Somos", labels: {"pt-BR":"Quem Somos"}, href: "/u9rmss2.html", pageType: "show" },
      { id: "hwx03aq", label: "Linha do Tempo", labels: {"pt-BR":"Linha do Tempo"}, href: "/dchb0w1.html", pageType: "timeline" },
    ] },
    { id: "governanca", label: "Governança", labels: {"pt-BR":"Governança"}, headerImage: "https://mmhuwlpsgnvoxyuofliq.supabase.co/storage/v1/object/public/portal-media/0cf615fe-783b-4dc2-8064-3205c18a4f6d/header/canal-1785018695664-hha2rmcekqs.webp", children: [
      { id: "composicao", label: "Composição Acionária", labels: {"pt-BR":"Composição Acionária"}, href: "/composicao-acionaria.html", pageType: "tabela", headerImage: "https://mmhuwlpsgnvoxyuofliq.supabase.co/storage/v1/object/public/portal-media/0cf615fe-783b-4dc2-8064-3205c18a4f6d/header/canal-1785018695664-hha2rmcekqs.webp" },
      { id: "atas", label: "Atas e Assembleias", labels: {"pt-BR":"Atas e Assembleias"}, href: "/atas-assembleias.html", pageType: "lista-agrupada", listaAgrupadaStyle: "accordion", listaAgrupadaCategories: [{"id":"Atas","label":"Atas"},{"id":"Assembleias","label":"Assembleias"}], headerImage: "https://mmhuwlpsgnvoxyuofliq.supabase.co/storage/v1/object/public/portal-media/0cf615fe-783b-4dc2-8064-3205c18a4f6d/header/canal-1785018695664-hha2rmcekqs.webp" },
      { id: "docs-cvm", label: "Documentos CVM", labels: {"pt-BR":"Documentos CVM"}, href: "/documentos-cvm.html", pageType: "lista-agrupada", listaAgrupadaStyle: "accordion", listaAgrupadaCategories: [{"id":"Assembleias","label":"Assembleias"},{"id":"Aviso aos Acionistas","label":"Aviso aos Acionistas"},{"id":"Comunicado ao Mercado","label":"Comunicado ao Mercado"},{"id":"Fato Relevante","label":"Fato Relevante"},{"id":"Formulário Cadastral","label":"Formulário Cadastral"},{"id":"Formulário de Referência","label":"Formulário de Referência"},{"id":"Reuniões do Conselho de Administração","label":"Conselho de Administração","labels":{"pt-BR":"Conselho de Administração"}},{"id":"Valores Mobiliários negociados e detidos (Resolução CVM 44/2021)","label":"Resolução CVM 44/2021","labels":{"pt-BR":"Resolução CVM 44/2021"}}], headerImage: "https://mmhuwlpsgnvoxyuofliq.supabase.co/storage/v1/object/public/portal-media/0cf615fe-783b-4dc2-8064-3205c18a4f6d/header/canal-1785018695664-hha2rmcekqs.webp" },
      { id: "v68l4fa", label: "Sustentabilidade", labels: {"pt-BR":"Sustentabilidade"}, href: "/0nc6aiw.html", pageType: "show", headerImage: "https://mmhuwlpsgnvoxyuofliq.supabase.co/storage/v1/object/public/portal-media/0cf615fe-783b-4dc2-8064-3205c18a4f6d/header/canal-1785177440796-eud7i7oxa56.webp" },
    ] },
    { id: "investidores", label: "Investidores", children: [
      { id: "calendario", label: "Calendário de Eventos", href: "/calendario-eventos.html" },
      { id: "resultados", label: "Resultados", labels: {"pt-BR":"Resultados"}, href: "/central-resultados.html", pageType: "tabela-resultados" },
      { id: "ratings", label: "Ratings", labels: {"pt-BR":"Ratings"}, href: "/ratings.html", pageType: "tabela" },
    ] },
    { id: "contato", label: "Contato", children: [
      { id: "fale-ri", label: "Fale com RI", labels: {"pt-BR":"Fale com RI"}, href: "/fale-com-ri.html", pageType: "formulario" },
      { id: "mailing", label: "Mailing", labels: {"pt-BR":"Mailing"}, href: "/mailing.html", pageType: "formulario" },
      { id: "i9bnwfw", label: "Glossário", labels: {"pt-BR":"Glossário"}, href: "/khfe7cu.html", pageType: "show" },
    ] },
    { id: "4rae9cp", label: "Teste lista", labels: {"pt-BR":"Teste lista"}, href: "/4rae9cp.html", pageType: "lista", children: [] },
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
    variant: "full",
    model: "compacto",
    email: "workrlite@astri.com",
    content: {"pt-BR":{"hours":"Segunda a sexta, das 08h às 18h, exceto feriados.","phone":"(11) 1234-5678","address":"Av. Brigadeiro Faria Lima, 2.277, 17º andar — São Paulo/SP, CEP 01452-000","copyright":"©Copyright Workr Lite - Full Banner 2026","disclaimer":"As informações contidas neste site são de caráter meramente informativo e não constituem oferta de valores mobiliários."}},
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
    "theme": "light",
    "layout": "left",
    "buttons": [],
    "content": {
      "pt-BR": {
        "title": "Utilizamos cookies",
        "linkText": "Política de Privacidade",
        "acceptLabel": "Aceitar todos",
        "description": "Usamos cookies para melhorar sua experiência, personalizar conteúdos e analisar o tráfego do nosso site.",
        "rejectLabel": "Rejeitar",
        "customizeLabel": "Personalizar"
      }
    },
    "enabled": true,
    "linkUrl": "/politica-de-privacidade",
    "showReject": true,
    "showCustomize": true
  },

  errorPages: [],

  banner: [
    {
      "id": "b1",
      "imagem": "/assets/banner/b1-d545585d2d04.jpg",
      "content": {
        "pt-BR": {
          "cta": "Quero testar",
          "titulo": "Teste de banner",
          "subtitulo": "Transparência e geração de valor para nossos acionistas."
        }
      }
    },
    {
      "id": "b9gc158nrhfd",
      "imagem": "/assets/banner/b9gc158nrhfd-a2ccf7c08311.jpg",
      "content": {
        "pt-BR": {
          "cta": "Saiba mais",
          "titulo": "Novo banner",
          "subtitulo": "Outro banner"
        }
      }
    }
  ],

  // Home hero shortcuts (Banner com navbar) — null = derive from siteConfig.nav.
  home: {
    shortcuts: [
      {
        "label": "Documentos CVM",
        "href": "/documentos-cvm.html"
      },
      {
        "label": "Meus Resultados",
        "href": "/central-resultados.html"
      },
      {
        "label": "Fale com RI",
        "href": "/fale-com-ri.html"
      }
    ],
  },

  supabase: {
    url:      "https://mmhuwlpsgnvoxyuofliq.supabase.co",
    anonKey:  "sb_publishable_BBSPbQc2kZngiK45ecfXaA_X4NANiGj",
    portalId: "0cf615fe-783b-4dc2-8064-3205c18a4f6d",
  },

};
