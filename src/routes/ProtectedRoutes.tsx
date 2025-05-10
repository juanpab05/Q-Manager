import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
  role?: string;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role, requireAdmin }) => {
  const navigate = useNavigate();
  const { user, userProfile, loading, isAuthenticated } = useAuth();

  // Solo mostrar loading si es la primera carga o si no hay usuario autenticado
  const shouldShowLoading = loading && (!user || !userProfile);

  useEffect(() => {
    // Si no está autenticado y no está cargando, redirigir a login
    if (!loading && !isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    // Si está autenticado y tenemos el perfil, verificar permisos
    if (isAuthenticated && userProfile) {
      let hasPermission = true;

      if (role) {
        if (role === 'worker') {
          hasPermission = userProfile.userType === 'worker' || userProfile.userType === 'admin';
        } else {
          hasPermission = userProfile.userType === role;
        }
      }

      if (requireAdmin) {
        const isAdmin = userProfile.userType === 'admin' || 
          (userProfile.userType === 'worker' && userProfile.details?.is_admin);
        hasPermission = hasPermission && isAdmin;
      }

      if (!hasPermission) {
        navigate("/", { replace: true });
      }
    }
  }, [user, userProfile, loading, isAuthenticated, role, requireAdmin, navigate]);

  // Solo mostrar loading en la carga inicial
  if (shouldShowLoading) {
    return <div className="p-4 text-center">Cargando...</div>;
  }

  // Si está autenticado y tiene los permisos necesarios (verificado en useEffect)
  if (isAuthenticated && userProfile) {
    return children;
  }

  // En cualquier otro caso, no renderizar nada mientras se resuelve la redirección
    return null;
  }

export default ProtectedRoute;
