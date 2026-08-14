// scripts/components/contactCard.js
// Preenche todo texto de contato/identidade da empresa a partir do
// siteConfig — em fale-com-ri.html/mailing.html (card lateral) e nas
// páginas legais (termos, privacidade, cookies). Antes esses blocos vinham
// com nome de empresa, CNPJ, endereço, telefone e e-mail fictícios (e até o
// nome de um banco real como "custodiante") hardcoded direto no HTML, sem
// nenhum vínculo com a configuração real do portal: um cliente novo veria
// esses dados como se fossem os dele até alguém lembrar de editar
// manualmente cada página.
//
// Sem valor configurado, cada campo cai de volta no placeholder entre
// colchetes já escrito no HTML (ex. "[Nome da Empresa]") em vez de ficar em
// branco — deixa óbvio que falta configurar, sem parecer conteúdo já
// publicado. querySelectorAll porque as páginas legais repetem os mesmos
// dados em mais de um lugar (ex. identificação do controlador + seção de
// contato no fim).
export function initContactCard(config) {
  const setAll = (selector, value) => {
    if (!value) return;
    document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
  };

  setAll('[data-contact-name]', config.company?.name);
  setAll('[data-company-cnpj]', config.company?.cnpj);

  const primaryLang = config.languages?.[0] ?? 'pt-BR';
  const lang = document.documentElement.lang || primaryLang;
  const content = config.footer?.content?.[lang] ?? config.footer?.content?.[primaryLang] ?? {};

  setAll('[data-contact-address]', content.address);
  setAll('[data-contact-phone]', content.phone);
  setAll('[data-contact-email]', config.footer?.email);

  if (config.footer?.email) {
    document.querySelectorAll('[data-contact-email-link]').forEach(el => {
      el.href = `mailto:${config.footer.email}`;
    });
  }

  // Custodiante é opcional — nem toda companhia informa um. Sem valor
  // configurado, o parágrafo inteiro fica escondido (definido no HTML) em
  // vez de mostrar um nome de banco genérico ou fictício.
  if (config.company?.custodiante) {
    document.querySelectorAll('[data-contact-custodiante]').forEach(wrap => {
      const nameEl = wrap.querySelector('[data-custodiante-nome]');
      if (nameEl) nameEl.textContent = config.company.custodiante;
      wrap.style.display = '';
    });
  }
}
