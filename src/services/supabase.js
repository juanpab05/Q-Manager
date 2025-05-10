// Import the configured Supabase client from utils
import supabaseClient from '../utils/supabaseClient';

// Re-export the client for direct use if needed elsewhere, though services should use it internally
export default supabaseClient;

// Funciones de autenticación, now using the imported supabaseClient
export const auth = {
  /**
   * Registrar un nuevo usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise} - Promesa con la respuesta de Supabase
   */
  signUp: async (email, password) => {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Iniciar sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise} - Promesa con la respuesta de Supabase
   */
  signIn: async (email, password) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Cerrar sesión del usuario actual
   * @returns {Promise} - Promesa con la respuesta de Supabase
   */
  signOut: async () => {
    const { error } = await supabaseClient.auth.signOut();
    return { error };
  },

  /**
   * Obtener el usuario actual
   * @returns {Object} - Usuario actual o null
   */
  getCurrentUser: async () => {
    const { data } = await supabaseClient.auth.getUser();
    return data?.user || null;
  },

  /**
   * Obtener la sesión actual
   * @returns {Object} - Sesión actual o null
   */
  getSession: async () => {
    const { data } = await supabaseClient.auth.getSession();
    return data?.session || null;
  },

  /**
   * Obtener el token JWT actual
   * @returns {string|null} - Token JWT o null
   */
  getJWT: async () => {
    const session = await auth.getSession(); // auth.getSession() will use supabaseClient
    return session?.access_token || null;
  }
}; 