import supabase from '../utils/supabaseClient';

// Obtener todos los tickets
export const getTickets = async () => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener tickets:', error);
    throw error;
  }

  return data;
};

// Obtener tickets por usuario
export const getUserTickets = async (userId) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error al obtener tickets para el usuario ${userId}:`, error);
    throw error;
  }

  return data;
};

// Solicitar un nuevo ticket by calling a Supabase RPC function
export const requestTicket = async (ticketData) => {
  try {
    const { data, error } = await supabase.rpc('request_new_ticket', {
      p_user_id: ticketData.user_id,
      p_service: ticketData.service,
      p_modality: ticketData.modality,
      p_is_priority: ticketData.is_priority
    });

    if (error) {
      console.error('Error calling request_new_ticket RPC:', error);
      throw error;
    }
    // The RPC returns an array of rows. Since we expect one inserted row, take the first element.
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    // Ensure that the error object structure is handled consistently with other errors
    console.error('Fallo al solicitar ticket vía RPC:', err);
    const newError = new Error(err.message || 'Error desconocido al solicitar ticket.');
    newError.details = err.details;
    newError.code = err.code;
    // If err has a response-like structure from a previous API call style, you might want to adapt it.
    // For RPC errors, err usually has message, details, code.
    throw newError; 
  }
};

// Verificar si hay tickets pendientes para un usuario
export const checkPendingTicket = async (userId) => {
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) {
    throw new Error('No hay usuario autenticado');
  }

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['PENDIENTE', 'EN_PROGRESO', 'EN_ATENCIÓN'])
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No se encontró ningún ticket pendiente (código PGRST116 = no rows returned)
      return { hasPendingTicket: false, pendingTicket: null };
    }
    console.error('Error al verificar tickets pendientes:', error);
    throw error;
  }

  return { hasPendingTicket: true, pendingTicket: data };
};

// Actualizar el estado de un ticket
export const updateTicketStatus = async (ticketId, newStatus, puntoAccesoId = null) => {
  try {
  const { data, error } = await supabase
      .rpc('update_ticket_status', {
        ticket_id_param: ticketId,
        new_status_param: newStatus,
        punto_acceso_id_param: puntoAccesoId
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al actualizar el estado del ticket:', error);
    throw error;
  }
};

// Obtener el estado actual de la cola (tickets en espera, en atención, último atendido)
export const getQueueStatus = async () => {
  try {
    // Obtener información de la sesión actual
    const { data: { user } } = await supabase.auth.getUser();
    
    // Obtener ticket del usuario actual (si existe)
    let userTicket = null;
    if (user) {
      const { data: userTicketData, error: userTicketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!userTicketError && userTicketData && userTicketData.length > 0) {
        userTicket = userTicketData[0];
      }
    }
    
    // Get all access points to filter by priority
    const { data: accessPoints, error: apError } = await supabase
      .from('access_points')
      .select('*');
      
    if (apError) throw apError;
    
    // Separate priority and normal access points
    const priorityAccessPointIds = accessPoints
      .filter(ap => ap.is_priority)
      .map(ap => ap.id);
    
    const normalAccessPointIds = accessPoints
      .filter(ap => !ap.is_priority)
      .map(ap => ap.id);
    
    // Get tickets currently being attended
    const { data: currentTickets, error: currentError } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'EN_ATENCIÓN')
      .order('updated_at', { ascending: false });
      
    if (currentError) throw currentError;
    
    // Separate priority and normal current tickets by access point IDs
    let priorityCurrentTicket = null;
    let normalCurrentTicket = null;
    
    for (const ticket of currentTickets) {
      if (ticket.punto_acceso_id && priorityAccessPointIds.includes(ticket.punto_acceso_id) && !priorityCurrentTicket) {
        priorityCurrentTicket = ticket;
      } else if (ticket.punto_acceso_id && normalAccessPointIds.includes(ticket.punto_acceso_id) && !normalCurrentTicket) {
        normalCurrentTicket = ticket;
      }
    }
    
    // Get last attended tickets
    const { data: lastAttendedTickets, error: lastError } = await supabase
        .from('tickets')
      .select('*')
      .eq('status', 'ATENDIDO')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (lastError) throw lastError;
    
    // Separate priority and normal last attended tickets
    let priorityLastAttended = null;
    let normalLastAttended = null;
    
    for (const ticket of lastAttendedTickets) {
      if (ticket.punto_acceso_id && priorityAccessPointIds.includes(ticket.punto_acceso_id) && !priorityLastAttended) {
        priorityLastAttended = ticket;
      } else if (ticket.punto_acceso_id && normalAccessPointIds.includes(ticket.punto_acceso_id) && !normalLastAttended) {
        normalLastAttended = ticket;
      }
    }

    // Get pending tickets (next in queue)
    const { data: pendingTickets, error: pendingError } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'PENDIENTE')
      .order('is_priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(20);
      
    if (pendingError) throw pendingError;
    
    // Separate pending tickets by priority type (for next tickets)
    const priorityNextTickets = pendingTickets.filter(t => t.is_priority);
    const normalNextTickets = pendingTickets.filter(t => !t.is_priority);
    
    // Calculate statistics
    const { data: allTickets, error: statsError } = await supabase
      .from('tickets')
      .select('id, status, created_at, updated_at');
      
    if (statsError) throw statsError;
    
    const waitingCount = allTickets.filter(t => t.status === 'PENDIENTE').length;
    
    // Calculate average wait time for tickets attended today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendedToday = allTickets.filter(t => 
      t.status === 'ATENDIDO' && 
      new Date(t.updated_at) >= today
    );
    
    let avgWaitTime = 0;
    if (attendedToday.length > 0) {
      const totalWaitTimeMs = attendedToday.reduce((sum, ticket) => {
        const waitTime = new Date(ticket.updated_at).getTime() - new Date(ticket.created_at).getTime();
        return sum + waitTime;
      }, 0);
      
      avgWaitTime = Math.round(totalWaitTimeMs / attendedToday.length / 1000); // in seconds
    }
    
    // Return consolidated queue status
    return {
      user_ticket: userTicket,
      priority: {
        current: priorityCurrentTicket,
        last_attended: priorityLastAttended,
        next_tickets: priorityNextTickets
      },
      normal: {
        current: normalCurrentTicket,
        last_attended: normalLastAttended,
        next_tickets: normalNextTickets
      },
      next_tickets: pendingTickets,
      statistics: {
        waiting_count: waitingCount,
        avg_wait_time: avgWaitTime,
        attended_today: attendedToday.length
      }
    };
  } catch (error) {
    console.error('Error fetching queue status:', error);
    throw error;
  }
};

// Obtener los tickets del usuario autenticado actualmente
export const getMyTickets = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('getMyTickets: No hay usuario autenticado');
    return []; // o lanzar un error, según prefieras
  }
  return getUserTickets(user.id);
};

// Suscribirse a cambios en tickets
export const subscribeToTicketUpdates = (callback) => {
  const subscription = supabase
    .channel('ticket-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tickets'
    }, (payload) => {
      callback(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Suscribirse a cambios en puntos de acceso
export const subscribeToAccessPointUpdates = (callback) => {
  const subscription = supabase
    .channel('access-point-status-changes')
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

// Obtener todos los anuncios
export const getAllAnnouncements = async () => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }

  return data;
};

// Obtener el próximo ticket a atender
export const getNextTicketForAttention = async (puntoAccesoId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_next_ticket_for_attention', {
        punto_acceso_id_param: puntoAccesoId
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener el próximo ticket:', error);
    throw error;
  }
};

// Fix the database schema if needed
export const fixTicketSchema = async () => {
  try {
    const { data, error } = await supabase.rpc('fix_ticket_schema');
    
    if (error) {
      console.error('Error fixing ticket schema:', error);
      throw error;
    }
    
    console.log('Schema fix result:', data);
    return data;
  } catch (error) {
    console.error('Error fixing ticket schema:', error);
    throw error;
  }
}; 