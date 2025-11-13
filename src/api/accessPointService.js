import supabase from '../utils/supabaseClient';

// Obtener todos los puntos de acceso
export const getAccessPoints = async () => {
  const { data, error } = await supabase
    .from('access_points')
    .select(`
      *,
      worker:workers!worker_id(
        user_id,
        is_admin,
        user:users!user_id(
          id,
          nombre,
          email
        )
      )
    `);

  if (error) {
    console.error('Error al obtener puntos de acceso:', error);
    throw error;
  }

  // Debug the data structure
  console.log('[accessPointService] Access points data structure:', JSON.stringify(data, null, 2));

  return data;
};

// Alias para mantener compatibilidad con código existente
export const getAllAccessPoints = async () => {
  return getAccessPoints();
};

// Obtener puntos de acceso asignados a un trabajador
export const getWorkerAccessPoints = async (workerId) => {
  // Si no se proporciona workerId, intentamos obtener el del usuario autenticado
  if (!workerId) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }
    
    // Buscar el ID del trabajador asociado a este usuario
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    
    if (workerError) {
      console.error('Error al obtener datos del trabajador:', workerError);
      throw workerError;
    }
    
    workerId = worker.user_id;
  }
  
  // Obtener puntos de acceso asignados a este trabajador
  const { data, error } = await supabase
    .from('access_points')
    .select(`
      *,
      worker:workers!worker_id(
        user_id,
        is_admin,
        user:users!user_id(
          id,
          nombre,
          email
        )
      )
    `)
    .eq('worker_id', workerId);
    
  if (error) {
    console.error(`Error al obtener puntos de acceso del trabajador ${workerId}:`, error);
    throw error;
  }
  
  return data;
};

// Obtener punto de acceso por ID
export const getAccessPointById = async (id) => {
  const { data, error } = await supabase
    .from('access_points')
    .select(`
      *,
      worker:workers!worker_id(
        user_id,
        is_admin,
        user:users!user_id(
          id,
          nombre,
          email
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error al obtener punto de acceso con ID ${id}:`, error);
    throw error;
  }

  return data;
};

// Crear nuevo punto de acceso
export const createAccessPoint = async (accessPointData) => {
  const { data, error } = await supabase
    .from('access_points')
    .insert([accessPointData])
    .select()
    .single();

  if (error) {
    console.error('Error al crear punto de acceso:', error);
    throw error;
  }

  return data;
};

// Actualizar punto de acceso
export const updateAccessPoint = async (id, accessPointData) => {
  const { data, error } = await supabase
    .from('access_points')
    .update(accessPointData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error al actualizar punto de acceso con ID ${id}:`, error);
    throw error;
  }

  return data;
};

// Eliminar punto de acceso
export const deleteAccessPoint = async (id) => {
  const { error } = await supabase
    .from('access_points')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error al eliminar punto de acceso con ID ${id}:`, error);
    throw error;
  }

  return true;
};

// Asignar trabajador a un punto de acceso
export const assignWorkerToAccessPoint = async (accessPointId, workerId) => {
  console.log(`[accessPointService] Intentando asignar trabajador ${workerId} al punto de acceso ${accessPointId}`);
  
  try {
    // Usar la nueva función RPC que garantiza que un trabajador solo puede estar asignado a un punto de acceso
    const { data: rpcData, error: rpcError } = await supabase.rpc('assign_worker_with_constraint', {
      p_access_point_id: accessPointId,
      p_worker_id: workerId === "" ? null : workerId // Permitir desasignar trabajador enviando null
    });
    
    if (rpcError) {
      console.error(`[accessPointService] Error al llamar RPC para asignar trabajador con restricción:`, JSON.stringify(rpcError, null, 2));
      
      // Si el RPC falla, intentamos con el RPC anterior
      console.log(`[accessPointService] Intentando con el RPC anterior...`);
      
      const { data: fallbackData, error: fallbackError } = await supabase.rpc('assign_worker_to_access_point', {
        p_access_point_id: accessPointId,
        p_worker_id: workerId === "" ? null : workerId
      });
      
      if (fallbackError) {
        console.error(`[accessPointService] Error al llamar RPC alternativo:`, JSON.stringify(fallbackError, null, 2));
        
        // Si ambos RPCs fallan, intentamos actualización directa como último recurso
        console.log(`[accessPointService] Intentando actualización directa como último recurso...`);
        
  const { data, error } = await supabase
    .from('access_points')
          .update({ worker_id: workerId === "" ? null : workerId })
    .eq('id', accessPointId)
    .select()
    .single();
  
  if (error) {
          console.error(`[accessPointService] Error al asignar trabajador al punto de acceso:`, JSON.stringify(error, null, 2));
          throw error;
        }
        
        console.log(`[accessPointService] Asignación directa exitosa:`, data);
        return data;
      }
      
      console.log(`[accessPointService] Asignación mediante RPC alternativo exitosa:`, fallbackData);
      return fallbackData;
    }
    
    console.log(`[accessPointService] Asignación con restricción de único punto exitosa:`, rpcData);
    return rpcData;
  } catch (error) {
    console.error(`[accessPointService] Error al asignar trabajador ${workerId} al punto de acceso ${accessPointId}:`, error);
    throw error;
  }
};

