import React, { useEffect, useState, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom'; // Only if used for the deleted auth check
// import Navbar from '../navbar/navbar'; // Navbar is already global
import { getSystemStatistics, SystemStatistics } from '@/api/accessPointService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, TooltipProps, PieChart, Pie, LineChart, Line, Area, AreaChart
} from 'recharts';

// Color palette for design consistency and better visualizations
const COLORS = {
  indigo: '#6366f1',
  indigoLight: '#818cf8',
  green: '#22c55e',
  greenLight: '#4ade80',
  yellow: '#eab308',
  yellowLight: '#facc15',
  red: '#ef4444',
  redLight: '#f87171',
  blue: '#3b82f6',
  blueLight: '#60a5fa',
  purple: '#a855f7',
  purpleLight: '#c084fc',
  pink: '#ec4899',
  pinkLight: '#f472b6',
  orange: '#f97316',
  orangeLight: '#fb923c',
  gray: '#6b7280',
  grayLight: '#9ca3af',
  teal: '#14b8a6',
  tealLight: '#2dd4bf'
};

interface PointDetail {
  id: number;
  is_priority: boolean;
  estado: string;
  tickets_atendidos: number;
  users_count: number;
  // Add other fields if they exist
}

const Statistics: React.FC = () => {
  // const navigate = useNavigate(); // Removed
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0); // Add this to force re-render on data refresh

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
      setErrorMessage("No se pudieron cargar las estadísticas. Por favor intente más tarde.");
      setShowErrorModal(true);
      setError("Error al cargar las estadísticas. Por favor intente más tarde.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1); // Increment to trigger a re-fetch
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  // Data transformations for charts - improved to handle edge cases
  const prepareUsersChartData = () => {
    if (!statistics?.users) return [];
    
    const total_actors_non_admin = statistics.users.total_actors_non_admin || 0;
    const total_operational_workers = statistics.users.total_operational_workers || 0;
    const total_admin_workers = statistics.users.total_admin_workers || 0;
    const regular_users = Math.max(0, total_actors_non_admin - total_operational_workers);

    return [
      { name: 'Usuarios Regulares', value: regular_users, fill: COLORS.blue },
      { name: 'Trabajadores', value: total_operational_workers, fill: COLORS.green },
      { name: 'Administradores', value: total_admin_workers, fill: COLORS.purple }
    ].filter(item => item.value > 0);
  };

  const prepareTicketsBreakdownChartData = () => {
    if (!statistics?.tickets) return [];
    
    const priorityTickets = statistics.tickets.total_priority || 0;
    const normalTickets = statistics.tickets.total_normal || 0;
    
    return [
      { name: 'Prioritarios', value: priorityTickets, color: COLORS.red },
      { name: 'Normales', value: normalTickets, color: COLORS.green }
    ];
  };

  const prepareAccessPointsChartData = () => {
    if (!statistics?.access_points) return [];
    
    return [
      { name: 'Total', value: statistics.access_points.total || 0, color: COLORS.indigo },
      { name: 'Activos', value: statistics.access_points.active || 0, color: COLORS.green },
      { name: 'Pausados', value: statistics.access_points.paused || 0, color: COLORS.yellow },
      { name: 'Prioritarios', value: statistics.access_points.priority || 0, color: COLORS.red }
    ];
  };

  const prepareTicketStatusData = () => {
    if (!statistics?.tickets) return [];
    
    const pending = statistics.tickets.pending || 0;
    const attended = statistics.tickets.attended || 0;
    
    return [
      { name: 'Pendientes', value: pending, color: COLORS.yellow },
      { name: 'Atendidos', value: attended, color: COLORS.green }
    ];
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900 mb-1">{`${label || data.name}: ${payload[0].value}`}</p>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: data.color || data.fill || payload[0].fill }}></div>
            <span className="text-sm text-gray-600">{payload[0].name}</span>
          </div>
        </div>
      );
    }
    return null;
  };

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
            onClick={fetchStatistics}
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 text-lg font-medium">No hay estadísticas disponibles</p>
          <button
            onClick={fetchStatistics}
            className="mt-4 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Cargar datos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <main className="py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Estadísticas
            </h1>
            <button 
              onClick={handleRefresh}
              className="flex items-center py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Actualizar
            </button>
          </div>

          {/* System health summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Usuarios Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-indigo-500">
              <div className="p-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Usuarios</p>
                  <h3 className="mt-1 text-2xl font-semibold text-gray-900">{statistics.users.total_actors_non_admin || 0}</h3>
                </div>
                <div className="p-2 bg-indigo-100 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="bg-indigo-50 px-4 py-2">
                <span className="text-sm text-indigo-700">
                  {statistics.users.total_operational_workers || 0} trabajadores
                </span>
              </div>
            </div>
            
            {/* Tickets Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-green-500">
              <div className="p-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Tickets</p>
                  <h3 className="mt-1 text-2xl font-semibold text-gray-900">{statistics.tickets.total || 0}</h3>
                </div>
                <div className="p-2 bg-green-100 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              </div>
              <div className="bg-green-50 px-4 py-2">
                <span className="text-sm text-green-700">
                  {statistics.tickets.pending || 0} pendientes, {statistics.tickets.attended || 0} atendidos
                </span>
              </div>
            </div>
            
            {/* Puntos de Acceso Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-yellow-500">
              <div className="p-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Puntos de Acceso</p>
                  <h3 className="mt-1 text-2xl font-semibold text-gray-900">{statistics.access_points.total || 0}</h3>
                </div>
                <div className="p-2 bg-yellow-100 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="bg-yellow-50 px-4 py-2">
                <span className="text-sm text-yellow-700">
                  {statistics.access_points.active || 0} activos, {statistics.access_points.paused || 0} pausados
                </span>
              </div>
            </div>
            
            {/* Tickets Prioritarios Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-red-500">
              <div className="p-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Tickets Prioritarios</p>
                  <h3 className="mt-1 text-2xl font-semibold text-gray-900">{statistics.tickets.total_priority || 0}</h3>
                </div>
                <div className="p-2 bg-red-100 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="bg-red-50 px-4 py-2">
                <span className="text-sm text-red-700">
                  {statistics.tickets.total ? Math.round((statistics.tickets.total_priority / statistics.tickets.total) * 100) : 0}% del total
                </span>
              </div>
            </div>
          </div>

          {/* System health summary card */}
          <div className="mb-8 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600">
              <h2 className="text-xl font-bold text-white">
                Resumen del Sistema
              </h2>
              <p className="text-indigo-100 text-sm">Estado actual y métricas clave</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-md bg-indigo-100 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-700" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Usuarios</h3>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Actores (No Admins)</span>
                      <span className="text-sm font-medium">{statistics.users.total_actors_non_admin || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ width: `${(statistics.users.total_actors_non_admin && statistics.users.total_operational_workers) ? Math.min(100, (statistics.users.total_operational_workers / statistics.users.total_actors_non_admin) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-md bg-green-100 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Tickets</h3>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Atendidos</span>
                      <span className="text-sm font-medium">{statistics.tickets.attended || 0}/{statistics.tickets.total || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${statistics.tickets.total ? Math.min(100, (statistics.tickets.attended / statistics.tickets.total) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-md bg-yellow-100 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-700" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Puntos Activos</h3>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Estado</span>
                      <span className="text-sm font-medium">{statistics.access_points.active || 0}/{statistics.access_points.total || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-yellow-500 h-2.5 rounded-full" 
                        style={{ width: `${statistics.access_points.total ? Math.min(100, (statistics.access_points.active / statistics.access_points.total) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-md bg-red-100 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-700" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Tickets Prioritarios</h3>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Del Total</span>
                      <span className="text-sm font-medium">{statistics.tickets.total ? Math.round((statistics.tickets.total_priority / statistics.tickets.total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-red-600 h-2.5 rounded-full" 
                        style={{ width: `${statistics.tickets.total ? Math.min(100, (statistics.tickets.total_priority / statistics.tickets.total) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wait Time Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md overflow-hidden">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-blue-100 rounded-md mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Tiempo Promedio de Espera (Tickets Prioritarios)</h3>
              </div>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-blue-600">
                  {statistics.tickets.avg_wait_time_priority_minutes ? 
                    parseFloat(statistics.tickets.avg_wait_time_priority_minutes.toString()).toFixed(1) : 
                    '0.0'}
                </span>
                <span className="ml-2 text-gray-600 text-lg">minutos</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full"
                  style={{ 
                    width: `${Math.min(100, (parseFloat(statistics.tickets.avg_wait_time_priority_minutes?.toString() || '0') / 60) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md overflow-hidden">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-orange-100 rounded-md mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Tiempo Promedio de Espera (Tickets Normales)</h3>
              </div>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-orange-600">
                  {statistics.tickets.avg_wait_time_normal_minutes ? 
                    parseFloat(statistics.tickets.avg_wait_time_normal_minutes.toString()).toFixed(1) : 
                    '0.0'}
                </span>
                <span className="ml-2 text-gray-600 text-lg">minutos</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full"
                  style={{ 
                    width: `${Math.min(100, (parseFloat(statistics.tickets.avg_wait_time_normal_minutes?.toString() || '0') / 60) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Chart row - Users and Tickets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Distribution Chart - switched to PieChart for better visualization */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Distribución de Usuarios</h2>
                <p className="text-sm text-gray-500 mt-1">Desglose por tipo de usuario</p>
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareUsersChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {prepareUsersChartData().map((entry, index) => (
                        <Cell key={`cell-user-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tickets Status Chart - improved visualization */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Estado de Tickets</h2>
                <p className="text-sm text-gray-500 mt-1">Pendientes vs. Atendidos</p>
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareTicketStatusData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="value" name="Cantidad">
                      {prepareTicketStatusData().map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart row - Tickets Priority and Access Points */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Tickets Priority Distribution - new PieChart for better visualization */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Distribución de Tickets por Prioridad</h2>
                <p className="text-sm text-gray-500 mt-1">Prioritarios vs. Normales</p>
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareTicketsBreakdownChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {prepareTicketsBreakdownChartData().map((entry, index) => (
                        <Cell key={`cell-priority-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Access Points Chart - improved visualization */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Puntos de Acceso</h2>
                <p className="text-sm text-gray-500 mt-1">Estado general de los puntos de servicio</p>
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareAccessPointsChartData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="value" name="Cantidad">
                      {prepareAccessPointsChartData().map((entry, index) => (
                        <Cell key={`cell-ap-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabla de detalles de puntos de acceso - enhanced */}
          {statistics.access_points.points_detail && statistics.access_points.points_detail.length > 0 && (
            <div className="bg-white overflow-hidden shadow-md rounded-xl mb-8">
              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-800">Detalle de Puntos de Acceso</h3>
                <p className="text-sm text-gray-500 mt-1">Información detallada de cada punto activo en el sistema</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tickets Atendidos
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuarios Atendidos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statistics.access_points.points_detail.map((point: PointDetail) => (
                      <tr key={point.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {point.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${point.is_priority ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            {point.is_priority ? 'Prioritario' : 'Normal'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            point.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 
                            point.estado === 'PAUSADO' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {point.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="mr-2 font-medium">{point.tickets_atendidos}</span>
                            {point.tickets_atendidos > 0 && (
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min(100, (point.tickets_atendidos / Math.max(1, ...statistics.access_points.points_detail.map((p: PointDetail) => p.tickets_atendidos))) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="mr-2 font-medium">{point.users_count}</span>
                            {point.users_count > 0 && (
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-indigo-500 h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min(100, (point.users_count / Math.max(1, ...statistics.access_points.points_detail.map((p: PointDetail) => p.users_count))) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Error Modal - enhanced */}
      {showErrorModal && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm transition-opacity" onClick={closeErrorModal}></div>
          
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6 shadow-xl transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
              
              <p className="text-sm text-gray-500 mb-6">
                {errorMessage}
              </p>
              
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={closeErrorModal}
                  className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics; 