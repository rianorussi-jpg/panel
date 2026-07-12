import { createClient } from '@supabase/supabase-js';

// Usa las mismas variables de entorno que ya configuras en Vercel
// para tus otros proyectos: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
