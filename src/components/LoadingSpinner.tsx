import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Cargando...", 
  showRetryButton = false,
  onRetry 
}) => {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (showRetryButton) {
      const timer = setTimeout(() => {
        setShowRetry(true);
      }, 15000); // Show retry button after 15 seconds

      return () => clearTimeout(timer);
    }
  }, [showRetryButton]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-gray-600 text-lg font-medium">{message}</p>
      
      {showRetry && (
        <button
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
};

export default LoadingSpinner; 