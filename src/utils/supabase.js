import { createClient } from '@supabase/supabase-js';

// Estas variables de entorno deben configurarse en un archivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 
export const supabase = createClient(supabaseUrl, supabaseKey); 