// Abrir punto de acceso
export const openAccessPoint = async (id, workerId) => {
  const { data, error } = await supabase
    .from('access_points')
    .update({
      estado: 'ABIERTO',
      worker_id: workerId,
      fecha_inicio: new Date()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error al abrir punto de acceso con ID ${id}:`, error);
    throw error;
  }

  return data;
};

// Pausar punto de acceso
export const pauseAccessPoint = async (id) => {
  const { data, error } = await supabase
    .from('access_points')
    .update({
      estado: 'PAUSADO',
      fecha_pausa: new Date()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error al pausar punto de acceso con ID ${id}:`, error);
    throw error;
  }

  return data;
};

// Alternar pausa de punto de acceso
export const togglePauseAccessPoint = async (id) => {
  console.log(`[accessPointService] Alternando pausa del punto de acceso ${id}`);
  
  try {
    // Intentar usar la función RPC para alternar el estado de pausa
    const { data: rpcData, error: rpcError } = await supabase.rpc('toggle_access_point_pause', {
      p_access_point_id: id
    });
    
    if (rpcError) {
      console.error(`[accessPointService] Error al llamar RPC para alternar pausa:`, rpcError);
      
      // Fallback a la implementación anterior si el RPC falla
      console.log(`[accessPointService] Intentando alternar pausa mediante actualización directa...`);
      
  // Primero, obtener el estado actual
  const { data: currentAccessPoint, error: fetchError } = await supabase
    .from('access_points')
    .select('estado')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error(`Error al obtener estado del punto de acceso con ID ${id}:`, fetchError);
    throw fetchError;
  }

  const currentState = currentAccessPoint.estado;
  let newState;

  // Determinar el nuevo estado
  if (currentState === 'PAUSADO') {
    newState = 'ACTIVO';
  } else if (currentState === 'ACTIVO') {
    newState = 'PAUSADO';
  } else {
    // Si está cerrado, no se puede alternar, así que lo activamos
    newState = 'ACTIVO';
  }

  // Actualizar estado con los campos correspondientes
  const updateData = {
    estado: newState,
  };

  // Si entramos en pausa, actualizamos fecha_pausa
  if (newState === 'PAUSADO') {
    updateData.fecha_pausa = new Date().toISOString();
  }
  
  // Si entramos en activo, actualizamos fecha_inicio si estaba cerrado o quitamos fecha_pausa si estaba pausado
  if (newState === 'ACTIVO') {
    if (currentState === 'CERRADO') {
      updateData.fecha_inicio = new Date().toISOString();
    } else if (currentState === 'PAUSADO') {
      updateData.fecha_pausa = null;
    }
  }

  const { data, error } = await supabase
    .from('access_points')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error al alternar pausa del punto de acceso con ID ${id}:`, error);
    throw error;
  }

      console.log(`[accessPointService] Alternación directa exitosa:`, data);
  return data;
    }
    
    console.log(`[accessPointService] Alternación mediante RPC exitosa:`, rpcData);
    return rpcData;
  } catch (error) {
    console.error(`[accessPointService] Error al alternar pausa del punto de acceso ${id}:`, error);
    throw error;
  }
};

// Cerrar punto de acceso
export const closeAccessPoint = async (id) => {
  const { data, error } = await supabase
    .from('access_points')
    .update({
      estado: 'CERRADO',
      worker_id: null,
      fecha_inicio: null,
      fecha_pausa: null
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error al cerrar punto de acceso con ID ${id}:`, error);
    throw error;
  }

  return data;
};

