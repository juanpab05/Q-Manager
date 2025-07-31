import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import QueueStatusWidget from './QueueStatusWidget';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingQueueStatusProps {
  enabledRoutes?: string[]; // Routes where the floating widget should appear
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoShow?: boolean;
  defaultExpanded?: boolean;
}

const FloatingQueueStatus: React.FC<FloatingQueueStatusProps> = ({
  enabledRoutes = ['/about', '/home-user', '/personal-data', '/request-ticket'],
  position = 'bottom-right',
  autoShow = true,
  defaultExpanded = false
}) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isVisible, setIsVisible] = useState(true);

  // Check if current route should show the floating widget
  const shouldShow = autoShow && enabledRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  if (!shouldShow || !isVisible) {
    return null;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default: // bottom-right
        return 'bottom-4 right-4';
    }
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8, x: position.includes('right') ? 20 : -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: position.includes('right') ? 20 : -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-sm"
          >
            {/* Header with controls */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <h4 className="text-sm font-medium text-gray-700">Estado de la Cola</h4>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleToggle}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Minimizar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={handleClose}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Cerrar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6m0 12L6 6" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-3">
              <QueueStatusWidget 
                variant="compact" 
                showUserTicket={true}
                className="border-0 shadow-none p-0 bg-transparent"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={handleToggle}
              className="bg-white rounded-full shadow-lg border border-gray-200 p-3 hover:shadow-xl transition-all duration-200 group"
              title="Ver estado de la cola"
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                  Cola
                </span>
                <svg 
                  className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingQueueStatus; 