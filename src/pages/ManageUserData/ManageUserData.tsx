import React, { useState, useEffect, useRef } from "react";
import useMediaQuery from "@/hooks/useMediaQuery";
import { 
  UserProfile, 
  User, 
  Actor, 
  getActors, 
  updateUser, 
  deleteUsers, 
  syncMissingUsersToActors,
  updateActorProfileRpc,
  cleanupWorkersFromActors
} from "@/api/userService";
import supabase from '@/utils/supabaseClient';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserListItem extends UserProfile {
  selected: boolean;
}

const ManageUserData: React.FC = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [editedUserData, setEditedUserData] = useState<Partial<UserProfile>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUsersToDelete, setSelectedUsersToDelete] = useState<UserListItem[]>([]);
  // Referencia para saber si el componente está montado
  const isMounted = useRef(true);

  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Configurar la referencia de montado
    isMounted.current = true;
    
    // Cargar usuarios inmediatamente
    fetchUsers();
    
    // Limpiar al desmontar
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      filterUsers();
    }
  }, [searchTerm, priorityFilter, users]);

  const fetchUsers = async () => {
    // Si el componente no está montado, no hacer nada
    if (!isMounted.current) return;
    
    try {
      setLoading(true);
      // First, ensure data integrity by running the cleanup function
      try {
        const cleanupResult = await cleanupWorkersFromActors();
        if (cleanupResult.success && cleanupResult.workersRemoved > 0) {
          console.log(`[ManageUserData] Fixed data issue: Removed ${cleanupResult.workersRemoved} worker(s) from actors table`);
          toast.info(`Se encontraron y corrigieron ${cleanupResult.workersRemoved} registros duplicados.`);
        }
      } catch (cleanupError) {
        console.error("[ManageUserData] Error cleaning up actor data:", cleanupError);
        // Continue with data fetching even if cleanup fails
      }

      console.log("[ManageUserData] Fetching users data...");
      const actorsData = await getActors();
      
      // Verificar si el componente sigue montado después de la operación asíncrona
      if (!isMounted.current) return;
      
      if (!actorsData || !Array.isArray(actorsData)) {
        // Ensure actorsData is an array even if empty
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        toast.warn('No se encontraron actores o el formato es incorrecto.');
        return; // Return early
      }
      
      // Verifica si hay duplicados
      const userIds = actorsData.map(actor => actor.id);
      const uniqueUserIds = [...new Set(userIds)];
      if (userIds.length !== uniqueUserIds.length) {
        console.log(`[ManageUserData] Detectados ${userIds.length - uniqueUserIds.length} registros duplicados (IDs de actores) de ${userIds.length} registros totales`);
      } else {
        console.log(`[ManageUserData] No se detectaron duplicados. ${userIds.length} usuarios cargados.`);
      }
      
      const usersWithSelection = actorsData.map(actor => ({
        ...actor,
        selected: false
      }));
      
      // Verificar nuevamente si el componente sigue montado
      if (!isMounted.current) return;
      
      setUsers(usersWithSelection);
      setFilteredUsers(usersWithSelection);
      console.log("[ManageUserData] Users data loaded successfully:", usersWithSelection.length, "users");
    } catch (error) {
      console.error("[ManageUserData] Error fetching users:", error);
      // Verificar si el componente sigue montado antes de actualizar el estado
      if (!isMounted.current) return;
      
      toast.error("Error al cargar la lista de usuarios (actores).");
      setError(`Error al cargar la lista de usuarios (actores): ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      // Verificar si el componente sigue montado antes de actualizar el estado
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search term (name or ID/cedula)
    if (searchTerm) {
      filtered = filtered.filter(
        user => 
          (user.nombre && user.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.cedula && user.cedula.toString().includes(searchTerm))
      );
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter(user => {
        const hasPriority = user.actor?.has_priority;
        if (priorityFilter === "priority") {
          return hasPriority === true;
        } else {
          return hasPriority === false || hasPriority === undefined;
        }
      });
    }

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (userId: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, selected: !user.selected } : user
      )
    );
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    // Apply to filteredUsers if you want select all to respect current filters
    // For now, assuming it applies to all 'users' state and then filterUsers will re-evaluate
    setUsers(prevUsers =>
      prevUsers.map(user => ({
        ...user,
        selected: newSelectAll
      }))
    );
    // After changing 'users', 'filteredUsers' will update via useEffect
  };

  const handleEditUser = async (user: UserListItem) => {
    setEditingUser(user); // Keep original user for ID etc.
    let actorToEdit: Actor | null = user.actor || null;

    if (!user.actor) {
      toast.info("Usuario sin información de prioridad. Sincronizando con tabla de actores...");
      const syncedActor = await syncUserToActorsTable(user.id);
      if (syncedActor) {
        actorToEdit = syncedActor;
        toast.success("Sincronización completada. Ahora puede editar la información de prioridad.");
        // Refresh the main user list in the background to ensure it's up-to-date
        // This helps if other parts of the app rely on the main 'users' list being fresh.
        fetchUsers(); 
      } else {
        toast.error("Error al sincronizar con la tabla de actores. No se podrán guardar cambios de prioridad si el actor no existe.");
        // actorToEdit remains null or the initial state, the form will show defaults
      }
    }

    setEditedUserData({
      id: user.id,
      nombre: user.nombre,
      cedula: user.cedula,
      email: user.email,
      phone_number: user.phone_number,
      actor: actorToEdit ? { ...actorToEdit } : { user_id: user.id, has_priority: false, motive: '' },
    });
  };
  
  // Modify syncUserToActorsTable to return the Actor object or null
  const syncUserToActorsTable = async (userId: string): Promise<Actor | null> => {
    try {
      const { data: existingActor, error: checkError } = await supabase
        .from('actors')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is " esattamente una riga prevista" (no rows) which is fine here
        console.error('Error checking if user exists in actors table:', checkError);
        toast.error('Error verificando actor: ' + checkError.message);
        return null;
      }
      
      if (existingActor) {
        return existingActor as Actor;
      }
      
      // If user doesn't exist in actors table, add them
      const { data: newActor, error: insertError } = await supabase
        .from('actors')
        .insert([{ user_id: userId, has_priority: false, motive: null }])
        .select()
        .single(); // Assuming insert + select returns the new row
          
      if (insertError) {
        console.error('Error inserting user into actors table:', insertError);
        toast.error('Error insertando actor: ' + insertError.message);
        return null;
      }
        
      toast.success('Usuario añadido a la tabla de actores');
      return newActor as Actor;
    } catch (error) {
      console.error('Error syncing user to actors table:', error);
      toast.error('Error fatal sincronizando actor.');
      return null;
    }
  };

  const handleSyncAllUsers = async () => {
    try {
      setLoading(true);
      
      // Use our improved RPC function from userService
      const result = await syncMissingUsersToActors();
      
      if (result.success) {
        if (result.usersAdded > 0) {
          toast.success(`Se han sincronizado ${result.usersAdded} usuarios`);
        } else {
          toast.info("Todos los usuarios ya están sincronizados");
        }
        
        // Refresh the user list
        await fetchUsers();
      } else {
        toast.error("Error al sincronizar usuarios");
      }
    } catch (error) {
      console.error("Error syncing all users:", error);
      toast.error("Error al sincronizar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditedUserData({});
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    
    if (name === "has_priority_checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setEditedUserData(prevData => ({
        ...prevData,
        actor: { ...(prevData.actor || { user_id: prevData.id || '' }), has_priority: checked } as Actor | null 
      }));
    } else if (name === "motive") {
      setEditedUserData(prevData => ({
        ...prevData,
        actor: { ...(prevData.actor || { user_id: prevData.id || '' }), motive: value } as Actor | null
      }));
    } else {
      setEditedUserData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const { nombre, cedula, email, phone_number, actor } = editedUserData;
    
    if (!nombre || nombre.trim() === "") errors.nombre = "El nombre es requerido";
    else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(nombre)) errors.nombre = "El nombre solo debe contener letras y espacios.";
    
    if (!cedula || cedula.toString().trim() === "") errors.cedula = "La cédula es requerida";
    else if (!/^\d{7,10}$/.test(cedula.toString())) errors.cedula = "La cédula debe tener entre 7 y 10 dígitos.";
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Correo electrónico inválido.";
    
    if (phone_number && !/^\d{7,15}$/.test(phone_number.toString())) errors.phone_number = "El teléfono debe tener entre 7 y 15 dígitos.";
    
    if (actor?.has_priority && (!actor.motive || actor.motive.trim() === "")) {
      errors.motive = "Debe seleccionar un motivo para la prioridad.";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = async () => {
    if (!validateForm() || !editingUser) return;
    
    try {
      // First update basic user information
      const userDataToUpdate: Partial<User> = {
        nombre: editedUserData.nombre,
        cedula: editedUserData.cedula,
        email: editedUserData.email,
        phone_number: editedUserData.phone_number,
      };
      
      await updateUser(editingUser.id, userDataToUpdate);
      
      // Then update actor information if available
      if (editedUserData.actor && editingUser.id) {
        const actorPayload = {
          has_priority: editedUserData.actor.has_priority || false,
          motive: editedUserData.actor.motive || null,
        };
        
        try {
          const actorResult = await updateActorProfileRpc(editingUser.id, actorPayload);
          
          if (!actorResult || !actorResult.success) {
            toast.error(actorResult?.message || "Error al actualizar la información de prioridad del actor.");
            return; // Keep user in edit mode
          }
          
          toast.success("Información de prioridad del actor actualizada correctamente.");
        } catch (actorError) {
          console.error("Error actualizando prioridad del actor:", actorError);
          toast.error("Error al actualizar la información de prioridad: " + 
            (actorError instanceof Error ? actorError.message : "Intente nuevamente."));
          return; // Keep user in edit mode
        }
      } else {
        toast.warn("No hay información de actor para actualizar o falta user_id.");
      }
      
      // If we get here, everything was successful
      await fetchUsers();
      handleCancelEdit();
    } catch (error) {
      console.error("Error updating user (handleSaveUser):", error);
      toast.error("Error al actualizar el usuario: " + 
        (error instanceof Error ? error.message : "Error desconocido"));
      // Keep user in edit mode
    }
  };

  const confirmDeleteUsers = () => {
    const selectedUsers = users.filter(user => user.selected);
    if (selectedUsers.length === 0) {
      toast.error("No hay usuarios seleccionados para eliminar");
      return;
    }
    setSelectedUsersToDelete(selectedUsers);
    setShowDeleteModal(true);
  };

  const handleDeleteUsers = async () => {
    if (selectedUsersToDelete.length === 0) return;
    
    try {
      setLoading(true);
      const userIds = selectedUsersToDelete.map(user => user.id);
      
      // Call the deleteUsers function with the selected user IDs
      const result = await deleteUsers(userIds);
      
      if (result && result.success) {
        toast.success(`${result.deletedCount} usuario(s) eliminado(s) correctamente`);
        
        // Update UI by removing the deleted users
        setUsers(prevUsers => prevUsers.filter(user => !userIds.includes(user.id)));
        setFilteredUsers(prevFilteredUsers => prevFilteredUsers.filter(user => !userIds.includes(user.id)));
        
        // Reset selection status
        setSelectAll(false);
      } else {
        toast.error("No se pudieron eliminar algunos usuarios");
      }
    } catch (error) {
      console.error("Error deleting users:", error);
      let errorMessage = "Error al eliminar usuarios";
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setSelectedUsersToDelete([]);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUsersToDelete([]);
  };

  // Button styles
  const baseButtonStyles =
    "py-2 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const primaryButtonClasses = `${baseButtonStyles} bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500`;
  const secondaryButtonClasses = `${baseButtonStyles} bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-100 focus:ring-indigo-500`;
  const dangerButtonClasses = `${baseButtonStyles} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
  const editButtonClasses = `px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`;

  if (loading) {
    return <LoadingSpinner message="Cargando usuarios..." />;
  }

  if (error && !editingUser) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className={secondaryButtonClasses}
          >
            Reintentar
          </button>
        </div>
      </>
    );
  }

  // Editing view
  if (editingUser) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
            <div
              className={`w-full ${
                isMobile ? "max-w-lg" : "max-w-xl"
              } bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 md:p-10`}
            >
              <h2 className="font-bold text-2xl sm:text-3xl text-center mb-8 sm:mb-10 text-neutral-800">
                Editar Usuario
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
                    value={editedUserData.nombre || ""}
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
                    value={editedUserData.cedula || ""}
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
                    value={editedUserData.email || ""}
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
                    value={editedUserData.phone_number || ""}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {formErrors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phone_number}</p>
                  )}
                </div>

                {/* Prioridad */}
                <div className="mt-4 pt-4 border-t">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <input 
                      type="checkbox" 
                      name="has_priority_checkbox" 
                      checked={editedUserData.actor?.has_priority || false} 
                      onChange={handleInputChange} 
                      className="form-checkbox h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                    />
                    Usuario Prioritario
                  </label>
                  {editedUserData.actor?.has_priority && (
                  <div>
                      <label htmlFor="edit-motive" className="block text-sm font-medium text-gray-700 mb-1">Motivo de Prioridad</label>
                    <select
                        id="edit-motive" 
                      name="motive"
                        value={editedUserData.actor?.motive || ''} 
                      onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="" disabled>Seleccione un motivo</option>
                        <option value="A">Mujer embarazada</option>
                        <option value="B">Persona con movilidad reducida</option>
                        <option value="C">Adulto mayor</option>
                        <option value="D">Otro</option>
                    </select>
                      {formErrors.motive && <p className="text-red-500 text-xs mt-1">{formErrors.motive}</p>}
                    </div>
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
                  onClick={handleSaveUser}
                  className={primaryButtonClasses}
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  // User list view
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <main className="py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Administración de Usuarios
            </h1>

            <ToastContainer position="top-right" autoClose={3000} />

            {/* Filters and controls */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                {/* Search */}
                <div className="w-full md:w-1/3">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o cédula"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                {/* Priority filter */}
                <div className="w-full md:w-1/3">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">Todos los usuarios</option>
                    <option value="priority">Solo prioritarios</option>
                    <option value="normal">Solo normales</option>
                  </select>
                </div>
                
                <div className="flex flex-col md:flex-row gap-2">
                  {/* Sync Users Button */}
                  <button
                    onClick={handleSyncAllUsers}
                    className="py-2 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-blue-600 text-white hover:bg-blue-700 w-full md:w-auto"
                  >
                    Sincronizar Usuarios
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={confirmDeleteUsers}
                    className={`${dangerButtonClasses} w-full md:w-auto`}
                  >
                    Eliminar Seleccionados
                  </button>
                </div>
              </div>
            </div>

            {/* User list table */}
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
                        Prioridad
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Motivo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={user.selected}
                              onChange={() => handleSelectUser(user.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.cedula}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.email || "No disponible"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.phone_number || "No disponible"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.actor?.has_priority ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {user.actor?.has_priority ? 'Prioritario' : 'Normal'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.actor?.motive || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditUser(user)}
                              className={editButtonClasses}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                          No se encontraron usuarios
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
                  ¿Está seguro de eliminar {selectedUsersToDelete.length} usuario(s)? Esta acción no se puede deshacer.
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
                    onClick={handleDeleteUsers}
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

export default ManageUserData;
