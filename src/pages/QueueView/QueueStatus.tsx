import React, { useState, useEffect, useRef, useCallback } from 'react';
// Navbar import is intentionally removed
import { getQueueStatus, subscribeToTicketUpdates } from '@/api/ticketService';
// import { getAllAnnouncements } from '@/api/announcementService'; // Removed
import { AnimatePresence, motion } from 'framer-motion';
import supabase from '@/utils/supabaseClient';
import AnnouncementsCarousel from '@/components/AnnouncementsCarousel/AnnouncementsCarousel'; // Added
import { useAuth } from '@/contexts/auth/AuthContext'; // Fixed import path
import LoadingSpinner from '@/components/LoadingSpinner';

// interface Announcement { // Removed
//   id: number;
//   title?: string;
//   content?: string;
//   is_active: boolean;
//   media_file?: string;
//   media_type?: string;
//   created_at: string;
//   created_by?: any;
// }

interface Ticket {
  id: number;
  ticket_number: string;
  status: string;
  status_display?: string;
  service: string;
  is_priority: boolean;
  created_at: string;
  updated_at: string;
  punto_acceso_id?: number;
  punto_acceso?: any;
}

interface QueueSection {
  current: Ticket | null;
  last_attended: Ticket | null;
  next_tickets: Ticket[];
}

interface QueueStatus {
  user_ticket: Ticket | null;
  priority: QueueSection;
  normal: QueueSection;
  next_tickets: Ticket[];
  statistics?: {
    waiting_count: number;
    avg_wait_time: number;
    attended_today: number;
  };
}

