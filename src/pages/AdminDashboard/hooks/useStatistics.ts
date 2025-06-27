import { useState, useEffect, useCallback } from 'react';
import { getSystemStatistics, SystemStatistics } from '@/api/accessPointService';

interface UseStatisticsReturn {
  statistics: SystemStatistics | null;
  loading: boolean;
  error: string | null;
  errorMessage: string;
  showErrorModal: boolean;
  refreshData: () => void;
  closeErrorModal: () => void;
}

export const useStatistics = (): UseStatisticsReturn => {
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching statistics...");
      const data = await getSystemStatistics();
      console.log("Statistics received:", data);
      setStatistics(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      const message = "No se pudieron cargar las estadísticas. Por favor intente más tarde.";
      setErrorMessage(message);
      setShowErrorModal(true);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics, refreshKey]);

  const refreshData = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  const closeErrorModal = useCallback(() => {
    setShowErrorModal(false);
    setErrorMessage("");
  }, []);

  return {
    statistics,
    loading,
    error,
    errorMessage,
    showErrorModal,
    refreshData,
    closeErrorModal
  };
}; 