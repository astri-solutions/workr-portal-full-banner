// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'fs';

// The CMS adds/removes .html pages per portal (canais tree, layout template,
// pages the client deletes). A hardcoded entry list breaks the build the
// moment any of those files is removed — build entries from whatever .html
// files actually exist in the repo root instead.
function htmlEntries() {
  const entries = {};
  for (const file of readdirSync(__dirname)) {
    if (!file.endsWith('.html')) continue;
    const name = file.replace(/\.html$/, '').replace(/[-.]([a-z])/g, (_, c) => c.toUpperCase());
    entries[name || 'main'] = resolve(__dirname, file);
  }
  return entries;
}

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: htmlEntries(),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
});
