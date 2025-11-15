import React, { useEffect, useState } from "react";
import useMediaQuery from "../../hooks/useMediaQuery";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "../../components/LoadingSpinner";
import PersonalDataForm from "./PersonalDataForm";

const PersonalData: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { userProfile, loading: authLoading, isAuthenticated, user, refreshUserProfile } = useAuth();
  

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  

  const isWorker = userProfile?.userType === 'worker' || userProfile?.userType === 'admin';


  useEffect(() => {

    const fetchCurrentUser = async () => {
      if (isAuthenticated && !authLoading) {

        if (!userProfile && user?.id) {
          console.log("PersonalData: Obteniendo datos de usuario...");
          await refreshUserProfile();
        }
      }
    };
    
    fetchCurrentUser();
  }, [isAuthenticated, authLoading, userProfile, user, refreshUserProfile]);

  useEffect(() => {

    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleGoBack = () => {
    navigate("/home-user");
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveSuccess = () => {
    setIsEditing(false);
    toast.success("Datos actualizados correctamente");
  };

  const handleSaveError = (error: any) => {
    console.error("Error al actualizar los datos:", error);
    toast.error("No se pudieron actualizar los datos. Inténtalo de nuevo más tarde.");
  };


  if (authLoading || (isAuthenticated && !userProfile)) {
    return <LoadingSpinner message="Cargando datos del perfil..." />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner message="Redirigiendo a login..." />;
  }
  

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <p className="text-red-600 text-lg mb-4">No se pudieron cargar los datos del perfil.</p>
        <button
          onClick={handleGoBack}
          className="py-3 px-6 rounded-lg font-semibold text-base shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-100 focus:ring-indigo-500"
        >
          Regresar a Inicio
        </button>
      </div>
    );
  }


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

          <PersonalDataForm
            userProfile={userProfile}
            isEditing={isEditing}
            isSaving={isSaving}
            isWorker={isWorker}
            onEditClick={handleEditClick}
            onCancelEdit={handleCancelEdit}
            onSaveSuccess={handleSaveSuccess}
            onSaveError={handleSaveError}
            onGoBack={handleGoBack}
            onNavigateToResetPassword={() => navigate("/reset-password")}
            setIsSaving={setIsSaving}
          />
        </div>
      </main>
    </div>
  );
};

export default PersonalData;