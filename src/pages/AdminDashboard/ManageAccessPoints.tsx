import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // Only if used for the deleted auth check
// import Navbar from '../navbar/navbar'; // Navbar is already global
import { 
  getAllAccessPoints, 
  createAccessPoint, 
  assignWorkerToAccessPoint,
  deleteAccessPoint,
  AccessPoint
} from '@/api/accessPointService';
import { getAllWorkers } from '@/api/userService';
import { WorkerProfile as BaseWorkerProfile } from '@/api/types';
import { useAuth } from '@/contexts/auth/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Extended WorkerProfile with assignment status
interface WorkerProfile extends BaseWorkerProfile {
  assigned?: boolean;
  assigned_to_point_id?: number | null;
}

const ManageAccessPoints: React.FC = () => {
  // const navigate = useNavigate(); // Removed
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccessPoint, setSelectedAccessPoint] = useState<AccessPoint | null>(null);
  
  // Estado para el formulario de creación
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccessPoint, setNewAccessPoint] = useState({
    is_priority: false,
    horario_apertura: '',
    horario_cierre: ''
  });
  
  // Estado para el formulario de asignación
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  
  // Estado para confirmación de reasignación
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [workerCurrentAssignment, setWorkerCurrentAssignment] = useState<AccessPoint | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accessPointToDelete, setAccessPointToDelete] = useState<number | null>(null);

  const auth = useAuth();

  useEffect(() => {
    // The localStorage check and navigation has been REMOVED.
    // ProtectedRoutes.tsx handles route protection.
    fetchData();
  }, []); // Removed navigate from dependencies

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accessPointsData, workersData] = await Promise.all([
        getAllAccessPoints(),
        getAllWorkers()
      ]);
      
      // Filter workers: exclude those who are admins and the current logged-in admin user
      const loggedInUserId = auth.user?.id;
      const assignableWorkers = workersData.filter(worker => 
        !worker.is_admin && worker.id !== loggedInUserId
      );
      
      // Add assignment status to workers array to show if they're already assigned
      const workersWithAssignmentStatus = assignableWorkers.map(worker => {
        // Check if this worker is already assigned to an access point
        const assignedToPoint = accessPointsData.find(point => 
          point.worker_id === worker.id
        );
        
        return {
          ...worker,
          // Add assigned status for UI display
          assigned: !!assignedToPoint,
          assigned_to_point_id: assignedToPoint ? assignedToPoint.id : null
        };
      });
      
      setWorkers(workersWithAssignmentStatus);
      
      // Process the access points data for consistency
      const processedAccessPoints = accessPointsData.map(point => {
        console.log('Processing access point:', point);
        return {
          ...point,
          // Ensure worker is correctly formatted for the UI
          worker: point.worker_id
        };
      });
      
      setAccessPoints(processedAccessPoints);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccessPoint = (point: AccessPoint) => {
    setSelectedAccessPoint(point);
    setSelectedWorkerId(point.worker_id?.toString() || '');
    setShowAssignForm(true);
    setShowCreateForm(false);
    
    // Log selection to help debug
    console.log('Selected access point:', point);
    console.log('Setting selected worker ID to:', point.worker_id?.toString() || '');
  };

  const handleCreateAccessPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        is_priority: newAccessPoint.is_priority,
        horario_apertura: newAccessPoint.horario_apertura || undefined,
        horario_cierre: newAccessPoint.horario_cierre || undefined
      };
      
      await createAccessPoint(data);
      await fetchData();
      
      // Limpiar el formulario y cerrar
      setNewAccessPoint({
        is_priority: false,
        horario_apertura: '',
        horario_cierre: ''
      });
      setShowCreateForm(false);
      
      toast.success('Punto de acceso creado correctamente');
    } catch (err) {
      console.error('Error creating access point:', err);
      toast.error('Error al crear el punto de acceso');
    }
  };

  const checkWorkerAssignment = (workerId: string): AccessPoint | null => {
    // If empty, no need to check
    if (!workerId) return null;
    
    // Find if this worker is already assigned to an access point
    const existingAssignment = accessPoints.find(point => {
      // Check if worker_id exists and is not null
      if (point.worker_id !== undefined && point.worker_id !== null) {
        return point.worker_id.toString() === workerId && 
          // Don't count current access point as an existing assignment
          (selectedAccessPoint ? point.id !== selectedAccessPoint.id : true);
      }
      return false;
    });
    
    return existingAssignment || null;
  };

  const handleAssignWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccessPoint) {
      toast.error('Seleccione un punto de acceso');
      return;
    }
    
    // If removing worker assignment, proceed immediately
    if (!selectedWorkerId || selectedWorkerId === "") {
      proceedWithAssignment();
      return;
    }
    
    // Check if worker is already assigned to another access point
    const existingAssignment = checkWorkerAssignment(selectedWorkerId);
    
    if (existingAssignment) {
      // Worker is already assigned elsewhere, show confirmation modal
      setWorkerCurrentAssignment(existingAssignment);
      setShowReassignModal(true);
    } else {
      // Worker is not assigned elsewhere, proceed with assignment
      proceedWithAssignment();
    }
  };

  const proceedWithAssignment = async () => {
    if (!selectedAccessPoint) return;
    
    try {
      console.log(`Intentando asignar trabajador ${selectedWorkerId || 'null'} al punto de acceso ${selectedAccessPoint.id}`);
      await assignWorkerToAccessPoint(selectedAccessPoint.id, selectedWorkerId);
      
      // If this was a reassignment, update the previous access point too
      if (workerCurrentAssignment) {
        // Clear the worker from their previous assignment
        console.log(`Limpiando asignación previa del trabajador en punto de acceso ${workerCurrentAssignment.id}`);
        await assignWorkerToAccessPoint(workerCurrentAssignment.id, "");
        setWorkerCurrentAssignment(null);
      }
      
      await fetchData();
      setShowAssignForm(false);
      setShowReassignModal(false);
      
      if (!selectedWorkerId || selectedWorkerId === "") {
        toast.success('Trabajador desasignado correctamente');
      } else {
      toast.success('Trabajador asignado correctamente');
      }
    } catch (err) {
      console.error('Error assigning worker:', err);
      toast.error('Error al asignar el trabajador. Por favor, inténtelo de nuevo.');
    }
  };

  const cancelReassignment = () => {
    setShowReassignModal(false);
    setWorkerCurrentAssignment(null);
  };

  const getWorkerName = (workerId: number | string | null | undefined) => { // Accept string or number for worker ID
    if (!workerId) return 'Sin asignar';
    
    console.log('Looking for worker with ID:', workerId);
    console.log('Available workers:', workers);
    
    // Find the worker by ID
    const worker = workers.find(w => w.id.toString() === workerId.toString());
    
    if (worker) {
      console.log('Found worker:', worker);
      return worker.nombre;
    } else {
      console.log('Worker not found for ID:', workerId);
      return 'Desconocido';
    }
  };

  const handleDeleteAccessPoint = (id: number) => {
    setAccessPointToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (!accessPointToDelete) return;
    
    try {
      await deleteAccessPoint(accessPointToDelete);
      await fetchData();
      setError(null);
      toast.success('Punto de acceso eliminado correctamente');
    } catch (err) {
      console.error('Error deleting access point:', err);
      setError('Error al eliminar el punto de acceso');
    } finally {
      setShowDeleteModal(false);
      setAccessPointToDelete(null);
    }
  };
  
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setAccessPointToDelete(null);
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <p className="text-gray-600 text-lg">Cargando datos...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Puntos de Acceso
            </h1>
            <div>
              <button 
                onClick={() => { setShowCreateForm(true); setShowAssignForm(false); setSelectedAccessPoint(null); }}
                className="py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 mr-2"
              >
                Crear Punto de Acceso
              </button>
            </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de puntos de acceso */}
            <div className="lg:col-span-1">
              <div className="bg-white overflow-hidden shadow-md rounded-xl h-full">
                <h2 className="text-xl font-semibold text-gray-800 p-6 border-b">
                  Puntos de Acceso
                </h2>
                {accessPoints.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No hay puntos de acceso disponibles
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {accessPoints.map(point => (
                      <li 
                        key={point.id} 
                        className={`p-4 hover:bg-gray-50 ${selectedAccessPoint?.id === point.id ? 'bg-indigo-50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="cursor-pointer" onClick={() => handleSelectAccessPoint(point)}>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              point.is_priority ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            } mb-1`}>
                              {point.is_priority ? 'Prioritario' : 'Normal'}
                            </span>
                            <div className="flex flex-col">
                              <h3 className="text-sm font-medium text-gray-900">
                                Punto #{point.id}
                              </h3>
                              <p className="text-xs text-gray-500">
                                Trabajador: {getWorkerName(point.worker_id)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              point.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 
                              point.estado === 'PAUSADO' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'
                            } mr-2`}>
                              {point.estado_display || point.estado}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAccessPoint(point.id);
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar punto de acceso"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Formularios */}
            <div className="lg:col-span-2">
              {/* Formulario de Creación */}
              {showCreateForm && (
                <div className="bg-white shadow-md rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Crear Punto de Acceso
                  </h2>
                  <form onSubmit={handleCreateAccessPoint}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Punto
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_priority"
                          checked={newAccessPoint.is_priority}
                          onChange={(e) => setNewAccessPoint({
                            ...newAccessPoint,
                            is_priority: e.target.checked
                          })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_priority" className="ml-2 block text-sm text-gray-900">
                          Punto Prioritario
                        </label>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horario de Apertura (opcional)
                      </label>
                      <input
                        type="time"
                        value={newAccessPoint.horario_apertura}
                        onChange={(e) => setNewAccessPoint({
                          ...newAccessPoint,
                          horario_apertura: e.target.value
                        })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horario de Cierre (opcional)
                      </label>
                      <input
                        type="time"
                        value={newAccessPoint.horario_cierre}
                        onChange={(e) => setNewAccessPoint({
                          ...newAccessPoint,
                          horario_cierre: e.target.value
                        })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Crear
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Formulario para Asignar Trabajador */}
              {showAssignForm && selectedAccessPoint && (
                <div className="bg-white shadow-md rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Asignar Trabajador a Punto #{selectedAccessPoint.id}
                  </h2>
                  <form onSubmit={handleAssignWorker}>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trabajador
                      </label>
                      <select
                        value={selectedWorkerId}
                        onChange={(e) => {
                          console.log('Selected worker changed to:', e.target.value);
                          setSelectedWorkerId(String(e.target.value));
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Sin asignar</option>
                        {workers.map(worker => {
                          const isAssigned = worker.assigned && worker.assigned_to_point_id !== selectedAccessPoint.id;
                          return (
                            <option 
                              key={worker.id} 
                              value={worker.id}
                              // Add disabled attribute if worker is already assigned elsewhere
                              disabled={isAssigned}
                            >
                            {worker.nombre} ({worker.email})
                              {isAssigned ? ` - Asignado al Punto #${worker.assigned_to_point_id}` : ''}
                          </option>
                          );
                        })}
                      </select>
                      {/* Debug info */}
                      <div className="mt-1 text-xs text-gray-400">
                        ID seleccionado: {selectedWorkerId || 'ninguno'}
                      </div>
                      <p className="mt-2 text-sm text-amber-600">
                        Nota: Un trabajador solo puede estar asignado a un punto de acceso a la vez.
                      </p>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowAssignForm(false)}
                        className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Asignar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Mensaje de ayuda cuando no hay nada seleccionado */}
              {!showCreateForm && !showAssignForm && (
                <div className="bg-white shadow-md rounded-xl p-6 flex flex-col items-center justify-center h-full">
                  <p className="text-gray-500 text-lg mb-4">Seleccione un punto de acceso para asignar un trabajador o cree uno nuevo</p>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reassignment Confirmation Modal */}
        {showReassignModal && workerCurrentAssignment && (
          <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={cancelReassignment}></div>
            
            <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6 shadow-xl transform transition-all">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">Trabajador ya asignado</h3>
                
                <p className="text-sm text-gray-500 mb-6">
                  El trabajador seleccionado ya está asignado al Punto #{workerCurrentAssignment.id}.
                  ¿Desea reasignar este trabajador al Punto #{selectedAccessPoint?.id}?
                  <br /><br />
                  <span className="font-medium">Nota:</span> El Punto #{workerCurrentAssignment.id} quedará sin trabajador asignado.
                </p>
                
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={cancelReassignment}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={proceedWithAssignment}
                    className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Reasignar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-10 transition-opacity" onClick={closeDeleteModal}></div>
            
            <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6 shadow-xl transform transition-all">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">Confirmar eliminación</h3>
                
                <p className="text-sm text-gray-500 mb-6">
                  ¿Está seguro que desea eliminar este punto de acceso? Esta acción cerrará el punto de acceso y no se puede deshacer.
                </p>
                
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    No, cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 border border-transparent rounded-md font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Sí, eliminar
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

export default ManageAccessPoints; 