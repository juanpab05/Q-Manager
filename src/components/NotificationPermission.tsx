import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationPermission: React.FC = () => {
  const { hasPermission, requestPermission } = useNotifications();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Mostrar el prompt sólo si no tenemos permisos y no lo hemos mostrado antes
    if (!hasPermission && !localStorage.getItem('notification_prompt_shown')) {
      // Esperar un poco antes de mostrar el mensaje para no abrumar al usuario
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [hasPermission]);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    setShowPrompt(false);
    
    // Marcar que ya mostramos el prompt para no volver a mostrarlo inmediatamente
    localStorage.setItem('notification_prompt_shown', 'true');
    
    if (granted) {
      // Si el usuario dio permiso, podemos mostrar un mensaje de éxito
      console.log('Permisos de notificación concedidos');
    } else {
      console.log('Permisos de notificación denegados');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification_prompt_shown', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg p-4 z-50 border border-indigo-100">
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2 mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">Activar notificaciones</h3>
          <div className="mt-1 text-sm text-gray-500">
            <p>
              Recibe alertas cuando tu turno esté próximo a ser atendido y mantente informado sobre el estado de tus tickets.
            </p>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              type="button"
              onClick={handleRequestPermission}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Activar
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermission; 