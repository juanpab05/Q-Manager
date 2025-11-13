import supabase from './supabase';

/**
 * Servicio para interactuar con los puntos de acceso en Supabase
 */
const accessPointService = {
  /**
   * Obtener todos los puntos de acceso
   * @returns {Promise} Promesa con los puntos de acceso
   */
  getAllAccessPoints: async () => {
    const { data, error } = await supabase
      .from('access_points')
      .select(`
        *,
        worker:workers(
          user_id,
          code,
          is_admin,
          user:users(
            id, 
            nombre,
            email,
            phone_number
          )
        )
      `)
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error al obtener puntos de acceso:', error);
      throw error;
    }
    
    return data;
  },

  /**
   * Obtener punto de acceso por ID
   * @param {number} id - ID del punto de acceso
   * @returns {Promise} Promesa con el punto de acceso
   */
  getAccessPointById: async (id) => {
    const { data, error } = await supabase
      .from('access_points')
      .select(`
        *,
        worker:workers(
          user_id,
          code,
          is_admin,
          user:users(
            id, 
            nombre,
            email,
            phone_number
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error al obtener punto de acceso ${id}:`, error);
      throw error;
    }
    
    return data;
  },

  /**
   * Obtener punto de acceso del trabajador actual
   * @param {string} workerId - ID del trabajador (UUID)
   * @returns {Promise} Promesa con el punto de acceso
   */
  getAccessPointByWorker: async (workerId) => {
    const { data, error } = await supabase
      .from('access_points')
      .select('*')
      .eq('worker_id', workerId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // No error if not found (single row)
      console.error(`Error al obtener punto de acceso del trabajador ${workerId}:`, error);
      throw error;
    }
    
    return data;
  },

  /**
   * Actualizar estado de un punto de acceso
   * @param {number} id - ID del punto de acceso
   * @param {string} estado - Nuevo estado
   * @returns {Promise} Promesa con el punto de acceso actualizado
   */
  updateAccessPointStatus: async (id, estado) => {
    const updates = {
      estado,
      fecha_pausa: null,
      fecha_inicio: null
    };
    
    // Si está activando, establecer fecha de inicio
    if (estado === 'ACTIVO') {
      updates.fecha_inicio = new Date().toISOString();
    }
    
    // Si está pausando, establecer fecha de pausa
    if (estado === 'PAUSA') {
      updates.fecha_pausa = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('access_points')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error al actualizar estado del punto de acceso ${id}:`, error);
      throw error;
    }
    
    return data;
  },

  /**
   * Asignar trabajador a un punto de acceso
   * @param {number} accessPointId - ID del punto de acceso
   * @param {string} workerId - ID del trabajador (UUID)
   * @returns {Promise} Promesa con el punto de acceso actualizado
   */
  assignWorkerToAccessPoint: async (accessPointId, workerId) => {
    const { data, error } = await supabase
      .from('access_points')
      .update({ worker_id: workerId })
      .eq('id', accessPointId)
      .select()
      .single();
    
    if (error) {
      console.error(`Error al asignar trabajador ${workerId} al punto de acceso ${accessPointId}:`, error);
      throw error;
    }
    
    return data;
  },

  /**
   * Registrar interacción con un punto de acceso
   * @param {Object} interaction - Datos de la interacción
   * @returns {Promise} Promesa con la interacción registrada
   */
  recordAccessPointInteraction: async (interaction) => {
    const { data, error } = await supabase
      .from('access_point_actors')
      .insert({
        access_point_id: interaction.accessPointId,
        actor_id: interaction.actorId,
        ticket_id: interaction.ticketId || null,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error al registrar interacción con punto de acceso:', error);
      throw error;
    }
    
    return data;
  },

  /**
   * Obtener todas las interacciones de un punto de acceso
   * @param {number} accessPointId - ID del punto de acceso
   * @returns {Promise} Promesa con las interacciones
   */
  getAccessPointInteractions: async (accessPointId) => {
    const { data, error } = await supabase
      .from('access_point_actors')
      .select(`
        *,
        actor:actors(
          user_id,
          has_priority,
          motive,
          user:users(
            id,
            nombre,
            email,
            cedula
          )
        ),
        ticket:tickets(
          id,
          service,
          status,
          ticket_number,
          created_at
        )
      `)
      .eq('access_point_id', accessPointId)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error(`Error al obtener interacciones del punto de acceso ${accessPointId}:`, error);
      throw error;
    }
    
    return data;
  },

  /**
   * Obtener anuncios activos
   * @returns {Promise} Promesa con los anuncios activos
   */
  getActiveAnnouncements: async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        created_by:workers(
          user_id,
          code,
          is_admin,
          user:users(
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
  },
  
  /**
   * Crear un nuevo anuncio
   * @param {Object} announcementData - Datos del anuncio
   * @returns {Promise} Promesa con el anuncio creado
   */
  createAnnouncement: async (announcementData) => {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        ...announcementData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear anuncio:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Actualizar un anuncio
   * @param {number} id - ID del anuncio
   * @param {Object} announcementData - Datos actualizados del anuncio
   * @returns {Promise} Promesa con el anuncio actualizado
   */
  updateAnnouncement: async (id, announcementData) => {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        ...announcementData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error al actualizar anuncio ${id}:`, error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Eliminar un anuncio (desactivar)
   * @param {number} id - ID del anuncio
   * @returns {Promise} Promesa con el resultado
   */
  deleteAnnouncement: async (id) => {
    const { data, error } = await supabase
      .from('announcements')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error al eliminar anuncio ${id}:`, error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Incrementar contador de tickets atendidos
   * @param {number} accessPointId - ID del punto de acceso
   * @returns {Promise} Promesa con el punto de acceso actualizado
   */
  incrementTicketsAtendidos: async (accessPointId) => {
    // Primero obtenemos el valor actual
    const { data: currentData, error: getError } = await supabase
      .from('access_points')
      .select('tickets_atendidos')
      .eq('id', accessPointId)
      .single();
    
    if (getError) {
      console.error(`Error al obtener tickets atendidos del punto de acceso ${accessPointId}:`, getError);
      throw getError;
    }
    
    const currentCount = currentData.tickets_atendidos || 0;
    
    // Luego incrementamos
    const { data, error } = await supabase
      .from('access_points')
      .update({ tickets_atendidos: currentCount + 1 })
      .eq('id', accessPointId)
      .select()
      .single();
    
    if (error) {
      console.error(`Error al incrementar tickets atendidos del punto de acceso ${accessPointId}:`, error);
      throw error;
    }
    
    return data;
  }
};

export default accessPointService; 