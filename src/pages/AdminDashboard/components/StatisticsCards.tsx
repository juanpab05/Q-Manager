import React from 'react';
import { SystemStatistics } from '@/api/accessPointService';

interface StatisticsCardsProps {
  statistics: SystemStatistics;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ statistics }) => {
  return (
    <>
      {/* System health summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Usuarios Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-indigo-500">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">Usuarios Activos</p>
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
              {statistics.users.total_operational_workers || 0} trabajadores operativos
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
                <h3 className="text-lg font-semibold text-gray-800">Usuarios Activos</h3>
              </div>
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Usuarios Regulares</span>
                  <span className="text-sm font-medium">{statistics.users.total_actors_non_admin || 0}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Trabajadores Operativos</span>
                  <span className="text-sm font-medium">{statistics.users.total_operational_workers || 0}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Administradores</span>
                  <span className="text-sm font-medium">{statistics.users.total_admin_workers || 0}</span>
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
    </>
  );
};

export default StatisticsCards; 