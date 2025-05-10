import supabase from '../utils/supabaseClient';

// Solicitar permiso para notificaciones en el navegador
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones de escritorio');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// Crear una notificación del navegador
export const createBrowserNotification = (title, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('No se puede enviar notificación: permiso no concedido');
    return null;
  }

  return new Notification(title, options);
};

// Suscribirse a cambios en el estado de un ticket específico
export const subscribeToTicketStatusChange = (ticketId, callback) => {
  const subscription = supabase
    .channel(`ticket-status-${ticketId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'tickets',
      filter: `id=eq.${ticketId}`
    }, (payload) => {
      callback(payload.new);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Suscribirse a cambios en los tickets de un usuario
export const subscribeToUserTicketsChange = (userId, callback) => {
  const subscription = supabase
    .channel(`user-tickets-${userId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'tickets',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      callback(payload.new);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Notificar al usuario cuando su ticket está próximo a ser atendido
export const notifyTicketStatus = (ticket) => {
  let title = '';
  let body = '';
  let icon = '/logo.png'; // Asegúrate de tener un logo en tu proyecto

  switch (ticket.status) {
    case 'PENDIENTE':
      title = 'Ticket Registrado';
      body = `Tu ticket ${ticket.ticket_number} ha sido registrado exitosamente.`;
      break;
    case 'EN_PROGRESO':
      title = '¡Tu turno está próximo!';
      body = `Tu ticket ${ticket.ticket_number} pronto será atendido. Por favor, prepárate.`;
      break;
    case 'EN_ATENCIÓN':
      title = '¡Es tu turno!';
      body = `Tu ticket ${ticket.ticket_number} está siendo atendido ahora.`;
      break;
    case 'COMPLETADO':
      title = 'Ticket Completado';
      body = `Tu ticket ${ticket.ticket_number} ha sido completado. ¡Gracias por tu visita!`;
      break;
    case 'CANCELADO':
      title = 'Ticket Cancelado';
      body = `Tu ticket ${ticket.ticket_number} ha sido cancelado.`;
      break;
    default:
      return; // No notificar para otros estados
  }

  createBrowserNotification(title, { body, icon });
};

// Implementa un hook para manejar notificaciones para un usuario
export const setupUserNotifications = (userId) => {
  // Solicitar permiso para notificaciones
  requestNotificationPermission();
  
  // Suscribirse a cambios en los tickets del usuario
  return subscribeToUserTicketsChange(userId, (updatedTicket) => {
    notifyTicketStatus(updatedTicket);
  });
}; 