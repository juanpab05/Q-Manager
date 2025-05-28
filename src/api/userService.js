import supabase from '../utils/supabaseClient';

// Obtener usuario por ID
export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error(`Error al obtener usuario con ID ${userId}:`, error);
      throw error;
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
      .single();

    if (userError) throw userError;

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
};

// Actualizar datos del actor
export const updateActor = async (userId, actorData) => {
  const { data, error } = await supabase
    .from('actors')
    .update(actorData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error(`Error al actualizar actor con ID ${userId}:`, error);
    throw error;
  }

  return data;
};

// Actualizar datos del trabajador
export const updateWorker = async (userId, workerData) => {
  const { data, error } = await supabase
    .from('workers')
    .update(workerData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error(`Error al actualizar trabajador con ID ${userId}:`, error);
    throw error;
  }

  return data;
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
  // Log para verificar el usuario autenticado actual
  let currentUserInfo = null;
  try {
    const { data: { user: userInfo }, error: authUserError } = await supabase.auth.getUser();
    if (authUserError) {
      console.error('[userService] Error getting current auth user for RLS check:', authUserError);
    } else {
      currentUserInfo = userInfo;
      console.log('[userService] Current auth.uid() for RLS check during registration:', currentUserInfo?.id);
    }
  } catch (e) {
    console.error('[userService] Exception while trying to get current auth user:', e);
  }

  // Verificar permisos para creación de trabajadores
  if (userType === 'worker' && currentUserInfo) {
    const { data: currentUserData, error: currentUserError } = await supabase
      .from('users')
      .select('is_superuser')
      .eq('id', currentUserInfo.id)
      .single();
    
    if (currentUserError) {
      console.error('[userService] Error verificando si el usuario actual es superusuario:', currentUserError);
      throw new Error('Error al verificar permisos de administrador.');
    }
    
    if (!currentUserData || !currentUserData.is_superuser) {
      console.error('[userService] El usuario actual no tiene permisos de superusuario para crear trabajadores.');
      throw new Error('No tienes permisos para registrar trabajadores. Se requiere ser administrador.');
    }
    
    console.log('[userService] Verificación de superusuario exitosa:', currentUserData);
  }

  // 1. Registrar el usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });

  if (authError) {
    console.error('Error al registrar usuario en Auth:', authError);
    throw authError;
  }

  const userId = authData.user.id;

  try {
    // 2. Insertar en la tabla users
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        nombre: userData.nombre,
        cedula: userData.cedula,
        email: userData.email,
        phone_number: userData.phone_number || '',
        is_staff: userType === 'worker',
        is_superuser: userType === 'worker' && userData.is_admin === true
      }]);

    if (userError) throw userError;

    // 3. Insertar en la tabla correspondiente según el tipo de usuario
    if (userType === 'actor') {
      // Solo agregamos a la tabla actors si es un actor (no un worker)
      const result = await ensureUserInActors(
        userId, 
        userData.has_priority || false, 
        userData.motive || ''
      );
      
      if (!result.success) {
        throw new Error(`Error al asegurarse que el usuario esté en la tabla actors: ${result.message}`);
      }
      
      console.log(`[userService] Usuario ${userId} ${result.was_created ? 'añadido a' : 'actualizado en'} la tabla actors`);
    } else if (userType === 'worker') {
      // Código para creación de workers
      console.log('[userService] Intentando insertar en workers con payload:', { 
        user_id: userId,
        is_admin: userData.is_admin 
      });
      
      // Llamamos a una función de Postgres para hacer la inserción de manera privilegiada
      const { data: rpcResponse, error: rpcError } = await supabase.rpc('insert_worker', {
        p_user_id: userId,
        p_is_admin: userData.is_admin || false
      });

      if (rpcError) {
        console.error('[userService] Error al llamar función RPC para insertar trabajador:', JSON.stringify(rpcError, null, 2));
        
        // Intento alternativo: inserción directa 
        console.log('[userService] Intentando inserción directa en workers como alternativa...');
        const { data: workerDataResponse, error: workerError } = await supabase
          .from('workers')
          .insert([{
            user_id: userId,
            is_admin: userData.is_admin || false
          }])
          .select();

        if (workerError) {
          console.error('[userService] Error al insertar en la tabla workers:', JSON.stringify(workerError, null, 2));
          throw workerError;
        }
        console.log('[userService] Inserción directa exitosa:', workerDataResponse);
      } else {
        console.log('[userService] Inserción mediante RPC exitosa:', rpcResponse);
      }
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

// Sync all missing users to actors table
export const syncMissingUsersToActors = async () => {
  try {
    console.log('[userService] Calling sync_missing_users_to_actors RPC function');
    
    try {
      // First attempt: Try to use the RPC function
      const { data, error } = await supabase.rpc('sync_missing_users_to_actors');
      
      if (error) {
        console.error('[userService] Error calling sync_missing_users_to_actors RPC:', error);
        throw error;
      }
      
      console.log('[userService] Sync results:', data);
      const countAdded = data ? data.filter(item => item.was_added).length : 0;
      
      return {
        success: true,
        usersAdded: countAdded,
        details: data
      };
    } catch (rpcError) {
      // Fallback: If RPC fails, use direct SQL queries
      console.log('[userService] RPC failed, falling back to direct database operations for syncing');
      
      // 1. Get users that aren't in actors table
      const { data: usersNotInActors, error: usersError } = await supabase
        .from('users')
        .select('id')
        .not('id', 'in', supabase.from('actors').select('user_id'));
        
      if (usersError) {
        console.error('[userService] Error getting users not in actors:', usersError);
        throw usersError;
      }
      
      // 2. Get existing actors for filtering
      const { data: existingActors, error: actorsError } = await supabase
        .from('actors')
        .select('user_id');
        
      if (actorsError) {
        console.error('[userService] Error getting existing actors:', actorsError);
        throw actorsError;
      }
      
      // 3. Also exclude workers from being added
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select('user_id');
        
      if (workersError) {
        console.error('[userService] Error getting workers:', workersError);
        throw workersError;
      }
      
      const workerIds = (workers || []).map(w => w.user_id);
      
      // 4. Find users that need to be added (not in actors and not workers)
      const existingActorIds = (existingActors || []).map(a => a.user_id);
      const usersToAdd = (usersNotInActors || [])
        .filter(u => !existingActorIds.includes(u.id) && !workerIds.includes(u.id));
      
      console.log(`[userService] Found ${usersToAdd.length} users to add to actors table`);
      
      if (usersToAdd.length === 0) {
        return {
          success: true,
          usersAdded: 0,
          details: []
        };
      }
      
      // 5. Add users to actors table
      const { data: insertedData, error: insertError } = await supabase
        .from('actors')
        .insert(usersToAdd.map(u => ({
          user_id: u.id,
          has_priority: false,
          motive: null
        })))
        .select();
        
      if (insertError) {
        console.error('[userService] Error inserting users into actors table:', insertError);
        throw insertError;
      }
      
      return {
        success: true,
        usersAdded: usersToAdd.length,
        details: insertedData
      };
    }
  } catch (error) {
    console.error('[userService] Exception in syncMissingUsersToActors:', error);
    return {
      success: false,
      usersAdded: 0,
      error: error.message || 'Unknown error'
    };
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
  syncMissingUsersToActors,
  updateActorProfileRpc,
  cleanupWorkersFromActors,
  manualDeleteUserReferences
};

export default userService;