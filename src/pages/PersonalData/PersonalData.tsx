import React, { useEffect } from "react";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext"; // Use AuthContext
// No need for getUserProfile from @/api/userService if using AuthContext.userProfile

// UserProfile type can be imported from AuthContext or userService if defined globally
// For now, let's rely on the type inferred from useAuth().userProfile

const PersonalData: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { userProfile, loading: authLoading, isAuthenticated } = useAuth(); // Get data from AuthContext

  useEffect(() => {
    // If auth is not loading and user is not authenticated, redirect to login
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const baseButtonStyles =
    "py-3 px-6 rounded-lg font-semibold text-base shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const actionButtonClasses = `${baseButtonStyles} w-full sm:w-auto bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-100 focus:ring-indigo-500`;

  const handleGoBack = () => {
    navigate("/home-user");
  };

  // Show loading indicator while AuthContext is loading or if userProfile is not yet available
  if (authLoading || (isAuthenticated && !userProfile)) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <p className="text-gray-600 text-lg">Cargando datos del perfil...</p>
        </div>
      </>
    );
  }

  // If not authenticated and not loading (should have been redirected by useEffect, but as a fallback)
  if (!isAuthenticated) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <p className="text-gray-600 text-lg">Redirigiendo a login...</p> {/* Or display nothing as redirect happens */}
        </div>
      </>
    );
  }
  
  // If authenticated but userProfile is somehow still null (after loading is complete)
  // This case indicates an issue with profile fetching in AuthContext, but PersonalData should handle it gracefully.
  if (!userProfile) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <p className="text-red-600 text-lg mb-4">No se pudieron cargar los datos del perfil.</p>
          <button
            onClick={handleGoBack}
            className={actionButtonClasses}
          >
            Regresar a Inicio
          </button>
        </div>
      </>
    );
  }

  // At this point, userProfile should be available
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
        <div
          className={`w-full ${
            isMobile ? "max-w-lg" : "max-w-xl"
          } bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 md:p-10`}
        >
          <h2 className="font-bold text-2xl sm:text-3xl text-center mb-8 sm:mb-10 text-neutral-800">
            Mis Datos Personales
          </h2>

          <div className="space-y-5 sm:space-y-6 mb-8 sm:mb-10">
            <div>
              <label className="block text-sm font-semibold text-neutral-600 mb-1">
                Nombre:
              </label>
              <p className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-800 text-base">
                {userProfile.nombre || "No disponible"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-600 mb-1">
                Cédula:
              </label>
              <p className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-800 text-base">
                {userProfile.cedula || "No disponible"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-600 mb-1">
                Correo Electrónico:
              </label>
              <p className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-800 text-base">
                {userProfile.email || "No disponible"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-600 mb-1">
                Teléfono:
              </label>
              <p className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-800 text-base">
                {userProfile.phone_number || "No disponible"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-600 mb-1">
                Contraseña:
              </label>
              <p className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-800 text-base tracking-widest">
                ••••••••
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-6 sm:mt-8">
            <button
              type="button"
              onClick={handleGoBack}
              className={actionButtonClasses}
            >
              Regresar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PersonalData;