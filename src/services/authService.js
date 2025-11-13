import { supabase } from '../lib/supabase';

export const authService = {
  // Iniciar sesión con email y password
  signInWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },
  
  // Registrar un nuevo usuario
  signUp: async (email, password, userData) => {
    // Primero registrar en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: userData.nombre,
          cedula: userData.cedula,
          phone_number: userData.phone_number,
        },
      },
    });
    
    if (authError) throw authError;
    
    // Luego, insertar datos adicionales en la tabla users
    if (authData.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          nombre: userData.nombre,
          cedula: userData.cedula,
          email: email,
          phone_number: userData.phone_number,
          is_staff: false,
        });
      
      if (userError) throw userError;
    }
    
    return authData;
  },
  
  // Cerrar sesión
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  // Obtener el usuario actual
  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
  
  // Actualizar perfil de usuario
  updateProfile: async (userData) => {
    const { error } = await supabase.auth.updateUser({
      data: userData,
    });
    
    if (error) throw error;
    
    // También actualizar en la tabla users
    const { error: userError } = await supabase
      .from('users')
      .update(userData)
      .eq('id', (await supabase.auth.getUser()).data.user.id);
    
    if (userError) throw userError;
    
    return true;
  },
};

export default authService; 