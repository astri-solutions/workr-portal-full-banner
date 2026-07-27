// scripts/components/contentIndex.js
// Descobre quais páginas do portal têm conteúdo publicado, para o menu não
// oferecer canais que só levariam a um "Em construção".
//
// Uma única chamada RPC (portal_content_index) em vez de três consultas
// REST separadas — isto roda antes do menu poder ser renderizado.

/**
 * @returns {Promise<{pageIds: Set<string>, hasResultados: boolean} | null>}
 *   `null` quando não dá para saber (sem Supabase configurado, rede fora,
 *   erro). Nesse caso nada é escondido: um menu incompleto por falha de
 *   rede seria pior do que um canal vazio.
 */
export async function fetchContentIndex(sb) {
  if (!sb?.url || !sb?.anonKey || !sb?.portalId) return null;
  try {
    const res = await fetch(`${sb.url}/rest/v1/rpc/portal_content_index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: sb.anonKey,
        Accept: 'application/json',
      },
      body: JSON.stringify({ p_portal_id: sb.portalId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      pageIds: new Set(Array.isArray(data?.pageIds) ? data.pageIds : []),
      hasResultados: !!data?.hasResultados,
    };
  } catch {
    return null;
  }
}

/** Uma página conta como "com conteúdo" se tem matéria/documento publicado… */
export function pageHasContent(node, index) {
  if (!index) return true;
  if (node?.id && index.pageIds.has(node.id)) return true;
  // …ou é uma página de resultados e o portal tem trimestres publicados:
  // resultados não se vinculam a um page_id, eles renderizam em qualquer
  // página tipada como central de resultados.
  if (index.hasResultados && node?.pageType === 'tabela-resultados') return true;
  return false;
}

/**
 * Remove do menu os canais sem conteúdo. Um canal-pai só sobrevive se
 * sobrar algum filho — ou, se ele próprio for uma página (sem filhos), se
 * tiver conteúdo.
 */
export function filterNav(nav, index) {
  if (!index) return nav ?? [];

  const filtered = (nav ?? []).map(canal => {
    const children = (canal.children ?? [])
      .map(sub => {
        const subChildren = (sub.children ?? []).filter(ss => pageHasContent(ss, index));
        if (pageHasContent(sub, index) || subChildren.length > 0) {
          return { ...sub, children: subChildren };
        }
        return null;
      })
      .filter(Boolean);

    if (children.length > 0) return { ...canal, children };
    // Sem filhos sobreviventes: só continua se for uma página própria com
    // conteúdo (canal folha, como "A Companhia").
    if ((canal.children?.length ?? 0) === 0 && pageHasContent(canal, index)) {
      return { ...canal, children: [] };
    }
    return null;
  }).filter(Boolean);

  // Rede de segurança: um portal recém-criado ainda não tem conteúdo nenhum,
  // e um site sem menu algum parece quebrado — não intencional. Nesse caso
  // mostra o menu completo, como antes.
  return filtered.length > 0 ? filtered : (nav ?? []);
}

/**
 * A página aberta agora é um canal sem conteúdo? Usado para mandar o
 * visitante ao 404 em vez de mostrar "Em construção". Páginas fora da
 * árvore de canais (home, termos, privacidade, área restrita) nunca
 * entram aqui.
 */
export function currentPageIsEmpty(nav, index) {
  if (!index) return false;
  const path = location.pathname.replace(/\/$/, '') || '/';
  if (path === '/' || path === '/index.html') return false;

  const matches = href => !!href && (
    path === href || path + '.html' === href || path === href.replace(/\.html$/, '')
  );

  for (const canal of nav ?? []) {
    if (matches(canal.href)) return !pageHasContent(canal, index);
    for (const sub of canal.children ?? []) {
      if (matches(sub.href)) return !pageHasContent(sub, index);
      for (const ss of sub.children ?? []) {
        if (matches(ss.href)) return !pageHasContent(ss, index);
      }
    }
  }
  return false; // não é um canal — deixa passar
}
