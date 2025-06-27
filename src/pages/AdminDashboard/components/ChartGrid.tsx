import React, { useMemo } from 'react';
import { SystemStatistics } from '@/api/accessPointService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, TooltipProps, PieChart, Pie
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

interface ChartGridProps {
  statistics: SystemStatistics;
}

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

const ChartGrid: React.FC<ChartGridProps> = ({ statistics }) => {
  // Data transformations for charts - improved to handle edge cases
  const usersChartData = useMemo(() => {
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
  }, [statistics?.users]);

  const ticketsBreakdownChartData = useMemo(() => {
    if (!statistics?.tickets) return [];
    
    const priorityTickets = statistics.tickets.total_priority || 0;
    const normalTickets = statistics.tickets.total_normal || 0;
    
    return [
      { name: 'Prioritarios', value: priorityTickets, color: COLORS.red },
      { name: 'Normales', value: normalTickets, color: COLORS.green }
    ];
  }, [statistics?.tickets]);

  const accessPointsChartData = useMemo(() => {
    if (!statistics?.access_points) return [];
    
    return [
      { name: 'Total', value: statistics.access_points.total || 0, color: COLORS.indigo },
      { name: 'Activos', value: statistics.access_points.active || 0, color: COLORS.green },
      { name: 'Pausados', value: statistics.access_points.paused || 0, color: COLORS.yellow },
      { name: 'Prioritarios', value: statistics.access_points.priority || 0, color: COLORS.red }
    ];
  }, [statistics?.access_points]);

  const ticketStatusData = useMemo(() => {
    if (!statistics?.tickets) return [];
    
    const pending = statistics.tickets.pending || 0;
    const attended = statistics.tickets.attended || 0;
    
    return [
      { name: 'Pendientes', value: pending, color: COLORS.yellow },
      { name: 'Atendidos', value: attended, color: COLORS.green }
    ];
  }, [statistics?.tickets]);

  return (
    <>
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
                  data={usersChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {usersChartData.map((entry, index) => (
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
                data={ticketStatusData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" name="Cantidad">
                  {ticketStatusData.map((entry, index) => (
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
                  data={ticketsBreakdownChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {ticketsBreakdownChartData.map((entry, index) => (
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
                data={accessPointsChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" name="Cantidad">
                  {accessPointsChartData.map((entry, index) => (
                    <Cell key={`cell-ap-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChartGrid; 