import React, { useEffect, useState } from "react";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import userService from "@/services/userService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "@/components/LoadingSpinner";

// UserProfile type can be imported from AuthContext or userService if defined globally
// For now, let's rely on the type inferred from useAuth().userProfile

const PersonalData: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { userProfile, loading: authLoading, isAuthenticated, user, refreshUserProfile } = useAuth();
  
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Determine if user is a worker
  const isWorker = userProfile?.userType === 'worker' || userProfile?.userType === 'admin';
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    cedula: "",
    email: "",
    phone_number: "",
    // Additional field for worker role display (not editable)
    role: ""
  });

  // Initialize form data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      // Determine the role text
      let roleText = "";
      if (userProfile.userType === 'worker') {
        roleText = "Trabajador";
      } else if (userProfile.userType === 'admin') {
        roleText = "Administrador";
      } else if (userProfile.userType === 'actor') {
        roleText = "Usuario con Prioridad";
      } else {
        roleText = "Usuario Regular";
      }
      
      setFormData({
        nombre: userProfile.nombre || "",
        cedula: userProfile.cedula?.toString() || "",
        email: userProfile.email || "",
        phone_number: userProfile.phone_number || "",
        role: roleText
      });
      
      console.log("PersonalData: Datos de usuario cargados correctamente", userProfile);
    }
  }, [userProfile]);

  // Ensure we have the latest user data when the component mounts
  useEffect(() => {
    // This is necessary to ensure we have fresh data when navigating to this page
    const fetchCurrentUser = async () => {
      if (isAuthenticated && !authLoading) {
        // If we're already authenticated but don't have a userProfile,
        // trigger a refresh of the user profile
        if (!userProfile && user?.id) {
          console.log("PersonalData: Obteniendo datos de usuario...");
          await refreshUserProfile();
        }
      }
    };
    
    fetchCurrentUser();
  }, [isAuthenticated, authLoading, userProfile, user, refreshUserProfile]);

  useEffect(() => {
    // If auth is not loading and user is not authenticated, redirect to login
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const baseButtonStyles =
    "py-3 px-6 rounded-lg font-semibold text-base shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const actionButtonClasses = `${baseButtonStyles} w-full sm:w-auto bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-100 focus:ring-indigo-500`;
  
  const primaryButtonClasses = `${baseButtonStyles} w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500`;

  const handleGoBack = () => {
    navigate("/home-user");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset form data to original values
    if (userProfile) {
      // Determine the role text again
      let roleText = "";
      if (userProfile.userType === 'worker') {
        roleText = "Trabajador";
      } else if (userProfile.userType === 'admin') {
        roleText = "Administrador";
      } else if (userProfile.userType === 'actor') {
        roleText = "Usuario con Prioridad";
      } else {
        roleText = "Usuario Regular";
      }
      
      setFormData({
        nombre: userProfile.nombre || "",
        cedula: userProfile.cedula?.toString() || "",
        email: userProfile.email || "",
        phone_number: userProfile.phone_number || "",
        role: roleText
      });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.id) {
      toast.error("No se pueden actualizar los datos en este momento");
      return;
    }

    try {
      setIsSaving(true);
      
      // Simple validation
      if (!formData.nombre || !formData.email || !formData.cedula) {
        toast.error("Por favor completa todos los campos obligatorios");
        setIsSaving(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Por favor ingresa un correo electrónico válido");
        setIsSaving(false);
        return;
      }

      // Cedula validation - must be a number
      const cedulaNumber = parseInt(formData.cedula, 10);
      if (isNaN(cedulaNumber) || cedulaNumber.toString() !== formData.cedula.trim()) {
        toast.error("La cédula debe ser un número válido sin espacios ni caracteres especiales");
        setIsSaving(false);
        return;
      }

      // Convert cedula to number before updating
      const dataToUpdate = {
        ...formData,
        cedula: cedulaNumber,
        // Remove the role field as it's just for display
        role: undefined
      };

      await userService.updateUser(userProfile.id, dataToUpdate);
      toast.success("Datos actualizados correctamente");
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar los datos:", error);
      toast.error("No se pudieron actualizar los datos. Inténtalo de nuevo más tarde.");
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading indicator while AuthContext is loading or if userProfile is not yet available
  if (authLoading || (isAuthenticated && !userProfile)) {
    return <LoadingSpinner message="Cargando datos del perfil..." />;
  }

  // If not authenticated and not loading (should have been redirected by useEffect, but as a fallback)
  if (!isAuthenticated) {
    return <LoadingSpinner message="Redirigiendo a login..." />;
  }
  
  // If authenticated but userProfile is somehow still null (after loading is complete)
  // This case indicates an issue with profile fetching in AuthContext, but PersonalData should handle it gracefully.
  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <p className="text-red-600 text-lg mb-4">No se pudieron cargar los datos del perfil.</p>
        <button
          onClick={handleGoBack}
          className={actionButtonClasses}
        >
          Regresar a Inicio
        </button>
      </div>
    );
  }

  // At this point, userProfile should be available
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <ToastContainer position={isMobile ? "bottom-center" : "top-right"} />
      <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
        <div
          className={`w-full ${
            isMobile ? "max-w-lg" : "max-w-xl"
          } bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 md:p-10`}
        >
          <h2 className="font-bold text-2xl sm:text-3xl text-center mb-8 sm:mb-10 text-neutral-800">
            Mis Datos Personales
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 mb-8 sm:mb-10">
            {/* Role field - only displayed, not editable */}
            <div>
              <label className="block text-sm font-semibold text-neutral-600 mb-1">
                Tipo de Usuario:
              </label>
              <p className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-800 text-base">
                {formData.role}
              </p>
              {isWorker && (
                <p className="text-xs text-gray-500 mt-1">
                  Este campo no es editable. Si necesitas cambiar tu rol, contacta al administrador.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="nombre" className="block text-sm font-semibold text-neutral-600 mb-1">
                Nombre:
              </label>
              {isEditing ? (
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white border border-gray-300 text-neutral-800 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              ) : (
                <p className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-800 text-base">
                  {userProfile.nombre || "No disponible"}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa tu nombre completo.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="cedula" className="block text-sm font-semibold text-neutral-600 mb-1">
                Cédula:
              </label>
              {isEditing ? (
                <input
                  id="cedula"
                  name="cedula"
                  type="text"
                  value={formData.cedula}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white border border-gray-300 text-neutral-800 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              ) : (
                <p className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-800 text-base">
                  {userProfile.cedula || "No disponible"}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa solo números, sin puntos ni guiones.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-600 mb-1">
                Correo Electrónico:
              </label>
              {isEditing ? (
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white border border-gray-300 text-neutral-800 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              ) : (
                <p className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-800 text-base">
                  {userProfile.email || "No disponible"}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa un correo electrónico válido (ejemplo@dominio.com).
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-semibold text-neutral-600 mb-1">
                Teléfono:
              </label>
              {isEditing ? (
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white border border-gray-300 text-neutral-800 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              ) : (
                <p className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-800 text-base">
                  {userProfile.phone_number || "No disponible"}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa tu número de teléfono con formato internacional (ej. +571234567890).
                </p>
              )}
            </div>

            {/* Display worker access point info if available */}
            {userProfile.access_point && (
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1">
                  Punto de Acceso Asignado:
                </label>
                <p className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-800 text-base">
                  {userProfile.access_point.name || "No asignado"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  La asignación de puntos de acceso la realiza el administrador.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-neutral-600 mb-1">
                Contraseña:
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <p className="w-full sm:flex-1 p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-800 text-base tracking-widest">
                  ••••••••
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/reset-password")}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Cambiar contraseña
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Por seguridad, se te redirigirá a una página específica para cambiar tu contraseña.
              </p>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 sm:mt-8">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={actionButtonClasses}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className={primaryButtonClasses}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleGoBack}
                  className={actionButtonClasses}
                >
                  Regresar
                </button>
                <button
                  type="button"
                  onClick={handleEditClick}
                  className={primaryButtonClasses}
                >
                  Editar Mis Datos
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PersonalData;