import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // Only if used for the deleted auth check
// import Navbar from '../navbar/navbar'; // Navbar is already global
import { getSystemStatistics, SystemStatistics } from '@/api/accessPointService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, LineChart, Line, AreaChart, Area, TooltipProps
} from 'recharts';

// Color palette to maintain design consistency
const COLORS = {
  indigo: '#6366f1',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  gray: '#6b7280',
  teal: '#14b8a6' // Added for more variety
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

  useEffect(() => {
    // The localStorage check and navigation has been REMOVED.
    // ProtectedRoutes.tsx handles route protection.
    fetchStatistics();
  }, []); // Removed navigate from dependencies

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      console.log("Fetching statistics...");
      const data = await getSystemStatistics();
      console.log("Statistics received:", data);
      setStatistics(data);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setErrorMessage("No se pudieron cargar las estadísticas. Por favor intente más tarde.");
      setShowErrorModal(true);
      setError("Error al cargar las estadísticas. Por favor intente más tarde.");
      setLoading(false);
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  // Data transformations for charts
  const prepareUsersChartData = () => {
    if (!statistics) return [];
    const operationalWorkers = statistics.users.total_operational_workers || 0;
    const otherNonAdminActors = (statistics.users.total_actors_non_admin || 0) - operationalWorkers;

    const data = [];
    data.push({ name: 'Trabajadores (Operativos)', value: operationalWorkers, fill: COLORS.blue });
    if (otherNonAdminActors > 0) {
      data.push({ name: 'Otros Actores (No Personal)', value: otherNonAdminActors, fill: COLORS.orange });
    }
    return data.filter(d => d.value >= 0);
  };

  const prepareTicketsBreakdownChartData = () => {
    if (!statistics) return [];
    return [
      { name: 'Prioritarios', value: statistics.tickets.total_priority || 0, color: COLORS.red },
      { name: 'Normales', value: statistics.tickets.total_normal || 0, color: COLORS.green }
    ];
  };

  const prepareAccessPointsChartData = () => {
    if (!statistics) return [];
    return [
      { name: 'Total', value: statistics.access_points.total, color: COLORS.indigo },
      { name: 'Activos', value: statistics.access_points.active, color: COLORS.green },
      { name: 'Pausados', value: statistics.access_points.paused, color: COLORS.yellow },
      { name: 'Prioritarios Habilitados', value: statistics.access_points.priority, color: COLORS.red }
    ];
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900">{`${label} : ${payload[0].value}`}</p>
          {payload[0].payload.fill && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 10, height: 10, backgroundColor: payload[0].payload.fill, marginRight: 5, borderRadius: '50%' }}></div>
              <span>{payload[0].name}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <p className="text-gray-600 text-lg">Cargando estadísticas...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={fetchStatistics}
            className="py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Reintentar
          </button>
        </div>
      </>
    );
  }

  if (!statistics) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <p className="text-gray-600 text-lg">No hay estadísticas disponibles</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <main className="py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Estadísticas
            </h1>
              <button 
                onClick={fetchStatistics}
                className="flex items-center py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Actualizar
              </button>
            </div>

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

            {/* Dashboard overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Actores (No Admins)</p>
                    <h3 className="text-2xl font-bold text-gray-900">{statistics.users.total_actors_non_admin || 0}</h3>
                  </div>
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {statistics.users.total_operational_workers || 0} trab. operativos
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Tickets</p>
                    <h3 className="text-2xl font-bold text-gray-900">{statistics.tickets.total || 0}</h3>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {statistics.tickets.pending || 0} pendientes, {statistics.tickets.attended || 0} atendidos
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Puntos de Acceso</p>
                    <h3 className="text-2xl font-bold text-gray-900">{statistics.access_points.total || 0}</h3>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {statistics.access_points.active || 0} activos, {statistics.access_points.paused || 0} pausados
                  </span>
                </div>
              </div>
            </div>

            {/* Average Wait Times Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                <p className="text-sm text-gray-500 mb-1">Espera Prom. Tickets Prioritarios</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {(statistics.tickets.avg_wait_time_priority_minutes !== undefined ? parseFloat(statistics.tickets.avg_wait_time_priority_minutes.toString()).toFixed(1) : 'N/A')} min
                </h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
                <p className="text-sm text-gray-500 mb-1">Espera Prom. Tickets Normales</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {(statistics.tickets.avg_wait_time_normal_minutes !== undefined ? parseFloat(statistics.tickets.avg_wait_time_normal_minutes.toString()).toFixed(1) : 'N/A')} min
                </h3>
              </div>
            </div>

            {/* Usuarios y Tickets Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Usuarios Charts */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-800">Distribución de Usuarios (No Admins)</h2>
                  <p className="text-sm text-gray-500 mt-1">Desglose por tipo de actor no administrador</p>
                </div>
                <div className="p-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareUsersChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" name="Cantidad" >
                        {prepareUsersChartData().map((entry, index) => (
                          <Cell key={`cell-user-${index}`} fill={entry.fill || COLORS.indigo} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tickets Breakdown Chart (Priority vs Normal) */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-800">Desglose de Tickets (Prioridad)</h2>
                  <p className="text-sm text-gray-500 mt-1">Cantidad de tickets por tipo de prioridad</p>
                </div>
                <div className="p-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareTicketsBreakdownChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false}/>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" name="Cantidad">
                        {prepareTicketsBreakdownChartData().map((entry, index) => (
                          <Cell key={`cell-ticket-breakdown-${index}`} fill={entry.color || COLORS.blue} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Access Points Charts */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Puntos de Acceso (Estado General)</h2>
                <p className="text-sm text-gray-500 mt-1">Estado y distribución de puntos de acceso</p>
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareAccessPointsChartData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="value" name="Cantidad">
                      {prepareAccessPointsChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabla de detalles de puntos de acceso */}
            {statistics.access_points.points_detail.length > 0 && (
              <div className="bg-white overflow-hidden shadow-md rounded-xl">
                <div className="p-6 border-b flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Detalles de Puntos Activos</h3>
                    <p className="text-sm text-gray-500 mt-1">Información detallada de cada punto de acceso</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Total: {statistics.access_points.points_detail.length} puntos
                  </div>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${point.is_priority ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {point.is_priority ? 'Prioritario' : 'Normal'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                point.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 
                                point.estado === 'PAUSADO' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {point.estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <div className="mr-2">{point.tickets_atendidos}</div>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <div className="mr-2">{point.users_count}</div>
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

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-10 transition-opacity" onClick={closeErrorModal}></div>
            
            <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6 shadow-xl transform transition-all">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
    </>
  );
};

export default Statistics; 