import supabase from './supabase';
import { auth } from './supabase';

/**
 * Servicio para interactuar con la tabla de usuarios en Supabase
 */
const userService = {
  /**
   * Obtener todos los usuarios
   * @returns {Promise} - Promesa con los usuarios
   */
  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
    
    return data;
  },

  /**
   * Obtener un usuario por ID
   * @param {string} id - ID del usuario (UUID)
   * @returns {Promise} - Promesa con el usuario
   */
  getUserById: async (id) => {
    console.log(`[userService] Iniciando getUserById para ID: ${id}`);
    
    try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
        console.error(`[userService] Error al obtener usuario con ID ${id}:`, error);
      throw error;
    }
      
      if (!data) {
        console.error(`[userService] No se encontró usuario con ID ${id}`);
        throw new Error(`No se encontró usuario con ID ${id}`);
      }

      console.log(`[userService] Usuario base encontrado:`, data);
    
    // Si encontramos el usuario, busquemos si es worker o actor
    let userType = 'user';
    let userDetails = null;
    
    // Verificar si es un worker
      console.log(`[userService] Verificando si es worker...`);
    const { data: workerData, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .eq('user_id', id)
      .single();
    
      if (workerError) {
        console.log(`[userService] Error al buscar worker (puede ser normal):`, workerError);
      }
      
    if (!workerError && workerData) {
        console.log(`[userService] Worker encontrado:`, workerData);
      userType = workerData.is_admin ? 'admin' : 'worker';
      userDetails = workerData;
    } else {
      // Verificar si es un actor
        console.log(`[userService] Verificando si es actor...`);
      const { data: actorData, error: actorError } = await supabase
        .from('actors')
        .select('*')
        .eq('user_id', id)
        .single();
      
        if (actorError) {
          console.log(`[userService] Error al buscar actor (puede ser normal):`, actorError);
        }
        
      if (!actorError && actorData) {
          console.log(`[userService] Actor encontrado:`, actorData);
        userType = 'actor';
        userDetails = actorData;
      }
    }
    
      const finalUser = {
      ...data,
      userType,
      details: userDetails
    };
      
      console.log(`[userService] Usuario final con tipo ${userType}:`, finalUser);
      return finalUser;
      
    } catch (error) {
      console.error(`[userService] Error general en getUserById:`, error);
      throw error;
    }
  },

  /**
   * Obtener el usuario actual basado en la autenticación
   * @returns {Promise} - Promesa con el usuario actual
   */
  getCurrentUser: async () => {
    // Primero obtenemos el usuario autenticado
    const supabaseUser = await auth.getCurrentUser();
    
    if (!supabaseUser) {
      return null;
    }
    
    // Luego obtenemos los datos del usuario de nuestra tabla users
    try {
      return await userService.getUserById(supabaseUser.id);
    } catch (error) {
      console.error('Error al obtener el usuario actual:', error);
      return null;
    }
  },

  /**
   * Actualizar un usuario
   * @param {string} id - ID del usuario (UUID)
   * @param {Object} userData - Datos del usuario a actualizar
   * @returns {Promise} - Promesa con el usuario actualizado
   */
  updateUser: async (id, userData) => {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error al actualizar usuario con ID ${id}:`, error);
      throw error;
    }
    
    return data;
  },

  /**
   * Crear un nuevo perfil de usuario después del registro
   * @param {Object} userData - Datos del usuario
   * @returns {Promise} - Promesa con el usuario creado
   */
  createUserProfile: async (userData) => {
    // Obtener el usuario autenticado
    const supabaseUser = await auth.getCurrentUser();
    
    if (!supabaseUser) {
      throw new Error('No hay usuario autenticado');
    }

    // Crear el perfil en la tabla users
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: supabaseUser.id,
        email: supabaseUser.email,
        nombre: userData.nombre,
        cedula: userData.cedula,
        phone_number: userData.phoneNumber,
        is_superuser: false,
        is_staff: false,
        password: 'migrated_password'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear perfil de usuario:', error);
      throw error;
    }
    
    return data;
  }
};

export default userService; 