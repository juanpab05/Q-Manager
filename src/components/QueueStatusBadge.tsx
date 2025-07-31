import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQueueStatus } from '@/hooks/useQueueStatus';

interface QueueStatusBadgeProps {
  variant?: 'navbar' | 'floating' | 'sidebar';
  showDetails?: boolean;
  className?: string;
  onClick?: () => void;
}

const QueueStatusBadge: React.FC<QueueStatusBadgeProps> = ({
  variant = 'navbar',
  showDetails = false,
  className = '',
  onClick
}) => {
  const {
    currentPriorityTicket,
    currentNormalTicket,
    userTicket,
    waitingCount,
    loading,
    error,
    isConnected,
    shouldAnimate,
    hasActiveQueue,
    hasUserTicket
  } = useQueueStatus();

  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`fixed bottom-4 right-4 z-50 bg-white rounded-full shadow-lg border border-gray-200 p-3 cursor-pointer hover:shadow-xl transition-shadow ${className}`}
        onClick={onClick}
      >
        <Link to="/queue-status" className="block">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            {hasActiveQueue && (
              <div className="flex items-center space-x-1 text-sm font-medium">
                {currentPriorityTicket && (
                  <span className="text-red-600">P:{currentPriorityTicket.ticket_number}</span>
                )}
                {currentNormalTicket && (
                  <span className="text-blue-600">N:{currentNormalTicket.ticket_number}</span>
                )}
              </div>
            )}
            <span className="text-xs text-gray-500">
              {loading ? '...' : waitingCount}
            </span>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">Cola</h4>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
        
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-600 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="text-xs text-red-500">Error</div>
        ) : (
          <>
            {hasUserTicket && userTicket && (
              <div className="mb-2 p-2 bg-purple-100 rounded text-center">
                <div className="text-xs text-purple-600">Tu Ticket</div>
                <div className="font-bold text-purple-700">{userTicket.ticket_number}</div>
              </div>
            )}
            
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-red-600">Prioritario:</span>
                <AnimatePresence mode="wait">
                  {currentPriorityTicket ? (
                    <motion.span 
                      key={currentPriorityTicket.id}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        scale: shouldAnimate(currentPriorityTicket) ? [1, 1.1, 1] : 1 
                      }}
                      exit={{ opacity: 0 }}
                      className="font-bold text-red-700"
                    >
                      {currentPriorityTicket.ticket_number}
                    </motion.span>
                  ) : (
                    <span className="text-gray-400">---</span>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-blue-600">Regular:</span>
                <AnimatePresence mode="wait">
                  {currentNormalTicket ? (
                    <motion.span 
                      key={currentNormalTicket.id}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        scale: shouldAnimate(currentNormalTicket) ? [1, 1.1, 1] : 1 
                      }}
                      exit={{ opacity: 0 }}
                      className="font-bold text-blue-700"
                    >
                      {currentNormalTicket.ticket_number}
                    </motion.span>
                  ) : (
                    <span className="text-gray-400">---</span>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="pt-1 border-t text-xs text-gray-500 text-center">
                {waitingCount} en espera
              </div>
            </div>
            
            <Link 
              to="/queue-status"
              className="block mt-2 text-xs text-indigo-600 hover:text-indigo-800 text-center"
            >
              Ver más →
            </Link>
          </>
        )}
      </div>
    );
  }

  // Navbar variant (default)
  return (
    <Link 
      to="/queue-status"
      className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ${className}`}
      onClick={onClick}
    >
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      
      {loading ? (
        <span className="text-sm text-gray-600">Cargando...</span>
      ) : error ? (
        <span className="text-sm text-red-500">Error</span>
      ) : (
        <div className="flex items-center space-x-1">
          {hasUserTicket && userTicket && (
            <span className="text-sm font-medium text-purple-600">
              {userTicket.ticket_number}
            </span>
          )}
          
          {hasActiveQueue && (
            <div className="flex items-center space-x-1">
              {currentPriorityTicket && (
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={currentPriorityTicket.id}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      scale: shouldAnimate(currentPriorityTicket) ? [1, 1.05, 1] : 1 
                    }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium text-red-600"
                  >
                    P:{currentPriorityTicket.ticket_number}
                  </motion.span>
                </AnimatePresence>
              )}
              {currentNormalTicket && (
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={currentNormalTicket.id}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      scale: shouldAnimate(currentNormalTicket) ? [1, 1.05, 1] : 1 
                    }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium text-blue-600"
                  >
                    N:{currentNormalTicket.ticket_number}
                  </motion.span>
                </AnimatePresence>
              )}
            </div>
          )}
          
          {showDetails && (
            <span className="text-xs text-gray-500">
              ({waitingCount} esperando)
            </span>
          )}
          
          {!hasActiveQueue && !hasUserTicket && (
            <span className="text-sm text-gray-500">Cola vacía</span>
          )}
        </div>
      )}
    </Link>
  );
};

export default QueueStatusBadge; 