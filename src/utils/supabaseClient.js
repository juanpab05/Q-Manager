import { createClient } from '@supabase/supabase-js';

// Configuración para Supabase usando variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Comprobación para asegurar que las variables de entorno están cargadas
if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Error: Supabase URL or Anon Key is not defined. ',
    'Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
  // Podrías lanzar un error aquí o manejarlo de otra forma, 
  // pero crear un cliente con undefined URL/Key fallará.
}

// Crear cliente de Supabase con opciones para Realtime
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export default supabase; 