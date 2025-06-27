import React from 'react';
import { SystemStatistics, PointDetail } from '@/api/accessPointService';

interface AccessPointTableProps {
  statistics: SystemStatistics;
}

const AccessPointTable: React.FC<AccessPointTableProps> = ({ statistics }) => {
  // Early return if no data
  if (!statistics.access_points.points_detail || statistics.access_points.points_detail.length === 0) {
    return null;
  }

  return (
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
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    point.is_priority ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
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
  );
};

export default AccessPointTable; 