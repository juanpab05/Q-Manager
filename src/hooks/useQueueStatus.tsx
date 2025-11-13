import { useState, useEffect } from 'react';
import { getQueueStatus, subscribeToTicketUpdates } from '@/api/ticketService';

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

interface UseQueueStatusOptions {
  refreshInterval?: number; // ms
  enableRealTime?: boolean;
  autoStart?: boolean;
}

export const useQueueStatus = ({
  refreshInterval = 30000,
  enableRealTime = true,
  autoStart = true
}: UseQueueStatusOptions = {}) => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updates, setUpdates] = useState<{id: string, type: string}[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const statusData = await getQueueStatus();
      setQueueStatus(statusData);
      setError(null);
      setIsConnected(true);
    } catch (err) {
      console.error('Error fetching queue data:', err);
      setError('Error al cargar datos de la cola');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchData();
  };

  useEffect(() => {
    if (!autoStart) return;

    fetchData();
    
    let unsubscribe: (() => void) | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    // Set up real-time subscriptions if enabled
    if (enableRealTime) {
      try {
        unsubscribe = subscribeToTicketUpdates((payload: any) => {
          setUpdates(prev => [...prev, {id: payload.new.id, type: 'ticket'}]);
          fetchData();
        });
      } catch (err) {
        console.warn('Failed to setup real-time subscription:', err);
      }
    }
    
    // Set up polling fallback
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchData, refreshInterval);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshInterval, enableRealTime, autoStart]);

  // Remove update animations after they've played
  useEffect(() => {
    if (updates.length > 0) {
      const timerId = setTimeout(() => {
        setUpdates([]);
      }, 2000);
      return () => clearTimeout(timerId);
    }
  }, [updates]);

  const shouldAnimate = (ticket: Ticket | null) => {
    if (!ticket) return false;
    return updates.some(update => update.id === String(ticket.id));
  };

  // Computed values for easy access
  const currentPriorityTicket = queueStatus?.priority.current;
  const currentNormalTicket = queueStatus?.normal.current;
  const userTicket = queueStatus?.user_ticket;
  const statistics = queueStatus?.statistics;
  const waitingCount = statistics?.waiting_count || 0;
  const avgWaitTime = statistics?.avg_wait_time || 0;
  const attendedToday = statistics?.attended_today || 0;

  return {
    // State
    queueStatus,
    loading,
    error,
    isConnected,
    
    // Actions
    refresh,
    
    // Animation helpers
    shouldAnimate,
    
    // Computed values
    currentPriorityTicket,
    currentNormalTicket,
    userTicket,
    statistics,
    waitingCount,
    avgWaitTime: Math.round(avgWaitTime / 60), // Convert to minutes
    attendedToday,
    
    // Utilities
    hasActiveQueue: !!(currentPriorityTicket || currentNormalTicket),
    hasUserTicket: !!userTicket,
    isEmpty: waitingCount === 0 && !currentPriorityTicket && !currentNormalTicket
  };
}; 