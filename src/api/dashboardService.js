import supabase from '../utils/supabaseClient';

// Función para calcular el tiempo promedio de espera (en minutos)
const calculateAverageWaitTime = (tickets, accessPoints) => {
  if (!tickets || tickets.length === 0) return 0;
  
  // Tickets que han sido atendidos recientemente (últimas 24 horas)
  const recentCompletedTickets = tickets.filter(
    ticket => 
      ticket.status === 'COMPLETADO' && 
      new Date(ticket.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  
  if (recentCompletedTickets.length === 0) return 0;
  
  // Calcular la diferencia de tiempo entre creación y atención
  const waitTimes = recentCompletedTickets.map(ticket => {
    const createdAt = new Date(ticket.created_at);
    const updatedAt = new Date(ticket.updated_at);
    return (updatedAt - createdAt) / (1000 * 60); // Convertir a minutos
  });
  
  // Calcular el promedio
  const sum = waitTimes.reduce((acc, time) => acc + time, 0);
  return Math.round(sum / waitTimes.length);
};

// Obtener estadísticas actuales para el dashboard
export const getDashboardStats = async () => {
  try {
    // Obtener puntos de acceso
    const { data: accessPoints, error: accessPointsError } = await supabase
      .from('access_points')
      .select('*');
      
    if (accessPointsError) throw accessPointsError;
    
    // Obtener tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*');
      
    if (ticketsError) throw ticketsError;
    
    // Calcular estadísticas
    const pendingTickets = tickets.filter(t => t.status === 'PENDIENTE');
    const inProgressTickets = tickets.filter(t => t.status === 'EN_PROGRESO');
    const inAttentionTickets = tickets.filter(t => t.status === 'EN_ATENCIÓN');
    const activeAccessPoints = accessPoints.filter(ap => ap.estado === 'ABIERTO');
    
    return {
      totalTickets: tickets.length,
      pendingTicketsCount: pendingTickets.length,
      inProgressTicketsCount: inProgressTickets.length,
      inAttentionTicketsCount: inAttentionTickets.length,
      activeAccessPointsCount: activeAccessPoints.length,
      totalAccessPointsCount: accessPoints.length,
      averageWaitTime: calculateAverageWaitTime(tickets, accessPoints),
      pendingTickets,
      activeAccessPoints,
      allAccessPoints: accessPoints
    };
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    throw error;
  }
};

// Suscribirse a cambios en tickets para actualizar el dashboard
export const subscribeToTicketsForDashboard = (callback) => {
  const subscription = supabase
    .channel('dashboard-tickets')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tickets'
    }, () => {
      // Cuando hay un cambio, obtenemos nuevamente todas las estadísticas
      getDashboardStats().then(callback);
    })
    .subscribe();
    
  return () => {
    supabase.removeChannel(subscription);
  };
};

// Suscribirse a cambios en puntos de acceso para actualizar el dashboard
export const subscribeToAccessPointsForDashboard = (callback) => {
  const subscription = supabase
    .channel('dashboard-access-points')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'access_points'
    }, () => {
      // Cuando hay un cambio, obtenemos nuevamente todas las estadísticas
      getDashboardStats().then(callback);
    })
    .subscribe();
    
  return () => {
    supabase.removeChannel(subscription);
  };
};

// Combinar ambas suscripciones en una sola para el dashboard
export const subscribeToDashboardUpdates = (callback) => {
  const ticketUnsubscribe = subscribeToTicketsForDashboard(callback);
  const accessPointUnsubscribe = subscribeToAccessPointsForDashboard(callback);
  
  return () => {
    ticketUnsubscribe();
    accessPointUnsubscribe();
  };
};

// Obtener estado de los puntos de acceso
export const getAccessPointsStatus = async () => {
  const { data, error } = await supabase
    .from('access_points')
    .select(`
      *,
      worker:worker_id(
        user_id,
        user:user_id(
          nombre
        )
      )
    `);
    
  if (error) {
    console.error('Error al obtener estado de puntos de acceso:', error);
    throw error;
  }
  
  return data;
};

// Obtener las colas actuales (relaciones access_point_actors)
export const getCurrentQueues = async () => {
  const { data, error } = await supabase
    .from('access_point_actors')
    .select(`
      *,
      access_point:access_point_id(*),
      actor:actor_id(
        user:user_id(
          id,
          nombre
        )
      ),
      ticket:ticket_id(*)
    `)
    .order('timestamp', { ascending: true });
    
  if (error) {
    console.error('Error al obtener colas actuales:', error);
    throw error;
  }
  
  return data;
};

// Suscribirse a cambios en las colas
export const subscribeToQueueUpdates = (callback) => {
  const subscription = supabase
    .channel('queue-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'access_point_actors'
    }, () => {
      // Cuando hay un cambio, obtenemos nuevamente todas las colas
      getCurrentQueues().then(callback);
    })
    .subscribe();
    
  return () => {
    supabase.removeChannel(subscription);
  };
}; 

 