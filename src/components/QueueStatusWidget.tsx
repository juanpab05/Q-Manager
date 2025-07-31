import React, { useState, useEffect } from 'react';
import { getQueueStatus, subscribeToTicketUpdates } from '@/api/ticketService';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Ticket {
  id: number;
  ticket_number: string;
  status: string;
  status_display?: string;
  service: string;
  is_priority: boolean;
  created_at: string;
  updated_at: string;
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

interface QueueStatusWidgetProps {
  variant?: 'compact' | 'detailed' | 'carousel';
  showUserTicket?: boolean;
  className?: string;
}

const QueueStatusWidget: React.FC<QueueStatusWidgetProps> = ({ 
  variant = 'compact', 
  showUserTicket = true, 
  className = '' 
}) => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updates, setUpdates] = useState<{id: string, type: string}[]>([]);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const ticketUnsubscribe = subscribeToTicketUpdates((payload: any) => {
      setUpdates(prev => [...prev, {id: payload.new.id, type: 'ticket'}]);
      fetchData();
    });
    
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchData, 30000);
    
    return () => {
      ticketUnsubscribe();
      clearInterval(intervalId);
    };
  }, []);

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
      const statusData = await getQueueStatus();
      setQueueStatus(statusData);
      setError(null);
    } catch (err) {
      console.error('Error fetching queue data:', err);
      setError('Error al cargar datos de la cola');
    } finally {
      setLoading(false);
    }
  };

  const shouldAnimate = (ticket: Ticket | null) => {
    if (!ticket) return false;
    return updates.some(update => update.id === String(ticket.id));
  };

  if (variant === 'carousel') {
    return (
      <div className={`bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Estado de la Cola</h3>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm opacity-90">En Vivo</span>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Priority Queue */}
            <div className="text-center">
              <div className="text-xs opacity-75 mb-1">Cola Prioritaria</div>
              <AnimatePresence mode="wait">
                {queueStatus?.priority.current ? (
                  <motion.div 
                    key={queueStatus.priority.current.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: shouldAnimate(queueStatus.priority.current) ? [1, 1.1, 1] : 1 
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-2xl font-bold"
                  >
                    {queueStatus.priority.current.ticket_number}
                  </motion.div>
                ) : (
                  <div className="text-2xl font-bold opacity-50">---</div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Normal Queue */}
            <div className="text-center">
              <div className="text-xs opacity-75 mb-1">Cola Regular</div>
              <AnimatePresence mode="wait">
                {queueStatus?.normal.current ? (
                  <motion.div 
                    key={queueStatus.normal.current.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: shouldAnimate(queueStatus.normal.current) ? [1, 1.1, 1] : 1 
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-2xl font-bold"
                  >
                    {queueStatus.normal.current.ticket_number}
                  </motion.div>
                ) : (
                  <div className="text-2xl font-bold opacity-50">---</div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
        
        {queueStatus?.statistics && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-sm">
              <span>En espera: {queueStatus.statistics.waiting_count}</span>
              <span>Tiempo: ~{Math.round(queueStatus.statistics.avg_wait_time / 60)}min</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Estado de la Cola</h3>
          <Link 
            to="/queue-status"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Ver detalles →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : (
          <>
            {/* User's ticket if available */}
            {showUserTicket && queueStatus?.user_ticket && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-center">
                  <div className="text-sm text-purple-600 font-medium mb-1">Tu Ticket</div>
                  <div className="text-3xl font-bold text-purple-700">
                    {queueStatus.user_ticket.ticket_number}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {queueStatus.user_ticket.status_display || queueStatus.user_ticket.status}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Priority Queue */}
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-xs text-red-600 font-medium mb-2">Cola Prioritaria</div>
                <div className="text-sm text-gray-500 mb-1">Atendiendo ahora:</div>
                <AnimatePresence mode="wait">
                  {queueStatus?.priority.current ? (
                    <motion.div 
                      key={queueStatus.priority.current.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: 1, 
                        scale: shouldAnimate(queueStatus.priority.current) ? [1, 1.1, 1] : 1 
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-2xl font-bold text-red-700"
                    >
                      {queueStatus.priority.current.ticket_number}
                    </motion.div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-400">---</div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Normal Queue */}
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 font-medium mb-2">Cola Regular</div>
                <div className="text-sm text-gray-500 mb-1">Atendiendo ahora:</div>
                <AnimatePresence mode="wait">
                  {queueStatus?.normal.current ? (
                    <motion.div 
                      key={queueStatus.normal.current.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: 1, 
                        scale: shouldAnimate(queueStatus.normal.current) ? [1, 1.1, 1] : 1 
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-2xl font-bold text-blue-700"
                    >
                      {queueStatus.normal.current.ticket_number}
                    </motion.div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-400">---</div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Statistics */}
            {queueStatus?.statistics && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {queueStatus.statistics.waiting_count}
                    </div>
                    <div className="text-xs text-gray-500">En espera</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      ~{Math.round(queueStatus.statistics.avg_wait_time / 60)}min
                    </div>
                    <div className="text-xs text-gray-500">Tiempo promedio</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {queueStatus.statistics.attended_today}
                    </div>
                    <div className="text-xs text-gray-500">Atendidos hoy</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Compact variant (default)
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-medium text-gray-800">Estado de la Cola</h4>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-xs text-gray-500">En vivo</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 text-xs">{error}</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-3">
            <div className="text-center">
              <div className="text-xs text-red-600 mb-1">Prioritario</div>
              <AnimatePresence mode="wait">
                {queueStatus?.priority.current ? (
                  <motion.div 
                    key={queueStatus.priority.current.id}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      scale: shouldAnimate(queueStatus.priority.current) ? [1, 1.1, 1] : 1 
                    }}
                    exit={{ opacity: 0 }}
                    className="text-xl font-bold text-red-700"
                  >
                    {queueStatus.priority.current.ticket_number}
                  </motion.div>
                ) : (
                  <div className="text-xl font-bold text-gray-400">---</div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-blue-600 mb-1">Regular</div>
              <AnimatePresence mode="wait">
                {queueStatus?.normal.current ? (
                  <motion.div 
                    key={queueStatus.normal.current.id}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      scale: shouldAnimate(queueStatus.normal.current) ? [1, 1.1, 1] : 1 
                    }}
                    exit={{ opacity: 0 }}
                    className="text-xl font-bold text-blue-700"
                  >
                    {queueStatus.normal.current.ticket_number}
                  </motion.div>
                ) : (
                  <div className="text-xl font-bold text-gray-400">---</div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {queueStatus?.statistics && (
            <div className="text-center text-xs text-gray-500 border-t pt-2">
              {queueStatus.statistics.waiting_count} en espera • ~{Math.round(queueStatus.statistics.avg_wait_time / 60)}min promedio
            </div>
          )}

          <div className="mt-3">
            <Link 
              to="/queue-status"
              className="block w-full text-center text-indigo-600 hover:text-indigo-800 text-xs font-medium py-1 hover:bg-indigo-50 rounded transition-colors"
            >
              Ver detalles completos →
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default QueueStatusWidget; 