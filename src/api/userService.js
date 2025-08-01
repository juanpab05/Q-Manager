import supabase from '../utils/supabaseClient';

// Obtener usuario por ID
export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(`Error al obtener usuario con ID ${userId}:`, error);
      
      // Si es un error de RLS, 406, o PGRST116 (no rows), tratar como usuario no encontrado
      if (error.code === '42501' || error.status === 406 || error.code === 'PGRST116') {
        console.log(`Usuario con ID ${userId} no encontrado (código: ${error.code}) - tratando como nuevo usuario`);
        return null;
      }
      
      throw error;
    }

    if (!data) {
      console.log(`Usuario con ID ${userId} no encontrado en la base de datos`);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error al obtener usuario con ID ${userId}:`, error);
    throw error;
  }
};

// Obtener perfil completo (usuario + actor/worker)
export const getUserProfile = async (userId) => {
  try {
    // Primero obtenemos los datos básicos del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError) throw userError;

    if (!userData) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificamos si es un actor
    const { data: actorData, error: actorError } = await supabase
      .from('actors')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // El error PGRST116 significa que no se encontraron filas, lo cual es normal si no es actor
    if (actorError && actorError.code !== 'PGRST116') throw actorError;

    // Verificamos si es un trabajador
    const { data: workerData, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // El error PGRST116 significa que no se encontraron filas, lo cual es normal si no es trabajador
    if (workerError && workerError.code !== 'PGRST116') throw workerError;

    // Combinamos la información
    return {
      ...userData,
      actor: actorData || null,
      worker: workerData || null,
      isActor: !!actorData,
      isWorker: !!workerData,
      isAdmin: workerData?.is_admin || false
    };
  } catch (error) {
    console.error('Error al cargar perfil de usuario:', error);
    throw error;
  }
};

// Actualizar datos del usuario
export const updateUser = async (userId, userData) => {
  try {
    // First check if the user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      console.error(`Error al verificar si el usuario con ID ${userId} existe:`, checkError);
      throw checkError;
    }

    if (!existingUser) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    // Now update the user
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`Error al actualizar usuario con ID ${userId}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error al actualizar usuario con ID ${userId}:`, error);
    throw error;
  }
};

// Actualizar datos del actor
export const updateActor = async (userId, actorData) => {
  try {
    // First check if the actor exists
    const { data: existingActor, error: checkError } = await supabase
      .from('actors')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error(`Error al verificar si el actor con user_id ${userId} existe:`, checkError);
      throw checkError;
    }

    if (!existingActor) {
      throw new Error(`Actor con user_id ${userId} no encontrado`);
    }

    // Now update the actor
    const { data, error } = await supabase
      .from('actors')
      .update(actorData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error(`Error al actualizar actor con user_id ${userId}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error al actualizar actor con user_id ${userId}:`, error);
    throw error;
  }
};

// Actualizar datos del trabajador
export const updateWorker = async (userId, workerData) => {
  try {
    // First check if the worker exists
    const { data: existingWorker, error: checkError } = await supabase
      .from('workers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error(`Error al verificar si el trabajador con user_id ${userId} existe:`, checkError);
      throw checkError;
    }

    if (!existingWorker) {
      throw new Error(`Trabajador con user_id ${userId} no encontrado`);
    }

    // Now update the worker
    const { data, error } = await supabase
      .from('workers')
      .update(workerData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error(`Error al actualizar trabajador con user_id ${userId}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error al actualizar trabajador con user_id ${userId}:`, error);
    throw error;
  }
};

// Ensure a user exists in the actors table
export const ensureUserInActors = async (userId, hasPriority = false, motive = '') => {
  try {
    console.log(`[userService] Ensuring user ${userId} is in actors table with priority=${hasPriority}, motive=${motive}`);
    
    try {
      // First attempt: Try calling the RPC function
      const { data, error } = await supabase.rpc('ensure_user_in_actors', {
        p_user_id: userId,
        p_has_priority: hasPriority,
        p_motive: motive
      });
      
      if (error) {
        console.error('[userService] Error calling ensure_user_in_actors RPC:', error);
        throw error;
      }
      
      console.log('[userService] ensure_user_in_actors result:', data);
      return data;
    } catch (rpcError) {
      // Fallback: If RPC fails, use direct database operations with appropriate error handling
      console.log('[userService] RPC failed, falling back to direct database operations');
      
      // First check if the actor already exists
      const { data: existingActor, error: checkError } = await supabase
        .from('actors')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[userService] Error checking if actor exists:', checkError);
        throw checkError;
      }
      
      if (existingActor) {
        // Actor exists, update it
        console.log('[userService] Actor exists, updating priority data');
        const { data: updatedActor, error: updateError } = await supabase
          .from('actors')
          .update({
            has_priority: hasPriority,
            motive: hasPriority ? motive : existingActor.motive
          })
          .eq('user_id', userId)
          .select()
          .single();
          
        if (updateError) {
          console.error('[userService] Error updating actor:', updateError);
          throw updateError;
        }
        
        return {
          success: true,
          message: 'Usuario ya existía en la tabla actors, actualizado si era necesario',
          actor: updatedActor,
          was_created: false
        };
      } else {
        // Actor doesn't exist, create it
        console.log('[userService] Actor does not exist, creating new record');
        const { data: newActor, error: insertError } = await supabase
          .from('actors')
          .insert([{
            user_id: userId,
            has_priority: hasPriority,
            motive: motive
          }])
          .select()
          .single();
          
        if (insertError) {
          console.error('[userService] Error inserting actor:', insertError);
          throw insertError;
        }
        
        return {
          success: true,
          message: 'Usuario añadido a la tabla actors',
          actor: newActor,
          was_created: true
        };
      }
    }
  } catch (error) {
    console.error('[userService] Exception in ensureUserInActors:', error);
    throw error;
  }
};

// Sync all users to actors table (admin only)
export const syncAllUsersToActors = async () => {
  try {
    const { data, error } = await supabase.rpc('sync_all_users_to_actors');
    
    if (error) {
      console.error('[userService] Error calling sync_all_users_to_actors RPC:', error);
      throw error;
    }
    
    console.log('[userService] sync_all_users_to_actors result:', data);
    return data;
  } catch (error) {
    console.error('[userService] Exception in syncAllUsersToActors:', error);
    throw error;
  }
};

// Registrar un nuevo usuario
export const registerUser = async (userData, userType = 'actor') => {
  console.log(`[userService] Iniciando registro de usuario tipo: ${userType}`);
  
  // Solo verificar permisos para creación de trabajadores
  if (userType === 'worker') {
    try {
      const { data: { user: currentUserInfo }, error: authUserError } = await supabase.auth.getUser();
      
      if (authUserError || !currentUserInfo) {
        throw new Error('Debes estar autenticado como administrador para crear trabajadores.');
      }

      const { data: currentUserData, error: currentUserError } = await supabase
        .from('users')
        .select('is_superuser')
        .eq('id', currentUserInfo.id)
        .single();
      
      if (currentUserError) {
        console.error('[userService] Error verificando permisos de administrador:', currentUserError);
        throw new Error('Error al verificar permisos de administrador.');
      }
      
      if (!currentUserData || !currentUserData.is_superuser) {
        throw new Error('No tienes permisos para registrar trabajadores. Se requiere ser administrador.');
      }
      
      console.log('[userService] Verificación de superusuario exitosa');
    } catch (error) {
      console.error('[userService] Error en verificación de permisos:', error);
      throw error;
    }
  }

  // 1. Registrar el usuario en Supabase Auth
  console.log('[userService] Registrando usuario en Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        nombre: userData.nombre,
        cedula: userData.cedula,
        phone_number: userData.phone_number || ''
      }
    }
  });

  if (authError) {
    console.error('[userService] Error al registrar usuario en Auth:', authError);
    throw authError;
  }

  const userId = authData.user.id;
  console.log(`[userService] Usuario creado en Auth con ID: ${userId}`);

  try {
    // 2. Para usuarios regulares, el perfil se creará automáticamente en AuthContext
    // cuando el usuario inicie sesión por primera vez
    if (userType === 'actor') {
      console.log('[userService] Usuario regular registrado. El perfil se creará automáticamente al iniciar sesión.');
      return {
        userId,
        success: true,
        message: 'Usuario registrado exitosamente. Verifique su correo electrónico.'
      };
    }

    // 3. Para workers, crear el perfil inmediatamente usando RPC
    if (userType === 'worker') {
      console.log('[userService] Creando perfil de trabajador...');
      
      // Insertar en la tabla users usando RPC que bypass RLS
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          nombre: userData.nombre,
          cedula: userData.cedula,
          email: userData.email,
          phone_number: userData.phone_number || '',
          is_staff: true,
          is_superuser: userData.is_admin === true
        }]);

      if (userError) {
        console.error('[userService] Error insertando trabajador en users:', userError);
        throw userError;
      }
      
      // Crear registro en workers
      console.log('[userService] Intentando insertar en workers...');
      const { data: rpcResponse, error: rpcError } = await supabase.rpc('insert_worker', {
        p_user_id: userId,
        p_is_admin: userData.is_admin || false
      });

      if (rpcError) {
        console.error('[userService] Error al llamar función RPC para insertar trabajador:', rpcError);
        throw rpcError;
      }
      
      console.log('[userService] Trabajador creado exitosamente:', rpcResponse);
    }

    return {
      userId,
      success: true
    };
  } catch (error) {
    console.error('Error al registrar usuario en la base de datos:', error);
    // Intentar revertir el registro de auth en caso de error
    try {
      // Esto requeriría privilegios administrativos, lo cual podría no ser posible en el cliente
      // En una implementación real, esto debería manejarse con una función de Cloud Function o similar
      console.log('Se debería eliminar el usuario auth con ID:', userId);
    } catch (cleanupError) {
      console.error('Error al intentar limpiar el usuario auth:', cleanupError);
    }
    throw error;
  }
};

// Obtener todos los trabajadores
export const getWorkers = async () => {
  const { data, error } = await supabase
    .from('workers')
    .select(`
      *,
      user:users!user_id(
        id,
        nombre,
        email,
        phone_number
      )
    `);

  if (error) {
    console.error('Error al obtener trabajadores:', error);
    throw error;
  }

  return data;
};

// Interfaz para Usuario
export const User = {
  id: '',
  nombre: '',
  email: '',
  cedula: '',
  phone_number: '',
  is_staff: false,
  is_superuser: false
};

// Obtener todos los trabajadores (alias para mantener compatibilidad)
export const getAllWorkers = async () => {
  const { data, error } = await supabase
    .from('workers')
    .select(`
      *,
      user:users!user_id(
        id,
        nombre,
        email,
        cedula,
        phone_number
      )
    `);

  if (error) {
    console.error('Error al obtener trabajadores:', error);
    throw error;
  }
  
  // Transformar datos para que sean compatibles con la interfaz anterior
  return data.map(worker => ({
    id: worker.user_id, // ID principal es el ID del usuario
    worker_id: worker.id, // Guardamos el ID del trabajador como worker_id
    nombre: worker.user?.nombre || 'Sin nombre',
    email: worker.user?.email || '',
    cedula: worker.user?.cedula || '',
    phone_number: worker.user?.phone_number || '',
    is_admin: worker.is_admin || false,
    role: 'worker'
  }));
};

// Función para eliminar usuarios de autenticación (requiere permisos de admin o una función RPC)
export const deleteAuthUsers = async (userIds) => {
  try {
    console.log('[userService] Attempting to delete auth users with IDs:', userIds);
    
    // Intentar usar la función RPC para eliminar los usuarios de auth
    const { data, error } = await supabase.rpc('delete_auth_users', {
      p_user_ids: userIds
    });
    
    if (error) {
      console.error('[userService] Error calling delete_auth_users RPC:', error);
      throw error;
    }
    
    console.log('[userService] Auth users deletion result:', data);
    return data;
  } catch (error) {
    console.error('[userService] Error in deleteAuthUsers:', error);
    // No lanzamos el error, solo lo registramos para no interrumpir el flujo principal
    return {
      success: false,
      message: error.message || 'Error al eliminar usuarios de autenticación'
    };
  }
};

// Eliminar uno o varios usuarios
export const deleteUsers = async (userIds) => {
  try {
    console.log('[userService] Deleting users with IDs:', userIds);
    
    // 1. Intentar usar la función RPC para limpiar todas las referencias
    try {
      const { data: cleanupResult, error: cleanupError } = await supabase.rpc('clean_up_user_references', {
        p_user_ids: userIds
      });
      
      if (cleanupError) {
        console.error('[userService] Error calling clean_up_user_references RPC:', cleanupError);
        // Si falla la función RPC, recurrimos al método manual
        await manualDeleteUserReferences(userIds);
      } else {
        console.log('[userService] Successfully cleaned up user references:', cleanupResult);
        // No necesitamos hacer nada más si la función RPC fue exitosa
        return { success: true, deletedCount: userIds.length, details: cleanupResult };
      }
    } catch (rpcError) {
      console.error('[userService] Exception in clean_up_user_references RPC:', rpcError);
      // Si hay una excepción con la función RPC, recurrimos al método manual
      await manualDeleteUserReferences(userIds);
    }

    // 5. Intentar limpiar registros de autenticación utilizando la función deleteAuthUsers
    try {
      const authDeletionResult = await deleteAuthUsers(userIds);
      if (!authDeletionResult.success) {
        console.warn('[userService] Note: Auth records could not be deleted:', authDeletionResult.message);
      }
    } catch (authError) {
      console.warn('[userService] Error trying to delete auth users:', authError);
      // Continuamos aunque falle la eliminación de auth users
    }
    
    console.log(`[userService] Successfully deleted ${userIds.length} users`);
    return { success: true, deletedCount: userIds.length };
  } catch (error) {
    console.error('[userService] Error in deleteUsers:', error);
    throw error;
  }
};

// Función auxiliar para eliminar manualmente todas las referencias de un usuario
const manualDeleteUserReferences = async (userIds) => {
  try {
    // 1. Verificar si algún usuario es trabajador para eliminar de la tabla 'workers'
    const { data: workersToDelete, error: workersError } = await supabase
      .from('workers')
      .select('user_id')
      .in('user_id', userIds);
      
    if (workersError) {
      console.error('[userService] Error checking workers for deletion:', workersError);
      throw workersError;
    }
    
    if (workersToDelete && workersToDelete.length > 0) {
      console.log(`[userService] Deleting ${workersToDelete.length} workers records`);
      
      // Eliminar registros de workers directamente por user_id
      const { error: deleteWorkersError } = await supabase
        .from('workers')
        .delete()
        .in('user_id', userIds);
        
      if (deleteWorkersError) {
        console.error('[userService] Error deleting worker records:', deleteWorkersError);
        throw deleteWorkersError;
      }
    }
    
    // 2. Verificar si algún usuario es actor para eliminar de la tabla 'actors'
    const { data: actorsToDelete, error: actorsError } = await supabase
      .from('actors')
      .select('id, user_id')
      .in('user_id', userIds);
      
    if (actorsError) {
      console.error('[userService] Error checking actors for deletion:', actorsError);
      throw actorsError;
    }
    
    if (actorsToDelete && actorsToDelete.length > 0) {
      console.log(`[userService] Deleting ${actorsToDelete.length} actor records`);
      const actorIds = actorsToDelete.map(a => a.id);
      
      // Eliminar registros de actors
      const { error: deleteActorsError } = await supabase
        .from('actors')
        .delete()
        .in('id', actorIds);
        
      if (deleteActorsError) {
        console.error('[userService] Error deleting actor records:', deleteActorsError);
        throw deleteActorsError;
      }
    }

    // 3. Verificar si hay otras tablas relacionadas a users y eliminar esas referencias
    // Este código se deja comentado porque la tabla access_point_users no existe
    // Se debe adaptar a las tablas específicas de la aplicación
    /*
    try {
      // Obtener información sobre otras tablas relacionadas con los usuarios
      const { data: otherTableData, error: otherTableError } = await supabase
        .from('other_table_name')
        .select('id, user_id')
        .in('user_id', userIds);
        
      if (otherTableError) {
        console.warn('[userService] Error checking other_table_name:', otherTableError);
      } else if (otherTableData && otherTableData.length > 0) {
        console.log(`[userService] Deleting ${otherTableData.length} other table references`);
        
        // Eliminar registros de la otra tabla
        const { error: deleteOtherTableError } = await supabase
          .from('other_table_name')
          .delete()
          .in('user_id', userIds);
          
        if (deleteOtherTableError) {
          console.warn('[userService] Error deleting other_table_name:', deleteOtherTableError);
        }
      }
    } catch (relatedTablesError) {
      console.warn('[userService] Error handling related tables:', relatedTablesError);
    }
    */

    // 4. Finalmente, eliminar los usuarios de la tabla 'users'
    const { error: deleteUsersError } = await supabase
      .from('users')
      .delete()
      .in('id', userIds);
      
    if (deleteUsersError) {
      console.error('[userService] Error deleting user records:', deleteUsersError);
      throw deleteUsersError;
    }
    
    return true;
  } catch (error) {
    console.error('[userService] Error in manualDeleteUserReferences:', error);
    throw error;
  }
};

// Obtener todos los Actores (usuarios que no son workers)
export const getActors = async () => {
  try {
    // Intentamos primero el método directo
    const { data, error } = await supabase
      .from('actors')
      .select(`
        *,
        user:users!user_id(
          id,
          nombre,
          email,
          cedula,
          phone_number
        )
      `);

    if (error) {
      console.error('Error al obtener actores mediante select directo:', error);
      
      // Si falla, intentamos usando la función RPC que hemos creado
      console.log('Intentando obtener actores mediante función RPC...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_actors');
      
      if (rpcError) {
        console.error('Error al obtener actores mediante RPC:', rpcError);
        throw rpcError;
      }
      
      // Si la función RPC fue exitosa, devolvemos los datos
      console.log('Obtención de actores mediante RPC exitosa');
      return rpcData || [];
    }

    // Ahora necesitamos excluir a los usuarios que también son trabajadores
    // Primero obtenemos los IDs de los workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('user_id');

    if (workersError) {
      console.error('Error al obtener IDs de workers:', workersError);
      throw workersError;
    }

    // Crear un array con los user_ids de los workers
    const workerIds = workers.map(worker => worker.user_id);

    // Filtrar datos para excluir a los workers
    const filteredData = data.filter(actor => !workerIds.includes(actor.user_id));

    // Transformamos los datos para manejar mejor la estructura en el frontend
    const transformedData = filteredData.map(actor => ({
      id: actor.user_id,
      actor_id: actor.id,
      nombre: actor.user?.nombre || 'Sin nombre',
      email: actor.user?.email || '',
      cedula: actor.user?.cedula || '',
      phone_number: actor.user?.phone_number || '',
      has_priority: actor.has_priority || false,
      motive: actor.motive || '',
      actor: {
        user_id: actor.user_id,
        has_priority: actor.has_priority || false,
        motive: actor.motive || ''
      }
    }));
    
    // Eliminar duplicados basados en el ID de usuario
    const uniqueUserIds = new Set();
    const uniqueActors = transformedData.filter(actor => {
      if (uniqueUserIds.has(actor.id)) {
        return false; // Ya existe este ID, filtrar este duplicado
      } else {
        uniqueUserIds.add(actor.id);
        return true; // Primer registro con este ID, mantenerlo
      }
    });
    
    console.log(`[userService] Filtrado ${transformedData.length - uniqueActors.length} actores duplicados`);
    
    return uniqueActors;
  } catch (error) {
    console.error('Error al obtener actores:', error);
    throw error;
  }
};



// Function to call the RPC for updating actor profile
export const updateActorProfileRpc = async (userId, actorData) => {
  if (!userId || !actorData) {
    console.error('[userService.updateActorProfileRpc] Missing userId or actorData');
    throw new Error('User ID and Actor Data are required to update actor profile via RPC.');
  }

  try {
    // First check for duplicate actors for this user_id
    const { data: duplicateCheck, error: checkError } = await supabase
      .from('actors')
      .select('id, user_id')
      .eq('user_id', userId);
    
    if (checkError) {
      console.error(`[userService.updateActorProfileRpc] Error checking for duplicate actors:`, checkError);
      throw checkError;
    }
    
    // If multiple actors found for this user_id, clean them up
    if (duplicateCheck && duplicateCheck.length > 1) {
      console.warn(`[userService.updateActorProfileRpc] Found ${duplicateCheck.length} actor records for user ${userId}, cleaning up...`);
      
      // Keep the first record, delete the rest
      const keepId = duplicateCheck[0].id;
      const deleteIds = duplicateCheck.slice(1).map(a => a.id);
      
      // Delete duplicate records
      const { error: deleteError } = await supabase
        .from('actors')
        .delete()
        .in('id', deleteIds);
        
      if (deleteError) {
        console.error(`[userService.updateActorProfileRpc] Error deleting duplicate actors:`, deleteError);
        throw deleteError;
      }
      
      console.log(`[userService.updateActorProfileRpc] Successfully deleted ${deleteIds.length} duplicate actor records`);
      
      // Verify cleanup was successful
      const { data: verifyCheck, error: verifyError } = await supabase
        .from('actors')
        .select('id, user_id')
        .eq('user_id', userId);
        
      if (verifyError) {
        console.error(`[userService.updateActorProfileRpc] Error verifying cleanup:`, verifyError);
        throw verifyError;
      }
      
      if (verifyCheck && verifyCheck.length > 1) {
        console.error(`[userService.updateActorProfileRpc] Cleanup failed, still found ${verifyCheck.length} actor records for user ${userId}`);
        
        // More aggressive cleanup approach - delete ALL actor records for this user and recreate one
        const { error: deleteAllError } = await supabase
          .from('actors')
          .delete()
          .eq('user_id', userId);
          
        if (deleteAllError) {
          console.error(`[userService.updateActorProfileRpc] Error deleting all actor records:`, deleteAllError);
          throw new Error('Failed to clean up duplicate actor records completely.');
        }
        
        // Create a single new record
        const { data: newActor, error: insertError } = await supabase
          .from('actors')
          .insert([{
            user_id: userId,
            has_priority: actorData.has_priority,
            motive: actorData.motive
          }])
          .select();
          
        if (insertError) {
          console.error(`[userService.updateActorProfileRpc] Error creating new actor record:`, insertError);
          throw new Error('Failed to create new actor record after cleanup.');
        }
        
        console.log(`[userService.updateActorProfileRpc] Created new clean actor record:`, newActor);
        
        // Return success since we just created the record with the data we wanted to update
        return {
          success: true,
          message: 'Actor profile was recreated with the new data after cleanup',
          actor: newActor[0]
        };
      }
    } else if (!duplicateCheck || duplicateCheck.length === 0) {
      // No actor record exists, create one
      console.log(`[userService.updateActorProfileRpc] No actor record found for user ${userId}, creating one`);
      
      const { data: newActor, error: insertError } = await supabase
        .from('actors')
        .insert([{
          user_id: userId,
          has_priority: actorData.has_priority,
          motive: actorData.motive
        }])
        .select();
        
      if (insertError) {
        console.error(`[userService.updateActorProfileRpc] Error creating actor record:`, insertError);
        throw new Error('Failed to create new actor record.');
      }
      
      console.log(`[userService.updateActorProfileRpc] Created new actor record:`, newActor);
      
      // Return success since we just created the record with the data we wanted to update
      return {
        success: true,
        message: 'Actor profile was created with the new data',
        actor: newActor[0]
      };
    }

    // Now call the RPC function to update the actor profile
    try {
      const { data, error } = await supabase.rpc('update_actor_profile', {
        p_user_id: userId,
        p_actor_data: actorData // Should be { has_priority: BOOLEAN, motive: TEXT }
      });

      if (error) {
        console.error(`[userService.updateActorProfileRpc] RPC call failed for user ID ${userId}:`, error.message);
        
        // Fallback: If RPC fails, update directly
        console.log(`[userService.updateActorProfileRpc] Attempting direct update as fallback`);
        const { data: directUpdate, error: directError } = await supabase
          .from('actors')
          .update({
            has_priority: actorData.has_priority,
            motive: actorData.motive
          })
          .eq('user_id', userId)
          .select();
          
        if (directError) {
          console.error(`[userService.updateActorProfileRpc] Direct update failed:`, directError);
          throw new Error(`An unexpected error occurred during actor profile update. ${error.message}`);
        }
        
        return {
          success: true,
          message: 'Actor profile updated directly (RPC fallback)',
          actor: directUpdate[0]
        };
      }

      if (data && !data.success) {
        console.error(`[userService.updateActorProfileRpc] RPC call failed for user ID ${userId}:`, data.message, data.details);
        throw new Error(data.message || 'RPC call to update actor profile failed.');
      }
      
      console.log(`[userService.updateActorProfileRpc] RPC call successful for user ID ${userId}:`, data);
      return data;
    } catch (rpcError) {
      console.error(`[userService.updateActorProfileRpc] Error in RPC call:`, rpcError);
      throw rpcError;
    }
  } catch (error) {
    console.error(`[userService.updateActorProfileRpc] Error updating actor profile:`, error);
    throw error;
  }
};

// Clean up workers from actors table - this resolves issues where workers were incorrectly added to actors
export const cleanupWorkersFromActors = async () => {
  try {
    console.log('[userService] Starting cleanup of workers from actors table');
    
    // 1. Get all worker user IDs
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('user_id');
      
    if (workersError) {
      console.error('[userService] Error getting workers for cleanup:', workersError);
      throw workersError;
    }
    
    if (!workers || workers.length === 0) {
      console.log('[userService] No workers found, nothing to clean up');
      return {
        success: true,
        workersRemoved: 0,
        message: 'No workers found to remove from actors table'
      };
    }
    
    const workerIds = workers.map(w => w.user_id);
    console.log(`[userService] Found ${workerIds.length} workers to check for cleanup`);
    
    // 2. Find which worker IDs are also in actors table
    const { data: actorsToRemove, error: actorsError } = await supabase
      .from('actors')
      .select('id, user_id')
      .in('user_id', workerIds);
      
    if (actorsError) {
      console.error('[userService] Error finding actors to remove:', actorsError);
      throw actorsError;
    }
    
    if (!actorsToRemove || actorsToRemove.length === 0) {
      console.log('[userService] No workers found in actors table, nothing to clean up');
      return {
        success: true,
        workersRemoved: 0,
        message: 'No workers found in actors table'
      };
    }
    
    console.log(`[userService] Found ${actorsToRemove.length} workers incorrectly in actors table, removing...`);
    
    // 3. Delete the actors entries for these workers
    const actorIdsToRemove = actorsToRemove.map(a => a.id);
    const { data: deleteResult, error: deleteError } = await supabase
      .from('actors')
      .delete()
      .in('id', actorIdsToRemove)
      .select();
      
    if (deleteError) {
      console.error('[userService] Error deleting workers from actors table:', deleteError);
      throw deleteError;
    }
    
    console.log(`[userService] Successfully removed ${deleteResult ? deleteResult.length : 0} workers from actors table`);
    
    return {
      success: true,
      workersRemoved: deleteResult ? deleteResult.length : 0,
      message: `Successfully removed ${deleteResult ? deleteResult.length : 0} workers from actors table`
    };
  } catch (error) {
    console.error('[userService] Exception in cleanupWorkersFromActors:', error);
    return {
      success: false,
      workersRemoved: 0,
      error: error.message || 'Unknown error',
      message: 'Error cleaning up workers from actors table'
    };
  }
};

// Función para que administradores actualicen usuarios (bypass RLS)
export const updateUserAsAdmin = async (userId, userData) => {
  try {
    // Call RPC function that bypasses RLS for admin operations
    const { data, error } = await supabase.rpc('update_user_as_admin', {
      p_user_id: userId,
      p_user_data: userData
    });

    if (error) {
      console.error(`Error al actualizar usuario con ID ${userId} como admin:`, error);
      throw error;
    }

    if (!data || !data.success) {
      throw new Error(data?.message || 'Error al actualizar usuario');
    }

    return data.user;
  } catch (error) {
    console.error(`Error al actualizar usuario con ID ${userId} como admin:`, error);
    throw error;
  }
};

// Crear perfil completo para usuarios autenticados sin perfil en DB
export const createMissingUserProfile = async (authUser) => {
  try {
    console.log(`[userService] Creando perfil faltante para usuario autenticado: ${authUser.id}`);
    
    // Datos básicos del usuario desde auth
    const userData = {
      id: authUser.id,
      nombre: authUser.user_metadata?.nombre || authUser.email?.split('@')[0] || 'Usuario',
      cedula: authUser.user_metadata?.cedula || null,
      email: authUser.email,
      phone_number: authUser.user_metadata?.phone_number || authUser.phone || '',
      is_staff: false,
      is_superuser: false
    };

    // 1. Crear el registro en la tabla users
    console.log(`[userService] Insertando usuario en tabla users:`, userData);
    const { error: userError } = await supabase
      .from('users')
      .insert([userData]);

    if (userError) {
      // Si ya existe, puede que sea un error de inserción duplicada
      if (userError.code === '23505') { // Duplicate key error
        console.log(`[userService] Usuario ya existe en tabla users, continuando...`);
      } else {
        throw userError;
      }
    }

    // 2. Crear el registro en la tabla actors (usuarios regulares por defecto)
    console.log(`[userService] Asegurando que el usuario esté en la tabla actors`);
    const actorResult = await ensureUserInActors(authUser.id, false, '');
    
    if (!actorResult.success) {
      throw new Error(`Error al crear actor: ${actorResult.message}`);
    }

    console.log(`[userService] Perfil creado exitosamente para ${authUser.id}`);
    
    // 3. Retornar el perfil completo
    return await getUserProfile(authUser.id);
  } catch (error) {
    console.error(`[userService] Error creando perfil faltante:`, error);
    throw error;
  }
};

// Create the userService object for default export
const userService = {
  getUserById,
  getUserProfile,
  updateUser,
  updateActor,
  updateWorker,
  ensureUserInActors,
  syncAllUsersToActors,
  registerUser,
  getWorkers,
  getAllWorkers,
  deleteUsers,
  deleteAuthUsers,
  getActors,
  updateActorProfileRpc,
  cleanupWorkersFromActors,
  manualDeleteUserReferences,
  updateUserAsAdmin,
  createMissingUserProfile
};

export default userService;