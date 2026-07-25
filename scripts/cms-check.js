/**
 * cms-check.js
 *
 * Verifica se todos os tipos de página e matéria definidos no CMS
 * (workr-lite-v1) possuem um template HTML correspondente em cliente-workr-lite.
 *
 * Uso:
 *   node scripts/cms-check.js
 *
 * Adicione ao package.json:
 *   "scripts": { "cms:check": "node scripts/cms-check.js" }
 *
 * Retorna exit code 1 se algum template estiver faltando, 0 se tudo ok.
 * Ideal para rodar em CI antes de cada deploy.
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Definição dos tipos de página do CMS ────────────────────────────────────
//
// Cada entrada descreve um tipo de página suportado pelo CMS.
// Ao adicionar um novo tipo no CMS (ChannelEditor / NovaMateriaPage),
// adicione aqui também — e crie o template HTML correspondente.
//
const CMS_PAGE_TYPES = [
  {
    id: 'show',
    label: 'Show (conteúdo rico)',
    description: 'Blocos de texto, imagens, colunas e galerias.',
    template: 'cms-show.html',
    cmsFiles: [
      'apps/web-admin/src/pages/portal/NovaMateriaPage.tsx',
    ],
  },
  {
    id: 'galeria',
    label: 'Galeria',
    description: 'Cards com título, descrição, data, link e imagem opcional.',
    template: 'cms-galeria.html',
    cmsFiles: [
      'apps/web-admin/src/pages/portal/MateriasPage.tsx',
    ],
  },
  {
    id: 'tabela',
    label: 'Tabela',
    description: 'Planilha com colunas e linhas editáveis.',
    template: 'cms-tabela.html',
    cmsFiles: [
      'apps/web-admin/src/pages/portal/NovaMateriaPage.tsx',
    ],
  },
  {
    id: 'lista',
    label: 'Lista',
    description: 'Lista linear de itens com título, data e link.',
    template: 'cms-lista.html',
    cmsFiles: [
      'apps/web-admin/src/components/ChannelEditor.tsx',
    ],
  },
  {
    id: 'lista-agrupada',
    label: 'Lista Agrupada (Acordeão)',
    description: 'Grupos colapsáveis com lista de itens internos.',
    template: 'cms-lista-agrupada.html',
    cmsFiles: [
      'apps/web-admin/src/components/ChannelEditor.tsx',
    ],
  },
  {
    id: 'blog',
    label: 'Blog',
    description: 'Feed de artigos com destaque para o mais recente.',
    template: 'cms-blog.html',
    cmsFiles: [
      'apps/web-admin/src/components/ChannelEditor.tsx',
    ],
  },
  {
    id: 'formulario',
    label: 'Formulário',
    description: 'Página com formulário de contato configurável.',
    template: 'cms-formulario.html',
    cmsFiles: [
      'apps/web-admin/src/pages/portal/MateriasPage.tsx',
    ],
  },
];

// ─── Verificação ─────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

console.log(`\n${BOLD}CMS ↔ HTML Template Check${RESET}`);
console.log(`${'─'.repeat(50)}`);
console.log(`${DIM}Verificando ${CMS_PAGE_TYPES.length} tipos de página definidos no CMS...${RESET}\n`);

let missing = 0;
let present = 0;

for (const type of CMS_PAGE_TYPES) {
  const templatePath = resolve(ROOT, type.template);
  const exists = existsSync(templatePath);

  if (exists) {
    present++;
    console.log(`${GREEN}✓${RESET}  ${BOLD}${type.id}${RESET} — ${type.label}`);
    console.log(`   ${DIM}Template: ${type.template}${RESET}`);
  } else {
    missing++;
    console.log(`${RED}✗${RESET}  ${BOLD}${type.id}${RESET} — ${type.label}`);
    console.log(`   ${RED}Template ausente: ${type.template}${RESET}`);
    console.log(`   ${YELLOW}Crie o arquivo em: ${ROOT}/${type.template}${RESET}`);
    console.log(`   ${DIM}Descrição: ${type.description}${RESET}`);
  }
  console.log();
}

// ─── Sumário ─────────────────────────────────────────────────────────────────

console.log(`${'─'.repeat(50)}`);
console.log(`${BOLD}Resultado:${RESET} ${GREEN}${present} ok${RESET}  |  ${missing > 0 ? RED : GREEN}${missing} faltando${RESET}`);

if (missing > 0) {
  console.log(`\n${RED}${BOLD}⚠  ${missing} template(s) HTML faltando.${RESET}`);
  console.log(`${YELLOW}Crie os arquivos indicados acima para cobrir todos os tipos do CMS.${RESET}\n`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}✓  Todos os tipos do CMS têm template HTML correspondente.${RESET}\n`);
  process.exit(0);
}
