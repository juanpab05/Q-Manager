import React from 'react';
import LoadingSpinner from "@/components/LoadingSpinner";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import chart components
import StatisticsCards from './components/StatisticsCards';
import ChartGrid from './components/ChartGrid';
import AccessPointTable from './components/AccessPointTable';
import ErrorModal from './components/ErrorModal';

// Custom hooks
import { useStatistics } from './hooks/useStatistics';

const Statistics: React.FC = () => {
  const {
    statistics,
    loading,
    error,
    errorMessage,
    showErrorModal,
    refreshData,
    closeErrorModal
  } = useStatistics();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">Cargando estadísticas del sistema...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={refreshData}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return <LoadingSpinner message="Cargando estadísticas..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <main className="py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Estadísticas
            </h1>
            <button 
              onClick={refreshData}
              className="flex items-center py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
              aria-label="Actualizar estadísticas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Actualizar
            </button>
          </div>

          {/* Statistics Cards */}
          <StatisticsCards statistics={statistics} />

          {/* Charts Grid */}
          <ChartGrid statistics={statistics} />

          {/* Access Points Table */}
          <AccessPointTable statistics={statistics} />
        </div>
      </main>

      {/* Error Modal */}
      <ErrorModal 
        show={showErrorModal}
        message={errorMessage}
        onClose={closeErrorModal}
      />
    </div>
  );
};

export default Statistics; 