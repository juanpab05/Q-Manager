import supabase from './supabase';

/**
 * Servicio para interactuar con tickets en Supabase
 */
const ticketService = {
  /**
   * Obtener todos los tickets
   * @returns {Promise} Promesa con los tickets
   */
  getAllTickets: async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        user:users(id, nombre, email, cedula, phone_number)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error al obtener tickets:', error);
      throw error;
    }
    
    return data;
  },

  /**
   * Obtener tickets por usuario
   * @param {string} userId - ID del usuario (UUID)
   * @returns {Promise} Promesa con los tickets del usuario
   */
  getTicketsByUser: async (userId) => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error al obtener tickets del usuario ${userId}:`, error);
      throw error;
    }
    
    return data;
  },

  /**
   * Obtener un ticket por ID
   * @param {number} ticketId - ID del ticket
   * @returns {Promise} Promesa con el ticket
   */
  getTicketById: async (ticketId) => {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        user:users(id, nombre, email, cedula, phone_number)
      `)
      .eq('id', ticketId)
      .single();
    
    if (error) {
      console.error(`Error al obtener ticket ${ticketId}:`, error);
      throw error;
    }
    
    return data;
  },

  /**
   * Crear un nuevo ticket
   * @param {Object} ticketData - Datos del ticket
   * @returns {Promise} Promesa con el ticket creado
   */
  createTicket: async (ticketData) => {
    // Generamos el número de ticket basado en la prioridad
    const prefix = ticketData.is_priority ? 'P-' : 'N-';
    
    // Obtener el último número de ticket para este tipo
    const { data: lastTickets, error: countError } = await supabase
      .from('tickets')
      .select('ticket_number')
      .like('ticket_number', `${prefix}%`)
      .order('ticket_number', { ascending: false })
      .limit(1);
    
    if (countError) {
      console.error('Error al obtener conteo de tickets:', countError);
      throw countError;
    }
    
    // Calcular el siguiente número de ticket
    let nextNumber = 1;
    if (lastTickets && lastTickets.length > 0) {
      const lastNumber = parseInt(lastTickets[0].ticket_number.split('-')[1], 10);
      nextNumber = lastNumber + 1;
    }
    
    // Formatear el número del ticket con ceros a la izquierda
    const ticketNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
    
    // Crear el ticket con el número generado
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        ...ticketData,
        ticket_number: ticketNumber,
        status: 'PENDIENTE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear ticket:', error);
      throw error;
    }
    
    return data;
  },

  /**
   * Actualizar el estado de un ticket
   * @param {number} ticketId - ID del ticket
   * @param {string} status - Nuevo estado del ticket
   * @returns {Promise} Promesa con el ticket actualizado
   */
  updateTicketStatus: async (ticketId, status) => {
    const { data, error } = await supabase
      .from('tickets')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', ticketId)
      .select()
      .single();
    
    if (error) {
      console.error(`Error al actualizar estado del ticket ${ticketId}:`, error);
      throw error;
    }
    
    return data;
  },

  /**
   * Obtener tickets pendientes
   * @param {boolean} isPriority - Si se deben filtrar por prioridad
   * @returns {Promise} Promesa con los tickets pendientes
   */
  getPendingTickets: async (isPriority = null) => {
    let query = supabase
      .from('tickets')
      .select(`
        *,
        user:users(id, nombre, email, cedula, phone_number)
      `)
      .eq('status', 'PENDIENTE')
      .order('created_at', { ascending: true });
    
    // Si se especifica prioridad, filtrar por ella
    if (isPriority !== null) {
      query = query.eq('is_priority', isPriority);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error al obtener tickets pendientes:', error);
      throw error;
    }
    
    return data;
  }
};

export default ticketService; 