const QueueStatusView: React.FC = () => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  // const [announcements, setAnnouncements] = useState<Announcement[]>([]); // Removed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0); // Removed
  const [updates, setUpdates] = useState<{id: string, type: string}[]>([]);
  
  // Refs to track previous ticket states for animations
  const prevQueueStatusRef = useRef<QueueStatus | null>(null);
  
  // Get user auth context
  const auth = useAuth();
  
  // State to determine if the user is priority
  const [isPriority, setIsPriority] = useState<boolean>(false);
  // State to determine if user is admin or worker
  const [isStaff, setIsStaff] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is admin or worker (staff)
    const checkUserStatus = async () => {
      try {
        // First check if we have a userProfile and use that data if available
        if (auth.userProfile) {
          // Set staff status from userProfile
          setIsStaff(auth.userProfile.is_staff || auth.userProfile.is_superuser);
          
          // Check for priority status in the actor data if present
          if (auth.userProfile.details && auth.userProfile.userType === 'actor') {
            console.log('User priority status from userProfile:', auth.userProfile.details.has_priority);
            setIsPriority(auth.userProfile.details.has_priority);
            return; // Exit early as we already have the data
          }
        }
        
        // Fallback to direct query if userProfile doesn't have what we need
        if (auth.user?.id) {
          // Check for worker/admin status
          const { data, error } = await supabase
            .from('users')
            .select('is_staff, is_superuser')
            .eq('id', auth.user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user status:', error);
          } else if (data) {
            setIsStaff(data.is_staff || data.is_superuser);
          }
          
          // Check actor table for priority status
          const { data: actorData, error: actorError } = await supabase
            .from('actors')
            .select('has_priority')
            .eq('user_id', auth.user.id)
            .single();
            
          if (actorError && actorError.code !== 'PGRST116') {
            console.error('Error fetching user priority status:', actorError);
          } else if (actorData) {
            console.log('User priority status:', actorData.has_priority);
            setIsPriority(actorData.has_priority);
          }
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };
    
    checkUserStatus();
  }, [auth.user, auth.userProfile]); // Add userProfile as dependency

  useEffect(() => {
    // Run schema fix first
    const runSchemaFix = async () => {
      try {
        // Implement the fix directly here instead of importing it
        const { data, error } = await supabase.rpc('fix_ticket_schema');
        if (error) {
          console.error('Error fixing schema:', error);
        } else {
          console.log('Schema fix result:', data);
        }
        // Continue with data fetch regardless
        fetchData();
      } catch (err) {
        console.error('Error fixing schema:', err);
        // Continue with data fetch even if schema fix fails
        fetchData();
      }
    };
    
    runSchemaFix();
    
    // Set up real-time subscriptions
    const ticketUnsubscribe = subscribeToTicketUpdates((payload: any) => {
      console.log('Ticket update:', payload);
      // Add to updates for animation purposes
      setUpdates(prev => [...prev, {id: payload.new.id, type: 'ticket'}]);
      // Refresh data on any ticket change
      fetchData();
    });
    
    // Use a simple interval for access point updates since we don't have the subscription function
    const intervalId = setInterval(fetchData, 30000); // Fallback refresh every 30 seconds
    
    return () => {
      ticketUnsubscribe();
      clearInterval(intervalId);
    };
  }, [auth.userProfile]); // Add userProfile as dependency to re-run when profile is updated

  // Remove update animations after they've played
  useEffect(() => {
    if (updates.length > 0) {
      const timerId = setTimeout(() => {
        setUpdates([]);
      }, 2000);
      return () => clearTimeout(timerId);
    }
  }, [updates]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Save previous state for animations
      if (queueStatus) {
        prevQueueStatusRef.current = queueStatus;
      }
      
      // const [statusData, rawAnnouncementsData] = await Promise.all([ // Modified
      //   getQueueStatus(),
      //   getAllAnnouncements()
      // ]);
      const statusData = await getQueueStatus(); // Modified
      
      setQueueStatus(statusData);
      // const mappedAnnouncements: Announcement[] = rawAnnouncementsData.map((ann: any) => ({ // Removed block
      //   ...ann,
      //   is_active: ann.is_active === undefined ? false : ann.is_active,
      //   // Ensure we always use the correct property names
      //   media_file: ann.media_file || null,
      //   media_type: ann.media_type || null
      // }));
      
      // console.log("Mapped announcements:", mappedAnnouncements);
      // setAnnouncements(mappedAnnouncements); // Removed
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const shouldAnimate = (ticket: Ticket | null) => {
    if (!ticket) return false;
    return updates.some(update => update.id === String(ticket.id));
  };

  // Modified to control detail visibility based on isStaff and make ticket number prominent
  const renderTicketCard = (ticket: Ticket | null, label: string, isPriorityRole = false, extraClass = '') => {
    if (!ticket) return null;
    
    const wasUpdated = shouldAnimate(ticket);
    
    return (
      <motion.div 
        className={`p-4 rounded-lg shadow-md ${extraClass} ${isPriorityRole ? 'border-l-4 border-red-500' : 'border-l-4 border-blue-200'}`}
        animate={wasUpdated ? {
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          ]
        } : {}}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-start mb-1">
          <p className="text-lg font-semibold">{label}</p>
          {isPriorityRole && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">
              Prioritario
            </span>
          )}
        </div>
        {/* Made ticket number more prominent in general queue cards */}
        <div className={`text-4xl font-bold mb-2 ${isPriorityRole ? 'text-red-700' : 'text-blue-700'}`}>
          {ticket.ticket_number}
        </div>
        
        {/* Conditionally render Service and Status ONLY for staff users in general queue cards */}
        {isStaff && ticket.service && (
          <p className="text-sm">
            <span className="font-medium">Servicio:</span> {ticket.service}
          </p>
        )}
        {isStaff && (
          <p className="text-sm">
            <span className="font-medium">Estado:</span> {ticket.status_display || ticket.status}
          </p>
        )}

        <div className="mt-2">
          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${ticket.is_priority ? 
            'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
            {ticket.is_priority ? 'Prioritario' : 'Normal'}
          </span>
        </div>
      </motion.div>
    );
  };

  const renderUserTicket = (ticket: Ticket) => {
    const wasUpdated = shouldAnimate(ticket);
    
    return (
      <motion.div 
        className="bg-white border-2 border-purple-300 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out"
        animate={wasUpdated ? {
          scale: [1, 1.05, 1],
          borderColor: [
            "rgb(216, 180, 254)", // purple-300
            "rgb(147, 51, 234)", // purple-600
            "rgb(216, 180, 254)" // purple-300
          ]
        } : {}}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center">
          {/* Ticket number styling from previous request, keeping it as it doesn't conflict */}
          <div className="text-purple-700 font-extrabold text-6xl mb-4 tracking-tight">
            {ticket.ticket_number}
          </div>
          <div className="text-gray-700 mb-2 text-lg">
            {ticket.status_display || ticket.status} {/* Status is always shown here */}
          </div>
          {ticket.service && ( /* Service is always shown here if available */
            <div className="mb-1">
              <span className="font-medium">Servicio:</span> {ticket.service}
            </div>
          )}
          <div className="mb-3">
            <span className={`px-3 py-1 text-sm rounded-full font-semibold ${ticket.is_priority ? 
              'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
              {ticket.is_priority ? 'Prioritario' : 'Normal'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Creado: {new Date(ticket.created_at).toLocaleString()}
        </div>
      </div>
      </motion.div>
    );
  };

  if (loading && !queueStatus) {
    return <LoadingSpinner message="Cargando estado de la cola..." />;
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Estado de la Cola
      </h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            className="ml-4 underline"
            onClick={() => setError(null)}
          >
            Cerrar
          </button>
        </div>
      )}
      
      {/* Ticket del usuario */}
      {queueStatus?.user_ticket && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Tu Ticket</h2>
          {renderUserTicket(queueStatus.user_ticket)}
        </div>
      )}
      
      {/* Sección Prioritaria - Mostrar solo si el usuario es prioritario o staff */}
      {(isStaff || isPriority) && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Cola Prioritaria
            <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Atención Preferencial
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {queueStatus?.priority.last_attended ? (
              renderTicketCard(queueStatus.priority.last_attended, 'Atendido Anteriormente', true, 'bg-gray-50')
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg shadow-md text-center border-l-4 border-red-200">
                <p className="text-lg font-semibold mb-1">Atendido Anteriormente</p>
                <p className="text-gray-500">Ninguno</p>
              </div>
            )}
            
            <AnimatePresence mode="wait">
              {queueStatus?.priority.current ? (
                <motion.div 
                  key={queueStatus.priority.current.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    boxShadow: shouldAnimate(queueStatus.priority.current) ? 
                      ["0px 4px 10px rgba(0,0,0,0.1)", "0px 10px 20px rgba(220, 38, 38, 0.3)", "0px 4px 10px rgba(0,0,0,0.1)"] : 
                      "0px 4px 10px rgba(0,0,0,0.1)"
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                  className="p-6 bg-red-50 rounded-lg shadow-xl transform scale-105 z-10 border-2 border-red-400 ring-4 ring-red-200 ring-opacity-50"
                >
                  <p className="text-xl font-semibold mb-2 text-red-800">
                    <span className="inline-block mr-2">
                      <span className="animate-ping absolute h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    En Atención Prioritaria
                  </p>
                  <div className="text-4xl font-bold mb-3 text-red-700">{queueStatus.priority.current.ticket_number}</div>
                <p className="text-base mb-1">
                    <span className="font-medium">Servicio:</span> {queueStatus.priority.current.service}
                </p>
                <div className="mt-3">
                    <span className="px-3 py-1.5 text-sm rounded-full font-semibold bg-red-100 text-red-800 border border-red-300">
                      Prioritario
                  </span>
                  </div>
                </motion.div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg shadow-md text-center border-l-4 border-red-200">
                  <p className="text-lg font-semibold mb-1">En Atención Prioritaria</p>
                  <p className="text-gray-500">Ninguno</p>
                </div>
              )}
            </AnimatePresence>
            
            {queueStatus?.priority.next_tickets && queueStatus.priority.next_tickets.length > 0 ? (
              renderTicketCard(queueStatus.priority.next_tickets[0], 'Próximo Prioritario', true, 'bg-red-50')
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg shadow-md text-center border-l-4 border-red-200">
                <p className="text-lg font-semibold mb-1">Próximo Prioritario</p>
                <p className="text-gray-500">Ninguno</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Sección Normal - Mostrar solo si el usuario NO es prioritario o es staff */}
      {(isStaff || !isPriority) && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Cola Regular
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Atención General
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {queueStatus?.normal.last_attended ? (
              renderTicketCard(queueStatus.normal.last_attended, 'Atendido Anteriormente', false, 'bg-gray-50')
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg shadow-md text-center border-l-4 border-blue-200">
                <p className="text-lg font-semibold mb-1">Atendido Anteriormente</p>
                <p className="text-gray-500">Ninguno</p>
              </div>
            )}
            
            <AnimatePresence mode="wait">
              {queueStatus?.normal.current ? (
                <motion.div 
                  key={queueStatus.normal.current.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    boxShadow: shouldAnimate(queueStatus.normal.current) ? 
                      ["0px 4px 10px rgba(0,0,0,0.1)", "0px 10px 20px rgba(37, 99, 235, 0.3)", "0px 4px 10px rgba(0,0,0,0.1)"] : 
                      "0px 4px 10px rgba(0,0,0,0.1)"
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                  className="p-6 bg-blue-50 rounded-lg shadow-xl transform scale-105 z-10 border-2 border-blue-400 ring-4 ring-blue-200 ring-opacity-50"
                >
                  <p className="text-xl font-semibold mb-2 text-blue-800">
                    <span className="inline-block mr-2">
                      <span className="animate-ping absolute h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    En Atención Ahora
                  </p>
                  <div className="text-4xl font-bold mb-3 text-blue-700">{queueStatus.normal.current.ticket_number}</div>
                  <p className="text-base mb-1">
                    <span className="font-medium">Servicio:</span> {queueStatus.normal.current.service}
                  </p>
                  <div className="mt-3">
                    <span className="px-3 py-1.5 text-sm rounded-full font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                      Normal
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg shadow-md text-center border-l-4 border-blue-200">
                  <p className="text-lg font-semibold mb-1">En Atención Ahora</p>
                  <p className="text-gray-500">Ninguno</p>
                </div>
              )}
            </AnimatePresence>
            
            {queueStatus?.normal.next_tickets && queueStatus.normal.next_tickets.length > 0 ? (
              renderTicketCard(queueStatus.normal.next_tickets[0], 'Próximo', false, 'bg-blue-50')
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg shadow-md text-center border-l-4 border-blue-200">
                <p className="text-lg font-semibold mb-1">Próximo</p>
                <p className="text-gray-500">Ninguno</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Lista de tickets en espera - Mostrar solo para staff */}
      {isStaff && queueStatus?.next_tickets && queueStatus.next_tickets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Todos los Tickets en Espera</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {queueStatus.next_tickets.map((ticket) => {
                  const isUpdated = shouldAnimate(ticket);
                  
                  return (
                    <motion.tr 
                      key={ticket.id}
                      animate={isUpdated ? { 
                        backgroundColor: ["rgba(255,255,255,0)", "rgba(219, 234, 254, 0.3)", "rgba(255,255,255,0)"] 
                      } : {}}
                      transition={{ duration: 1.5 }}
                    >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{ticket.ticket_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ticket.service}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ticket.status_display || ticket.status}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${ticket.is_priority ? 
                        'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {ticket.is_priority ? 'Prioritario' : 'Normal'}
                      </span>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ticket.created_at).toLocaleTimeString()}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Anuncios */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Anuncios</h2>
        <AnnouncementsCarousel />
      </div>
      
      {/* Estadísticas - Mostrar solo para staff */}
      {isStaff && queueStatus?.statistics && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Estadísticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <p className="text-sm text-gray-500 mb-1">Tickets en espera</p>
              <p className="text-3xl font-bold text-indigo-600">{queueStatus.statistics.waiting_count}</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <p className="text-sm text-gray-500 mb-1">Tiempo de espera promedio</p>
              <p className="text-3xl font-bold text-indigo-600">
                {Math.round(queueStatus.statistics.avg_wait_time / 60)} min
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <p className="text-sm text-gray-500 mb-1">Tickets atendidos hoy</p>
              <p className="text-3xl font-bold text-indigo-600">{queueStatus.statistics.attended_today}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueStatusView; 