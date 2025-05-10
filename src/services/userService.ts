import supabase from './supabase';
import { auth } from './supabase';
import { User } from '@supabase/supabase-js';

// Interfaces para los tipos de datos
export interface UserProfile {
  id: number;
  email: string;
  nombre: string;
  cedula: number;
  phone_number: string;
  is_superuser: boolean;
  is_staff: boolean;
  last_login: string | null;
  password: string;
  users_worker?: WorkerProfile;
  users_actor?: ActorProfile;
  userType?: 'user' | 'admin' | 'worker' | 'actor';
}

interface WorkerProfile {
  user_ptr_id: number;
  is_admin: boolean;
}

interface ActorProfile {
  user_ptr_id: number;
  has_priority: boolean;
  motive: string | null;
}

interface NewUserProfileData {
  nombre: string;
  cedula: number;
  phoneNumber: string;
  email: string;
  is_superuser?: boolean;
  is_staff?: boolean;
}

/**
 * Servicio para interactuar con la tabla de usuarios en Supabase
 */
const userService = {
  /**
   * Obtener todos los usuarios
   * @returns {Promise<UserProfile[]>} - Promesa con los usuarios
   */
  getAllUsers: async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('users_user')
      .select('*');
    
    if (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
    
    return data as UserProfile[];
  },

  /**
   * Obtener un usuario por ID. Si el ID es un string (UUID), se asume que es auth_user_id.
   * Si es un número, se asume que es el ID primario de la tabla (entero).
   * @param {string | number} id - ID del usuario (UUID de auth.users o ID entero de users_user)
   * @returns {Promise<UserProfile>} - Promesa con el usuario
   */
  getUserById: async (id: string | number): Promise<UserProfile> => {
    let query = supabase
      .from('users_user')
      .select('*, users_worker(*), users_actor(*)'); // Ensure we fetch related worker/actor data
    
    if (typeof id === 'string') {
      query = query.eq('auth_user_id', id);
    } else {
      query = query.eq('id', id);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      console.error(`Error al obtener usuario con ID ${id}:`, error);
      throw error;
    }

    if (!data) { // Should not happen if .single() and no error, but good practice
      throw new Error(`No user data found for ID ${id}`);
    }

    // Determinamos el tipo de usuario (same logic as in getCurrentUser)
    let userType: UserProfile['userType'] = 'user';
    if (data.users_worker) {
      userType = data.users_worker.is_admin ? 'admin' : 'worker';
    } else if (data.users_actor) {
      userType = 'actor';
    }
    
    return {
      ...data,
      userType
    } as UserProfile;
  },

  /**
   * Obtener el usuario actual basado en la autenticación
   * @returns {Promise<UserProfile | null>} - Promesa con el usuario actual
   */
  getCurrentUser: async (): Promise<UserProfile | null> => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser(); // Use .getUser() for current user
    
    if (!supabaseUser) {
      return null;
    }
    
    // Luego obtenemos los datos del usuario de nuestra tabla users_user usando auth_user_id
    try {
      const { data, error } = await supabase
        .from('users_user')
        .select('*, users_worker(*), users_actor(*)')
        .eq('auth_user_id', supabaseUser.id) // Query by auth_user_id
        .single();
      
      if (error) {
        // If no profile found, it's not necessarily a critical error for this function,
        // as AuthContext might handle it. But we should log it.
        console.warn('No user_user profile found for auth_user_id:', supabaseUser.id, error.message);
        // Depending on strictness, you might throw or return null.
        // For now, let's rethrow so AuthContext knows it failed.
        throw error; 
      }
      
      // Determinamos el tipo de usuario
      let userType: UserProfile['userType'] = 'user';
      if (data.users_worker) {
        userType = data.users_worker.is_admin ? 'admin' : 'worker';
      } else if (data.users_actor) {
        userType = 'actor';
      }
      
      return {
        ...data,
        userType
      } as UserProfile;
    } catch (error) {
      console.error('Error al obtener el usuario actual:', error);
      return null;
    }
  },

  /**
   * Actualizar un usuario
   * @param {number} id - ID del usuario
   * @param {Partial<UserProfile>} userData - Datos del usuario a actualizar
   * @returns {Promise<UserProfile>} - Promesa con el usuario actualizado
   */
  updateUser: async (id: number, userData: Partial<UserProfile>): Promise<UserProfile> => {
    const { data, error } = await supabase
      .from('users_user')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error al actualizar usuario con ID ${id}:`, error);
      throw error;
    }
    
    return data as UserProfile;
  },

  /**
   * Crear un nuevo perfil de usuario después del registro
   * @param {NewUserProfileData} userData - Datos del usuario
   * @returns {Promise<UserProfile>} - Promesa con el usuario creado
   */
  createUserProfile: async (userData: NewUserProfileData): Promise<UserProfile> => {
    const supabaseUser = await supabase.auth.getUser(); // Corrected to get current user from auth
    
    if (!supabaseUser.data.user) {
      throw new Error('No hay usuario autenticado');
    }

    const profileToInsert = {
      auth_user_id: supabaseUser.data.user.id,
      email: userData.email,
      nombre: userData.nombre,
      cedula: userData.cedula,
      phone_number: userData.phoneNumber,
      is_superuser: userData.is_superuser || false,
      is_staff: userData.is_staff || false,
      // 'userType' was here, but it's not in the users_user table schema.
      // 'id' (serial) will be auto-generated
      // 'last_login' is nullable
    };

    console.log("userService.createUserProfile: Attempting to insert profile (userType field removed from payload):", profileToInsert);

    // Step 1: Insert the profile
    const { error } = await supabase
      .from('users_user')
      .insert(profileToInsert);
    
    if (error) {
      console.error('Error al crear perfil de usuario (direct insert error):', error);
      throw error;
    }
    
    // If insert was successful, we can assume the data is there.
    // For the return type, we might need to fetch it separately or adjust expectations.
    // For now, let's return the input data combined with a dummy ID or fetch it.
    // To fulfill the Promise<UserProfile> return type, we need to be careful.
    // Let's try fetching it after the insert, as a separate step for diagnosis.
    
    console.log("Insert into users_user reported no error. Fetching the new profile...");
    const { data: newProfile, error: fetchError } = await supabase
      .from('users_user')
      .select('*')
      .eq('auth_user_id', supabaseUser.data.user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching profile after insert:', fetchError);
      throw fetchError;
    }
    if (!newProfile) {
      console.error('Profile not found after insert, despite no insert error.');
      throw new Error('Profile could not be verified after creation.');
    }
    
    console.log("Successfully created and fetched profile:", newProfile);
    return newProfile as UserProfile;
  }
};

export default userService; 