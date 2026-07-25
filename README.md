# cliente-workr-lite

Template estático (Vite + SCSS + JS puro) usado pelo Workr Lite CMS para gerar o site de RI de cada portal. Este repositório é a fonte de verdade tanto para **novas importações** (provisionamento de portal) quanto para o **self-heal** de portais já existentes (arquivos re-copiados a cada "Publicar" via `publish-config`).

## Padrão de filtros e listas (Documentos / Central de Resultados)

Conteúdo buscado do Supabase em runtime (`scripts/components/documentos.js`, `scripts/components/resultados.js`) segue um padrão visual único. Qualquer novo componente data-driven parecido (nova seção com filtro + lista) deve reutilizar exatamente essas classes — não criar variantes por página.

### Filtro (`.filter-box`)

```html
<label class="filter-box">
  <span class="filter-box__label">Filtrar por Ano</span>
  <select data-xxx-filter="ano">
    <option value="">Todos os anos</option>
    ...
  </select>
  <span class="filter-box__chevron" aria-hidden="true"></span>
</label>
```

- Rótulo pequeno (`__label`) sempre acima do valor selecionado.
- Texto do valor com peso normal (nunca bold).
- 100% de largura abaixo do breakpoint `tablet` (empilha verticalmente via `.filter-bar__group`).
- Definido em `styles/components/_filter.scss`.

Não usar a classe legada `.select` (select de uma linha só, sem rótulo visível) para filtros novos — ela existe apenas para compatibilidade com as páginas de referência estáticas (`cms-lista.html`, `cms-tabela.html`, etc.), que não são usadas por portais reais.

### Lista (`.doc-list`)

```html
<ul class="doc-list" role="list">
  <li class="doc-list__item">
    <div class="doc-list__info">
      <span class="doc-list__date">21 de jul. de 2026</span>
      <span class="doc-list__title">Nome do arquivo</span>
    </div>
    <div class="doc-list__actions">
      <a class="doc-list__link doc-list__icon" href="...">...</a>
    </div>
  </li>
</ul>
```

- Cada item é um card (fundo `--color-surface`, borda transparente) — nunca uma linha com `border-bottom` separando itens.
- Hover: borda `--color-primary` + fundo `--color-bg`.
- **Data sempre acima do nome** (`.doc-list__info` em coluna) — não lado a lado.
- `.doc-list__sep` (o antigo travessão entre data e nome) fica oculto — era usado no layout de uma linha só, não faz sentido empilhado.
- Ícone do tipo de arquivo: SVG vetorial inline (`fileBadgeSvg()` em `documentos.js`, reexportado para `resultados.js`) — nunca os arquivos raster em `/assets/icons/*.svg` (esses embutem um bitmap e ficam borrados em tamanho pequeno).
- Definido em `styles/components/_list.scss`.

### Empresa (tabs ou filtro)

Regra de negócio: com mais de uma empresa no portal, o conteúdo **nunca mistura** empresas na mesma visualização.

- Layout `sidebar`/`banner`: tabs dentro do conteúdo (`.tab-menu__nav`/`.tab-menu__tab`, construídos dinamicamente).
- Layout `tabmenu`: segundo filtro `.filter-box` ("Filtrar por Empresa") ao lado do filtro de Ano — nunca uma opção "Todas as empresas".
- Em ambos os casos, a **empresa principal já vem selecionada por padrão** ao carregar a página.

### Responsivo

- `.tab-menu__nav` (tanto o nav principal do layout tabmenu quanto os empresa-tabs) vira scroll horizontal abaixo do breakpoint `tablet` (`overflow-x: auto`, sem quebrar linha) — nunca gera scroll horizontal na página inteira.
- `.filter-box` ocupa 100% da largura abaixo de `tablet`.

## Deploy / self-heal

Todo arquivo dentro de `scripts/`, `styles/` e `vite.config.js` é sincronizado automaticamente para os repositórios de cada portal a cada publicação, via leitura recursiva da árvore git deste repo (`supabase/functions/publish-config/index.ts`, no repo `workr-lite-v1`). Não é preciso manter nenhuma lista manual de arquivos — basta adicionar/editar o arquivo aqui que ele chega ao próximo "Publicar" de qualquer portal já provisionado. A única exceção é `scripts/site.config.js`, gerado por portal e nunca sobrescrito pelo template.

## Idioma (i18n)

- `scripts/lib/i18n.js` é o estado compartilhado de idioma do site: `getLang(config)` lê o idioma persistido (`localStorage`, chave `site_lang`) ou o primeiro de `config.languages`; `setLang(code)` persiste a escolha; `pick(field, lang)` resolve um campo salvo por idioma (ex.: `{'pt-BR': '...', en: '...'}`) com fallback para o idioma primário; `t(key, lang)` traduz microcopy fixa da UI (filtros, estados vazios).
- O seletor PT|EN|ES na topbar (`scripts/topbar.js`) só aparece quando o portal tem mais de um idioma (`config.languages.length > 1`). Ao clicar, ele persiste o idioma, atualiza `<html lang>` e recarrega a página — todo componente relê o idioma atual a partir do zero, então não é preciso gerenciar estado reativo em cada um.
- **Conteúdo já traduzível hoje**: títulos de Documentos (`doc.titulo`, salvo por idioma via `LangTabs` no CMS) e toda a microcopy fixa de Documentos/Central de Resultados (filtros, "nenhum documento/resultado disponível", "Em construção").
- **Ainda não traduzível** (gap conhecido, requer trabalho futuro tanto no CMS quanto no `publish-config`): rótulos de canais/nav, textos de Banner/Splash e páginas estáticas — hoje são strings únicas geradas em `site.config.js` a partir de um único idioma no CMS, não objetos por idioma. Para cobrir isso: (1) tornar esses campos por-idioma nos formulários do CMS (mesmo padrão do `LangTabs` já usado em Documentos/Canais), (2) fazer `publish-config` emitir objetos `{'pt-BR':..., en:...}` em vez de string única, (3) usar `pick()` no script correspondente do site para renderizar o idioma atual.
- Nomes de arquivo e códigos de período (ex. "1T26") na Central de Resultados não são traduzidos — são dados, não texto de UI.
