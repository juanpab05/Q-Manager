import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './auth/AuthContext';
import { TicketResponseData } from '../api/types';
import {
  requestNotificationPermission,
  subscribeToUserTicketsChange,
  createBrowserNotification
} from '../api/notificationService';

interface NotificationState {
  hasPermission: boolean;
  notificationCount: number;
  requestPermission: () => Promise<boolean>;
  clearNotifications: () => void;
  showNotification: (title: string, options?: NotificationOptions) => Notification | null;
}

const NotificationContext = createContext<NotificationState | undefined>(undefined);

export const useNotifications = (): NotificationState => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications debe utilizarse dentro de un NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const { user } = useAuth();

  // Verificar y solicitar permiso para notificaciones al montar el componente
  useEffect(() => {
    const checkPermission = async () => {
      const granted = await requestNotificationPermission();
      setHasPermission(granted);
    };
    
    checkPermission();
  }, []);

  // Suscribirse a los cambios en los tickets del usuario cuando se inicia sesión
  useEffect(() => {
    if (!user || !hasPermission) return;
    
    console.log('Configurando suscripción a notificaciones para el usuario:', user.id);

    // Suscribirse a los cambios de tickets del usuario actual
    const unsubscribe = subscribeToUserTicketsChange(user.id, (updatedTicket: TicketResponseData) => {
      // Mostrar notificación según el estado del ticket
      let title = '';
      let body = '';
      let requiresNotification = false;

      switch (updatedTicket.status) {
        case 'PENDIENTE':
          title = 'Ticket Registrado';
          body = `Tu ticket ${updatedTicket.ticket_number} ha sido registrado exitosamente.`;
          requiresNotification = true;
          break;
        case 'EN_PROGRESO':
          title = '¡Tu turno está próximo!';
          body = `Tu ticket ${updatedTicket.ticket_number} pronto será atendido. Por favor, prepárate.`;
          requiresNotification = true;
          break;
        case 'EN_ATENCIÓN':
          title = '¡Es tu turno!';
          body = `Tu ticket ${updatedTicket.ticket_number} está siendo atendido ahora.`;
          requiresNotification = true;
          break;
        case 'COMPLETADO':
          title = 'Ticket Completado';
          body = `Tu ticket ${updatedTicket.ticket_number} ha sido completado. ¡Gracias por tu visita!`;
          requiresNotification = true;
          break;
        case 'CANCELADO':
          title = 'Ticket Cancelado';
          body = `Tu ticket ${updatedTicket.ticket_number} ha sido cancelado.`;
          requiresNotification = true;
          break;
      }

      if (requiresNotification) {
        showNotification(title, { 
          body, 
          icon: '/logo.png',
          badge: '/logo.png'
        });
        setNotificationCount(prev => prev + 1);
      }
    });

    // Limpieza al desmontar
    return () => {
      unsubscribe();
    };
  }, [user, hasPermission]);

  // Función para solicitar permiso para notificaciones
  const requestPermission = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    return granted;
  };

  // Función para mostrar una notificación
  const showNotification = (title: string, options: NotificationOptions = {}): Notification | null => {
    if (!hasPermission) {
      console.warn('No hay permiso para mostrar notificaciones');
      return null;
    }

    return createBrowserNotification(title, options);
  };

  // Función para limpiar el contador de notificaciones
  const clearNotifications = (): void => {
    setNotificationCount(0);
  };

  const value: NotificationState = {
    hasPermission,
    notificationCount,
    requestPermission,
    clearNotifications,
    showNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 