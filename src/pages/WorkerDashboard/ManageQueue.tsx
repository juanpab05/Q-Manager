import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllAccessPoints, 
  getWorkerAccessPoints,
  initializeAccessPoint, 
  nextTicket, 
  togglePauseAccessPoint,
  getCurrentTicket,
  verifyDatabaseSchema,
  AccessPoint,
  Ticket,
  attendTicket
} from '@/api/accessPointService';
import { useAuth } from '@/contexts/auth/AuthContext';

const ManageQueue: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<AccessPoint | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [userData, setUserData] = useState<{id: string, role: string, is_admin: boolean} | null>(null);

  useEffect(() => {
    // Utilizar el contexto de autenticación si está disponible, de lo contrario usar localStorage
    if (auth && auth.user) {
      setUserData({
        id: auth.user.id,
        role: auth.user.user_metadata?.role || 'worker',
        is_admin: auth.user.user_metadata?.is_admin || false
      });
    } else {
      // Fallback a localStorage si no hay contexto de auth
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== "worker") {
        navigate("/home-user", { replace: true });
        return;
      }
      setUserData(parsedUser);
    } else {
      navigate("/login", { replace: true });
      return;
    }
    }
  }, [navigate, auth]);
  
  // Verify and fix database schema on component mount
  useEffect(() => {
    const verifySchema = async () => {
      await verifyDatabaseSchema();
    };
    
    verifySchema();
  }, []);
  
  // Separate useEffect to fetch access points once userData is available
  useEffect(() => {
    if (userData) {
      fetchAccessPoints();
    }
  }, [userData]);

  // Fetch current ticket when a point is selected
  useEffect(() => {
    if (selectedPoint) {
      fetchCurrentTicket();
    }
  }, [selectedPoint]);

  const fetchCurrentTicket = async () => {
    if (!selectedPoint) return;
    
    try {
      const ticket = await getCurrentTicket(selectedPoint.id);
      setCurrentTicket(ticket);
    } catch (err) {
      console.error('Error fetching current ticket:', err);
      // Don't show error to avoid confusion, just keep currentTicket as null
    }
  };

  const fetchAccessPoints = async () => {
    try {
      setLoading(true);
      
      // Si el usuario es un administrador, obtener todos los puntos de acceso
      // Si es un trabajador regular, obtener solo sus puntos asignados
      let data: AccessPoint[] = [];
      
      if (userData) {
        if (userData.is_admin) {
          data = await getAllAccessPoints();
        } else {
          data = await getWorkerAccessPoints(userData.id);
        }
      }
      
      setAccessPoints(data);
      
      // Si solo hay un punto de acceso asignado, seleccionarlo automáticamente
      if (data.length === 1 && !userData?.is_admin) {
        setSelectedPoint(data[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching access points:', err);
      setError('Error al cargar los puntos de acceso');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccessPoint = async (point: AccessPoint) => {
    setSelectedPoint(point);
    setMessage(null);
    
    // No clear current ticket immediately to avoid flashing
    // The useEffect will fetch the current ticket
  };

  const handleInitialize = async () => {
    if (!selectedPoint || !userData) return;
    
    try {
      const response = await initializeAccessPoint(selectedPoint.id, userData.id);
      
      // Actualizar la lista de puntos de acceso
      await fetchAccessPoints();
      
      // Actualizar el punto seleccionado
      setSelectedPoint(response);
      setMessage("Punto de acceso inicializado correctamente");
      
      // Clear current ticket when initializing
      setCurrentTicket(null);
    } catch (err) {
      console.error('Error initializing access point:', err);
      setError('Error al inicializar el punto de acceso');
    }
  };

  const handleNextTicket = async () => {
    if (!selectedPoint) return;
    
    try {
      // First, mark the current ticket as attended if there is one
      if (currentTicket) {
        try {
          // Import attendTicket from accessPointService if needed at the top of the file
          await attendTicket(currentTicket.id, selectedPoint.id);
          console.log(`[ManageQueue] Marked ticket ${currentTicket.ticket_number} as attended`);
        } catch (attendError) {
          console.error('Error marking ticket as attended:', attendError);
          // Continue with next ticket even if this fails
        }
      }
      
      const response = await nextTicket(selectedPoint.id);
      
      // Check if response is the object with ticket and message structure
      if (response && typeof response === 'object' && 'ticket' in response) {
        // Response is of type { ticket: Ticket, message: string }
      if (response.ticket) {
        setCurrentTicket(response.ticket);
        } else {
          setCurrentTicket(null);
        }
        setMessage(response.message);
      } else if (response) {
        // Response is a direct Ticket object (for backward compatibility)
        setCurrentTicket(response);
        setMessage('Ticket asignado para atención');
      } else {
        // Response is null or undefined
        setCurrentTicket(null);
        setMessage('No hay tickets pendientes en la cola');
      }
      
      // Actualizar el punto de acceso después de llamar al siguiente ticket
      await fetchAccessPoints();
      const updatedPoint = accessPoints.find(p => p.id === selectedPoint.id);
      if (updatedPoint) {
        setSelectedPoint(updatedPoint);
      }
      
    } catch (err: any) {
      console.error('Error getting next ticket:', err);
      setError('Error al obtener el siguiente ticket');
      
      // Si el error indica que no hay tickets pendientes, actualizar la UI
      if (err.message && err.message.includes('No hay tickets pendientes')) {
        setCurrentTicket(null);
        setMessage('No hay tickets pendientes en la cola');
      }
    }
  };

  const handleTogglePause = async () => {
    if (!selectedPoint) return;
    
    try {
      const response = await togglePauseAccessPoint(selectedPoint.id);
      setSelectedPoint(response);
      setMessage(response.estado === 'ACTIVO' ? 'Punto de acceso reactivado' : 'Punto de acceso pausado');
      
      // Actualizar la lista de puntos de acceso
      await fetchAccessPoints();
    } catch (err) {
      console.error('Error toggling pause:', err);
      setError('Error al pausar/reanudar el punto de acceso');
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <p className="text-gray-600 text-lg">Cargando puntos de acceso...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Gestión de Filas
          </h1>

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

          {message && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
              <button 
                className="ml-4 underline"
                onClick={() => setMessage(null)}
              >
                Cerrar
              </button>
            </div>
          )}

          {accessPoints.length === 0 ? (
            <div className="p-8 bg-white rounded-xl shadow-md text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">No tienes puntos de acceso asignados</h2>
              <p className="text-gray-600">
                Contacta con un administrador para que te asigne un punto de acceso.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Lista de puntos de acceso */}
              <div className="lg:col-span-1">
                <div className="bg-white overflow-hidden shadow-md rounded-xl">
                  <h2 className="text-xl font-semibold text-gray-800 p-6 border-b">
                    {userData?.is_admin ? 'Todos los Puntos de Acceso' : 'Mis Puntos de Acceso'}
                  </h2>
                  <ul className="divide-y divide-gray-200">
                    {accessPoints.map(point => (
                      <li 
                        key={point.id} 
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedPoint?.id === point.id ? 'bg-indigo-50' : ''}`}
                        onClick={() => handleSelectAccessPoint(point)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              point.is_priority ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            } mb-1`}>
                              {point.is_priority ? 'Prioritario' : 'Normal'}
                            </span>
                            <div className="flex items-center">
                              <h3 className="text-sm font-medium text-gray-900">
                                Punto #{point.id}
                              </h3>
                              <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                point.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 
                                point.estado === 'PAUSADO' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {point.estado_display || point.estado}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {point.tickets_atendidos || 0} atendidos
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Panel de control del punto seleccionado */}
              <div className="lg:col-span-2">
                {selectedPoint ? (
                  <div className="bg-white overflow-hidden shadow-md rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                          Punto de Acceso #{selectedPoint.id}
                        </h2>
                        <div className="flex items-center mt-2">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            selectedPoint.is_priority ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          } mr-2`}>
                            {selectedPoint.is_priority ? 'Prioritario' : 'Normal'}
                          </span>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            selectedPoint.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 
                            selectedPoint.estado === 'PAUSADO' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedPoint.estado_display || selectedPoint.estado}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Atendidos</p>
                        <p className="text-xl font-semibold">{selectedPoint.tickets_atendidos || 0}</p>
                      </div>
                    </div>

                    {/* Información del ticket actual */}
                    {selectedPoint.estado === 'CERRADO' ? (
                      <div className="p-6 bg-gray-50 rounded-lg text-center mb-6">
                        <p className="text-gray-500">El punto de acceso está cerrado.</p>
                        <p className="text-gray-500">Debe inicializarlo para comenzar a atender tickets.</p>
                      </div>
                    ) : currentTicket ? (
                      <div className="p-6 bg-indigo-50 rounded-lg mb-6">
                        <h3 className="text-lg font-medium text-indigo-800 mb-4 flex justify-between items-center">
                          <span>Ticket Actual: <span className="font-bold">{currentTicket.ticket_number}</span></span>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            currentTicket.is_priority ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {currentTicket.is_priority ? 'Prioritario' : 'Normal'}
                          </span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Cliente:</p>
                            <p className="font-medium">{currentTicket.user?.nombre || 'No especificado'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Servicio:</p>
                            <p className="font-medium">{currentTicket.service}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Modalidad:</p>
                            <p className="font-medium">{currentTicket.modality || 'No especificada'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Prioridad:</p>
                            <p className="font-medium">{currentTicket.is_priority ? 'Prioritario' : 'Normal'}</p>
                          </div>
                        </div>
                      </div>
                    ) : (selectedPoint.estado !== 'CERRADO' && (
                      <div className="p-6 bg-yellow-50 rounded-lg text-center mb-6">
                        <p className="text-yellow-700">No hay un ticket siendo atendido actualmente.</p>
                        <p className="text-yellow-700">Presione "Siguiente Ticket" para comenzar a atender.</p>
                      </div>
                    ))}

                    {/* Botones de acción */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedPoint.estado === 'CERRADO' ? (
                        <button
                          onClick={handleInitialize}
                          className="py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 col-span-full"
                        >
                          Inicializar Punto de Acceso
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleNextTicket}
                            disabled={selectedPoint.estado !== 'ACTIVO'}
                            className={`py-3 px-4 bg-indigo-600 text-white rounded-lg ${
                              selectedPoint.estado === 'ACTIVO' ? 'hover:bg-indigo-700' : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            Siguiente Ticket
                          </button>
                          <button
                            onClick={handleTogglePause}
                            className={`py-3 px-4 rounded-lg text-white ${
                              selectedPoint.estado === 'ACTIVO' 
                                ? 'bg-yellow-500 hover:bg-yellow-600' 
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {selectedPoint.estado === 'ACTIVO' ? 'Pausar' : 'Reanudar'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white shadow-md rounded-xl p-8 text-center">
                    <p className="text-gray-600 text-lg">
                      Selecciona un punto de acceso para comenzar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ManageQueue; 