// Incrementar contador de tickets atendidos
export const incrementTicketsAtendidos = async (id) => {
  // Primero obtenemos el valor actual
  const { data: current, error: fetchError } = await supabase
    .from('access_points')
    .select('tickets_atendidos')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error(`Error al obtener tickets atendidos del punto de acceso ${id}:`, fetchError);
    throw fetchError;
  }

  // Incrementamos el valor
  const nuevoValor = (current?.tickets_atendidos || 0) + 1;
  
  const { data, error } = await supabase
    .from('access_points')
    .update({ tickets_atendidos: nuevoValor })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error al actualizar tickets atendidos del punto de acceso ${id}:`, error);
    throw error;
  }

  return data;
};

// Obtener anuncios activos
export const getActiveAnnouncements = async () => {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      created_by:created_by_id(
        user_id,
        is_admin,
        user:user_id(
          id,
          nombre
        )
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener anuncios activos:', error);
    throw error;
  }

  return data;
};

// Atender el siguiente ticket en la cola
export const nextTicket = async (accessPointId) => {
  console.log(`[accessPointService] Obteniendo siguiente ticket para el punto de acceso ${accessPointId}`);
  
  try {
    // Primero obtenemos información sobre el punto de acceso para saber si es prioritario
    const { data: accessPoint, error: accessPointError } = await supabase
      .from('access_points')
      .select('is_priority')
      .eq('id', accessPointId)
      .single();
      
    if (accessPointError) {
      console.error(`[accessPointService] Error al obtener información del punto de acceso:`, accessPointError);
      throw accessPointError;
    }
    
    const isPriorityAccessPoint = accessPoint.is_priority;
    
    // Intentar usar la función RPC correcta para obtener el siguiente ticket
    // Esta función ya considera la prioridad del punto de acceso
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_next_ticket_for_attention', {
      punto_acceso_id_param: accessPointId // Argument name matches the function definition
    });
    
    if (rpcError) {
      console.error(`[accessPointService] Error al llamar RPC para obtener siguiente ticket:`, rpcError);
      
      // The fallback logic below might need review/removal if it doesn't
      // correctly mimic get_next_ticket_for_attention's behavior.
      // For now, we keep the fallback but note it might be inconsistent.
      console.log(`[accessPointService] Intentando obtener siguiente ticket mediante actualización directa...`);
      
      // Primero obtenemos el siguiente ticket pendiente
      const query = supabase
        .from('tickets')
        .select('*')
        .eq('status', 'PENDIENTE');
        
      // Filtrar según el tipo de punto de acceso
      if (isPriorityAccessPoint) {
        // Punto prioritario: solo tomar tickets prioritarios
        query.eq('is_priority', true);
      } else {
        // Punto normal: solo tomar tickets normales
        query.eq('is_priority', false);
      }
      
      // Ordenar primero por prioridad (si hay varios prioritarios), luego por tiempo
      const { data: pendingTickets, error: pendingError } = await query
        .order('created_at', { ascending: true })
        .limit(1);

      if (pendingError) {
        console.error('[accessPointService] Error al obtener siguiente ticket:', pendingError);
        throw pendingError;
      }

      // Si no hay tickets pendientes, devolvemos un mensaje en el formato esperado
      if (!pendingTickets || pendingTickets.length === 0) {
        return {
          ticket: null,
          message: isPriorityAccessPoint ? 
            'No hay tickets prioritarios pendientes en la cola' : 
            'No hay tickets normales pendientes en la cola'
        };
      }

      const nextTicket = pendingTickets[0];
      
      // Obtener la información del usuario para este ticket
      let userData = null;
      if (nextTicket.user_id) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, nombre, email, phone_number, cedula')
          .eq('id', nextTicket.user_id)
          .single();
          
        if (!userError) {
          userData = user;
        } else {
          console.warn('[accessPointService] Error al obtener datos del usuario:', userError);
        }
      }

      // Actualizamos el ticket para marcarlo como EN_ATENCIÓN y asignarle el punto de acceso
      const { data: updatedTicket, error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'EN_ATENCIÓN',
          punto_acceso_id: accessPointId, // Usar el nombre correcto de la columna
          updated_at: new Date().toISOString()
        })
        .eq('id', nextTicket.id)
        .select()
        .single();

      if (updateError) {
        console.error(`[accessPointService] Error al actualizar estado del ticket ${nextTicket.id}:`, updateError);
        throw updateError;
      }
      
      // Añadir la información del usuario al ticket
      if (userData) {
        updatedTicket.user = userData;
      }

      // Incrementamos el contador de tickets atendidos en el punto de acceso
      try {
        await incrementTicketsAtendidos(accessPointId);
      } catch (error) {
        console.warn(`[accessPointService] Error al incrementar tickets atendidos del punto de acceso ${accessPointId}:`, error);
        // Continuamos aunque falle esta parte
      }

      return {
        ticket: updatedTicket,
        message: `Ticket ${updatedTicket.ticket_number} asignado para atención`
      };
    }
    
    // Remove the frontend checks as the RPC now handles priority correctly
    /*
    // Verificar que el ticket retornado por el RPC coincide con el tipo de punto de acceso
    if (rpcData && rpcData.ticket) {
      if (isPriorityAccessPoint && !rpcData.ticket.is_priority) {
        // Si el punto es prioritario pero el ticket no lo es, rechazar
        return {
          ticket: null,
          message: 'Este punto solo puede atender tickets prioritarios (P-XXX)'
        };
      } else if (!isPriorityAccessPoint && rpcData.ticket.is_priority) {
        // Si el punto es normal pero el ticket es prioritario, rechazar
        return {
          ticket: null,
          message: 'Este punto solo puede atender tickets normales (N-XXX)'
        };
      }
    }
    */
    
    // Si el RPC funcionó pero necesitamos añadir la información del usuario
    if (rpcData && rpcData.ticket && rpcData.ticket.user_id) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, nombre, email, phone_number, cedula')
          .eq('id', rpcData.ticket.user_id)
          .single();
          
        if (!userError && userData) {
          rpcData.ticket.user = userData;
        }
      } catch (err) {
        console.warn('[accessPointService] Error al obtener datos del usuario para el ticket:', err);
      }
    }
    
    console.log(`[accessPointService] Obtención de siguiente ticket mediante RPC exitosa:`, rpcData);
    return rpcData;
  } catch (error) {
    console.error(`[accessPointService] Error al obtener siguiente ticket para el punto de acceso ${accessPointId}:`, error);
    throw error;
  }
};

// Atender el ticket actual
export const attendTicket = async (ticketId, accessPointId) => {
  console.log(`[accessPointService] Marcando ticket ${ticketId} como ATENDIDO en el punto de acceso ${accessPointId}`);
  
  try {
    // Intentar usar la función RPC para marcar el ticket como atendido
    const { data: rpcData, error: rpcError } = await supabase.rpc('mark_ticket_attended', {
      p_ticket_id: ticketId
    });
    
    if (rpcError) {
      console.error(`[accessPointService] Error al llamar RPC para marcar ticket como atendido:`, rpcError);
      
      // Fallback a la implementación anterior si el RPC falla
      console.log(`[accessPointService] Intentando marcar ticket como atendido mediante actualización directa...`);
      
      // Actualizamos el ticket para marcarlo como ATENDIDO
      const { data: updatedTicket, error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'ATENDIDO',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (updateError) {
        console.error(`[accessPointService] Error al marcar como atendido el ticket ${ticketId}:`, updateError);
        throw updateError;
      }
      
      console.log(`[accessPointService] Ticket ${ticketId} marcado como atendido mediante actualización directa`);
      return updatedTicket;
    }
    
    console.log(`[accessPointService] Ticket ${ticketId} marcado como atendido mediante RPC exitosamente`);
    return rpcData.ticket;
  } catch (error) {
    console.error(`[accessPointService] Error al marcar como atendido el ticket ${ticketId}:`, error);
    throw error;
  }
};

// Llamar de nuevo a un ticket (volver a ponerlo en cola pero como prioritario)
export const recallTicket = async (ticketId) => {
  // Actualizamos el ticket para marcarlo como PENDIENTE y prioritario
  const { data: updatedTicket, error: updateError } = await supabase
    .from('tickets')
    .update({
      status: 'PENDIENTE',
      is_priority: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select()
    .single();

  if (updateError) {
    console.error(`Error al volver a llamar el ticket ${ticketId}:`, updateError);
    throw updateError;
  }

  return updatedTicket;
};

// Calcular estadísticas de usuarios activos
const calculateUserStatistics = async () => {
  try {
    // Obtener usuarios activos (que existen en la tabla users)
    const { data: activeUsers, error: usersError } = await supabase
      .from('users')
      .select('id, is_staff, is_superuser');

    if (usersError) throw usersError;

    // Obtener trabajadores activos
    const { data: activeWorkers, error: workersError } = await supabase
      .from('workers')
      .select('user_id, is_admin')
      .in('user_id', activeUsers.map(u => u.id));

    if (workersError) throw workersError;

    // Crear sets para trabajar de forma más eficiente
    const workerUserIds = new Set(activeWorkers.map(w => w.user_id));
    
    // Separar trabajadores admin y operacionales
    const adminWorkers = activeWorkers.filter(w => w.is_admin);
    const operationalWorkers = activeWorkers.filter(w => !w.is_admin);

    // Contar usuarios regulares: usuarios que NO son trabajadores
    // En lugar de usar la tabla actors (que tiene datos inconsistentes), 
    // contamos directamente desde users
    const regularUsers = activeUsers.filter(user => !workerUserIds.has(user.id));

    return {
      total_actors_non_admin: regularUsers.length, // Usuarios regulares (no trabajadores)
      total_operational_workers: operationalWorkers.length, // Trabajadores no admin
      total_admin_workers: adminWorkers.length // Trabajadores admin
    };
  } catch (error) {
    console.error('Error calculating user statistics:', error);
    throw error;
  }
};

// Calcular estadísticas de tickets
const calculateTicketStatistics = async () => {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('status, is_priority, created_at, updated_at');

    if (error) throw error;

    const totalTickets = tickets.length;
    const pendingTickets = tickets.filter(t => t.status === 'PENDIENTE').length;
    const attendedTickets = tickets.filter(t => t.status === 'ATENDIDO').length;
    const priorityTickets = tickets.filter(t => t.is_priority).length;
    const normalTickets = tickets.filter(t => !t.is_priority).length;

    // Calcular tiempo promedio de espera para tickets atendidos hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendedToday = tickets.filter(t => 
      t.status === 'ATENDIDO' && 
      new Date(t.updated_at) >= today
    );

    let avgWaitTimePriorityMinutes = 0;
    let avgWaitTimeNormalMinutes = 0;

    if (attendedToday.length > 0) {
      const priorityAttendedToday = attendedToday.filter(t => t.is_priority);
      const normalAttendedToday = attendedToday.filter(t => !t.is_priority);

      if (priorityAttendedToday.length > 0) {
        const totalWaitTimePriority = priorityAttendedToday.reduce((sum, ticket) => {
          const waitTime = new Date(ticket.updated_at).getTime() - new Date(ticket.created_at).getTime();
          return sum + waitTime;
        }, 0);
        avgWaitTimePriorityMinutes = Math.round(totalWaitTimePriority / priorityAttendedToday.length / 1000 / 60);
      }

      if (normalAttendedToday.length > 0) {
        const totalWaitTimeNormal = normalAttendedToday.reduce((sum, ticket) => {
          const waitTime = new Date(ticket.updated_at).getTime() - new Date(ticket.created_at).getTime();
          return sum + waitTime;
        }, 0);
        avgWaitTimeNormalMinutes = Math.round(totalWaitTimeNormal / normalAttendedToday.length / 1000 / 60);
      }
    }

    return {
      total: totalTickets,
      pending: pendingTickets,
      attended: attendedTickets,
      total_priority: priorityTickets,
      total_normal: normalTickets,
      avg_wait_time_priority_minutes: avgWaitTimePriorityMinutes,
      avg_wait_time_normal_minutes: avgWaitTimeNormalMinutes
    };
  } catch (error) {
    console.error('Error calculating ticket statistics:', error);
    throw error;
  }
};

// Calcular estadísticas de puntos de acceso
const calculateAccessPointStatistics = async () => {
  try {
    const { data: accessPoints, error } = await supabase
      .from('access_points')
      .select('*');

    if (error) throw error;

    const totalPoints = accessPoints.length;
    const activePoints = accessPoints.filter(ap => ap.estado === 'ACTIVO').length;
    const pausedPoints = accessPoints.filter(ap => ap.estado === 'PAUSADO').length;
    const priorityPoints = accessPoints.filter(ap => ap.is_priority).length;

    const pointsDetail = accessPoints.map(ap => ({
      id: ap.id,
      is_priority: ap.is_priority,
      estado: ap.estado,
      tickets_atendidos: ap.tickets_atendidos || 0,
      users_count: 0 // Este campo puede necesitar ajuste según la lógica específica
    }));

    return {
      total: totalPoints,
      active: activePoints,
      paused: pausedPoints,
      priority: priorityPoints,
      points_detail: pointsDetail
    };
  } catch (error) {
    console.error('Error calculating access point statistics:', error);
    throw error;
  }
};

// Obtener estadísticas del sistema
export const getSystemStatistics = async () => {
  try {
    // Calcular todas las estadísticas en paralelo
    const [userStats, ticketStats, accessPointStats] = await Promise.all([
      calculateUserStatistics(),
      calculateTicketStatistics(),
      calculateAccessPointStatistics()
    ]);

    return {
      users: userStats,
      tickets: ticketStats,
      access_points: accessPointStats
    };
  } catch (error) {
    console.error('Error getting system statistics:', error);
    throw error;
  }
};

// FUNCIONES PARA REALTIME
// Suscribirse a cambios en puntos de acceso
export const subscribeToAccessPointUpdates = (callback) => {
  const subscription = supabase
    .channel('access-point-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'access_points'
    }, (payload) => {
      callback(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Suscribirse a cambios en las relaciones access_point_actors (colas)
export const subscribeToAccessPointActorsUpdates = (callback) => {
  const subscription = supabase
    .channel('access-point-actors-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'access_point_actors'
    }, (payload) => {
      callback(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Suscribirse a cambios en anuncios
export const subscribeToAnnouncementsUpdates = (callback) => {
  const subscription = supabase
    .channel('announcements-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'announcements'
    }, (payload) => {
      callback(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Interfaces para tipos de datos
export const AccessPoint = {
  id: 0,
  nombre: '',
  ubicacion: '',
  estado: 'CERRADO',
  worker_id: null,
  fecha_inicio: null,
  fecha_pausa: null,
  tickets_atendidos: 0,
  worker: null
};

export const Ticket = {
  id: 0,
  ticket_number: '',
  service: '',
  status: 'PENDIENTE',
  is_priority: false,
  created_at: '',
  updated_at: '',
  user_id: '',
  access_point_id: null
};

// Inicializar un punto de acceso
export const initializeAccessPoint = async (accessPointId, workerId) => {
  console.log(`[accessPointService] Inicializando punto de acceso ${accessPointId} con trabajador ${workerId}`);
  
  try {
    // Intentar usar la función RPC para inicializar el punto de acceso
    const { data: rpcData, error: rpcError } = await supabase.rpc('initialize_access_point', {
      p_access_point_id: accessPointId,
      p_worker_id: workerId
    });
    
    if (rpcError) {
      console.error(`[accessPointService] Error al llamar RPC para inicializar punto de acceso:`, rpcError);
      
      // Fallback a la implementación directa si el RPC falla
      console.log(`[accessPointService] Intentando inicialización directa como alternativa...`);
      
  // Actualizar el punto de acceso con el estado ACTIVO y asignar el trabajador
  const { data, error } = await supabase
    .from('access_points')
    .update({
      estado: 'ACTIVO',
      worker_id: workerId,
      fecha_inicio: new Date().toISOString(),
      fecha_pausa: null
    })
    .eq('id', accessPointId)
    .select()
    .single();

  if (error) {
        console.error(`[accessPointService] Error al inicializar punto de acceso ${accessPointId}:`, error);
        throw error;
      }
      
      console.log(`[accessPointService] Inicialización directa exitosa:`, data);
      return data;
    }
    
    console.log(`[accessPointService] Inicialización mediante RPC exitosa:`, rpcData);
    return rpcData;
  } catch (error) {
    console.error(`[accessPointService] Error al inicializar punto de acceso ${accessPointId}:`, error);
    throw error;
  }
};

// Obtener el ticket actual en atención en un punto de acceso
export const getCurrentTicket = async (accessPointId) => {
  try {
    console.log(`[accessPointService] Obteniendo ticket actual para el punto de acceso ${accessPointId}`);
    
    // Obtener información del punto de acceso para saber si es prioritario
    const { data: accessPoint, error: accessPointError } = await supabase
      .from('access_points')
      .select('is_priority')
      .eq('id', accessPointId)
      .single();
      
    if (accessPointError) {
      console.error(`[accessPointService] Error al obtener información del punto de acceso:`, accessPointError);
      // Decide how to handle this error - maybe return null or throw?
      // Returning null might be safer for the UI
      return null; 
    }
    
    const isPriorityAccessPoint = accessPoint.is_priority;

    // Primero intentamos usar la función RPC para obtener el ticket con datos de usuario
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_ticket_with_user', {
      p_access_point_id: accessPointId
    });
    
    let potentialTicket = null;
    let source = 'RPC';

    if (!rpcError && rpcData) {
      potentialTicket = rpcData;
      console.log(`[accessPointService] Obtención de ticket actual mediante RPC exitosa`);
    } else {
      if (rpcError) {
        console.error(`[accessPointService] Error al llamar RPC para obtener ticket actual:`, rpcError);
      }
      // Fallback a la implementación directa si el RPC falla o no devuelve datos
      source = 'Direct Query';
      console.log(`[accessPointService] Intentando obtener ticket actual mediante consulta directa...`);
      
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('punto_acceso_id', accessPointId)
        .eq('status', 'EN_ATENCIÓN')
        .maybeSingle(); // Use maybeSingle to handle no rows gracefully

      if (ticketError) {
        console.error(`[accessPointService] Error al obtener ticket actual (directo):`, ticketError);
        // Don't throw, just means no ticket found or db error
      } else if (ticketData) {
        // Si encontramos un ticket, consultamos el usuario por separado
        if (ticketData.user_id) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, nombre, email, phone_number, cedula')
            .eq('id', ticketData.user_id)
            .single();

          if (userError) {
            console.warn(`[accessPointService] Error al obtener datos del usuario del ticket:`, userError);
          } else {
            ticketData.user = userData;
          }
        }
        potentialTicket = ticketData;
        console.log(`[accessPointService] Obtención de ticket actual (directo) exitosa`);
      }
    }
    
    // Verificar la coherencia entre el ticket y el punto de acceso
    if (potentialTicket) {
      if ( (isPriorityAccessPoint && !potentialTicket.is_priority) || 
           (!isPriorityAccessPoint && potentialTicket.is_priority) ) {
        console.warn(`[accessPointService] Ticket (${potentialTicket.ticket_number}, priority=${potentialTicket.is_priority}) no coincide con el tipo de punto de acceso ${accessPointId} (priority=${isPriorityAccessPoint}). Fuente: ${source}. Devolviendo null.`);
        return null; // Ticket encontrado pero no coincide con el tipo de punto
      }
      // El ticket coincide, devolverlo
      return potentialTicket;
    } else {
      // No se encontró ningún ticket en atención para este punto
      return null;
    }

  } catch (error) {
    console.error(`[accessPointService] Error general al obtener ticket actual del punto de acceso ${accessPointId}:`, error);
    throw error; // Rethrow unexpected errors
  }
};

// Verificar y corregir el esquema de la base de datos
export const verifyDatabaseSchema = async () => {
  try {
    console.log(`[accessPointService] Verificando esquema de la base de datos...`);
    
    const { data, error } = await supabase.rpc('verify_and_fix_schema');
    
    if (error) {
      console.error(`[accessPointService] Error al verificar esquema:`, error);
      return false;
    }
    
    console.log(`[accessPointService] Resultado de verificación de esquema:`, data);
    return true;
  } catch (error) {
    console.error(`[accessPointService] Excepción al verificar esquema:`, error);
    return false;
  }
}; 