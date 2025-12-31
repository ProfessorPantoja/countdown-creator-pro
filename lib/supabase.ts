/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Estes valores virão das variáveis de ambiente que vamos configurar
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
