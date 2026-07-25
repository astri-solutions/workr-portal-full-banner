// scripts/supabase.js
// Cliente Supabase singleton — usado por auth.js e qualquer módulo que precise
// de dados do backend. Retorna null quando as env vars não estão configuradas
// (modo demo / desenvolvimento sem backend).

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** ID do portal — injetado pelo Workr Lite ao provisionar. Usar em queries com RLS. */
export const PORTAL_ID = import.meta.env.VITE_PORTAL_ID ?? null;

/**
 * Cliente Supabase pronto para uso, ou null quando as env vars não estão
 * configuradas (modo demo). Sempre verifique `isSupabaseConfigured` antes de usar.
 */
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = Boolean(supabase);
