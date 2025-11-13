import React, { useState, useEffect } from "react";
// import Navbar from "../navbar/navbar"; // Navbar is already global in AppRoutes
import useMediaQuery from "@/hooks/useMediaQuery";
import { User, getAllWorkers, updateUserAsAdmin, deleteUsers, cleanupWorkersFromActors } from "@/api/userService";
// import { useNavigate } from "react-router-dom"; // Only if used for OTHER purposes now
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from '@/components/LoadingSpinner';
// Potentially import useAuth if you need userProfile details for display/logic later
// import { useAuth } from "@/contexts/auth/AuthContext";

interface WorkerListItem extends User {
  selected: boolean;
}

const ManageWorkers: React.FC = () => {
  // const navigate = useNavigate(); // Remove if only used for the deleted auth check
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [workers, setWorkers] = useState<WorkerListItem[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<WorkerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingWorker, setEditingWorker] = useState<WorkerListItem | null>(null);
  const [editedWorkerData, setEditedWorkerData] = useState<Partial<User>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWorkersToDelete, setSelectedWorkersToDelete] = useState<WorkerListItem[]>([]);

  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // The localStorage check and navigation has been REMOVED.
    // ProtectedRoutes.tsx handles route protection.
    fetchWorkers();
  }, []); // Removed navigate from dependencies if it's no longer used

  useEffect(() => {
    if (workers.length > 0) {
      filterWorkers();
    }
  }, [searchTerm, workers]);

  const fetchWorkers = async () => {
    try {
      // First, run a cleanup to ensure workers aren't incorrectly in the actors table
      try {
        const cleanupResult = await cleanupWorkersFromActors();
        if (cleanupResult.success && cleanupResult.workersRemoved > 0) {
          console.log(`[ManageWorkers] Fixed data issue: Removed ${cleanupResult.workersRemoved} worker(s) from actors table`);
          toast.info(`Se resolvió un problema de datos: ${cleanupResult.workersRemoved} trabajador(es) se reclasificaron correctamente.`);
        }
      } catch (cleanupError) {
        console.error("[ManageWorkers] Error cleaning up workers data:", cleanupError);
        // Continue with fetching workers even if cleanup fails
      }

      const workersData = await getAllWorkers();
      // Filter out administrators
      const filteredWorkersData = workersData.filter(worker => !worker.is_admin);
      
      const workersWithSelection = filteredWorkersData.map(worker => ({
        ...worker,
        selected: false
      }));
      setWorkers(workersWithSelection);
      setFilteredWorkers(workersWithSelection);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching workers:", error);
      setError("Error al cargar la lista de trabajadores");
      setLoading(false);
    }
  };

  const filterWorkers = () => {
    let filtered = [...workers];

    // Filter by search term (name or ID)
    if (searchTerm) {
      filtered = filtered.filter(
        worker => 
          (worker.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (worker.cedula ? worker.cedula.toString() : '').includes(searchTerm)
      );
    }

    setFilteredWorkers(filtered);
  };

  const handleSelectWorker = (workerId: string) => {
    setWorkers(prevWorkers =>
      prevWorkers.map(worker =>
        worker.id === workerId ? { ...worker, selected: !worker.selected } : worker
      )
    );
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setWorkers(prevWorkers =>
      prevWorkers.map(worker => ({
        ...worker,
        selected: newSelectAll
      }))
    );
  };

  const handleEditWorker = (worker: WorkerListItem) => {
    setEditingWorker(worker);
    setEditedWorkerData({
      nombre: worker.nombre,
      cedula: worker.cedula,
      email: worker.email,
      phone_number: worker.phone_number
    });
  };

  const handleCancelEdit = () => {
    setEditingWorker(null);
    setEditedWorkerData({});
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedWorkerData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Name validation
    if (!editedWorkerData.nombre || editedWorkerData.nombre.trim() === "") {
      errors.nombre = "El nombre es requerido";
    } else if (!/^[a-zA-Z ]+$/.test(editedWorkerData.nombre)) {
      errors.nombre = "El nombre solo debe contener letras";
    }
    
    // Cedula validation
    if (!editedWorkerData.cedula) {
      errors.cedula = "La cédula es requerida";
    } else if (!/^\d{7,10}$/.test(editedWorkerData.cedula.toString())) {
      errors.cedula = "La cédula debe tener entre 7 y 10 dígitos";
    }
    
    // Email validation
    if (editedWorkerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedWorkerData.email)) {
      errors.email = "Correo electrónico inválido";
    }
    
    // Phone validation
    if (editedWorkerData.phone_number && !/^\d{10,15}$/.test(editedWorkerData.phone_number.toString())) {
      errors.phone_number = "El teléfono debe tener entre 10 y 15 dígitos";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveWorker = async () => {
    if (!validateForm()) { 
      return;
    }
    
    try {
      if (editingWorker) {
        // Update basic profile data using admin function to bypass RLS
        await updateUserAsAdmin(editingWorker.id, editedWorkerData);

        // Update local state
        setWorkers(prevWorkers =>
          prevWorkers.map(worker =>
            worker.id === editingWorker.id
              ? { ...worker, ...editedWorkerData, selected: worker.selected }
              : worker
          )
        );
        setEditingWorker(null);
        setEditedWorkerData({});
        setFormErrors({});
        
        toast.success("Datos del trabajador actualizados correctamente.");
      }
    } catch (error) {
      console.error("Error updating worker profile data:", error);
      
      // Provide more specific error messages
      let errorMessage = "Error al actualizar datos del trabajador";
      if (error instanceof Error) {
        if (error.message.includes("no encontrado")) {
          errorMessage = "El trabajador no fue encontrado en la base de datos. Por favor, recarga la página.";
        } else if (error.message.includes("duplicate key")) {
          errorMessage = "Ya existe un usuario con esa cédula o email.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const confirmDeleteWorkers = () => {
    const selectedWorkers = workers.filter(worker => worker.selected);
    if (selectedWorkers.length === 0) {
      toast.error("No hay trabajadores seleccionados para eliminar");
      return;
    }

    setSelectedWorkersToDelete(selectedWorkers);
    setShowDeleteModal(true);
  };

  const handleDeleteWorkers = async () => {
    if (selectedWorkersToDelete.length === 0) return;
    
    try {
      setLoading(true);
      const workerIds = selectedWorkersToDelete.map(worker => worker.id);
      
      // Call the deleteUsers function with the selected user IDs
      const result = await deleteUsers(workerIds);
      
      if (result && result.success) {
        toast.success(`${result.deletedCount} trabajador(es) eliminado(s) correctamente`);
        
        // Update UI by removing the deleted workers
        setWorkers(prevWorkers => prevWorkers.filter(worker => !workerIds.includes(worker.id)));
        setFilteredWorkers(prevFilteredWorkers => prevFilteredWorkers.filter(worker => !workerIds.includes(worker.id)));
        
        // Reset selection status
        setSelectAll(false);
      } else {
        toast.error("No se pudieron eliminar algunos trabajadores");
      }
    } catch (error) {
      console.error("Error deleting workers:", error);
      let errorMessage = "Error al eliminar trabajadores";
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setSelectedWorkersToDelete([]);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedWorkersToDelete([]);
  };

  // Button styles
  const baseButtonStyles =
    "py-2 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const primaryButtonClasses = `${baseButtonStyles} bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500`;
  const secondaryButtonClasses = `${baseButtonStyles} bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-100 focus:ring-indigo-500`;
  const dangerButtonClasses = `${baseButtonStyles} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
  const editButtonClasses = `px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`;

  if (loading) {
    return <LoadingSpinner message="Cargando trabajadores..." />;
  }

  if (error && !editingWorker) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchWorkers();
            }}
            className={primaryButtonClasses}
          >
            Reintentar
          </button>
          <button
            onClick={() => setError(null)}
            className={secondaryButtonClasses}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Editing view
  if (editingWorker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
          <div
            className={`w-full ${
              isMobile ? "max-w-lg" : "max-w-xl"
            } bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 md:p-10`}
          >
            <h2 className="font-bold text-2xl sm:text-3xl text-center mb-8 sm:mb-10 text-neutral-800">
              Editar Trabajador
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-5 sm:space-y-6 mb-8 sm:mb-10">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1">
                  Nombre:
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={editedWorkerData.nombre || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {formErrors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
                )}
              </div>

              {/* Cédula */}
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1">
                  Cédula:
                </label>
                <input
                  type="number"
                  name="cedula"
                  value={editedWorkerData.cedula || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {formErrors.cedula && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.cedula}</p>
                )}
              </div>

              {/* Correo */}
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1">
                  Correo Electrónico:
                </label>
                <input
                  type="email"
                  name="email"
                  value={editedWorkerData.email || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1">
                  Teléfono:
                </label>
                <input
                  type="text"
                  name="phone_number"
                  value={editedWorkerData.phone_number || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {formErrors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phone_number}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6 sm:mt-8">
              <button
                type="button"
                onClick={handleCancelEdit}
                className={secondaryButtonClasses}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveWorker}
                className={primaryButtonClasses}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Worker list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <main className="py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Gestión de Trabajadores
          </h1>
          
          <ToastContainer position="top-right" autoClose={3000} />

          {/* Filters and controls */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              {/* Search */}
              <div className="w-full md:w-1/2">
                <input
                  type="text"
                  placeholder="Buscar por nombre o cédula"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <button
                  onClick={() => {
                    setLoading(true);
                    fetchWorkers();
                  }}
                  className={`${secondaryButtonClasses} w-full sm:w-auto`}
                >
                  Actualizar Lista
                </button>
                <button
                  onClick={confirmDeleteWorkers}
                  className={`${dangerButtonClasses} w-full sm:w-auto`}
                >
                  Eliminar Seleccionados
                </button>
              </div>
            </div>
          </div>

          {/* Worker list table */}
          <div className="bg-white overflow-hidden shadow-md rounded-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cédula
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWorkers.length > 0 ? (
                    filteredWorkers.map(worker => (
                      <tr key={worker.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={worker.selected}
                            onChange={() => handleSelectWorker(worker.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{worker.nombre}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{worker.cedula}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{worker.email || "No disponible"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{worker.phone_number || "No disponible"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditWorker(worker)}
                            className={editButtonClasses}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                        No se encontraron trabajadores
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

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
                ¿Está seguro de eliminar {selectedWorkersToDelete.length} trabajador(es)? Esta acción no se puede deshacer.
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
                  onClick={handleDeleteWorkers}
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
  );
};

export default ManageWorkers; 