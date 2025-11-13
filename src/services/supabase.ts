import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js'

// Inicializa el cliente de Supabase con las credenciales públicas
// Estas credenciales son seguras para usar en el frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY 

// Crear el cliente de Supabase
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

export default supabase

// Tipos para las respuestas de autenticación
interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  } | null;
  error: Error | null;
}

// Funciones de autenticación
export const auth = {
  /**
   * Registrar un nuevo usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<AuthResponse>} - Promesa con la respuesta de Supabase
   */
  signUp: async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data: { user: data.user, session: data.session }, error }
  },

  /**
   * Iniciar sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<AuthResponse>} - Promesa con la respuesta de Supabase
   */
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data: { user: data.user, session: data.session }, error }
  },

  /**
   * Cerrar sesión del usuario actual
   * @returns {Promise<{ error: Error | null }>} - Promesa con la respuesta de Supabase
   */
  signOut: async (): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  /**
   * Obtener el usuario actual
   * @returns {Promise<User | null>} - Usuario actual o null
   */
  getCurrentUser: async (): Promise<User | null> => {
    const { data } = await supabase.auth.getUser()
    return data?.user || null
  },

  /**
   * Obtener la sesión actual
   * @returns {Promise<Session | null>} - Sesión actual o null
   */
  getSession: async (): Promise<Session | null> => {
    const { data } = await supabase.auth.getSession()
    return data?.session || null
  },

  /**
   * Obtener el token JWT actual
   * @returns {Promise<string | null>} - Token JWT o null
   */
  getJWT: async (): Promise<string | null> => {
    const session = await auth.getSession()
    return session?.access_token || null
  },

  /**
   * Suscribirse a cambios en la autenticación
   * @param {Function} callback - Función a llamar cuando cambia el estado de autenticación
   * @returns {Object} - Objeto con la suscripción
   */
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    // Esta implementación ya no es necesaria ya que usamos el cliente directamente
    // Por compatibilidad con el código existente, mantenemos la función
    return supabase.auth.onAuthStateChange(callback);
  }
} 