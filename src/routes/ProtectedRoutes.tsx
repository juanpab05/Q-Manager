import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
  role?: string;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role, requireAdmin }) => {
  const navigate = useNavigate();
  const { user, userProfile, loading, isAuthenticated, refreshUserProfile } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Solo mostrar loading si es la primera carga o si no hay usuario autenticado
  const shouldShowLoading = loading || isCheckingAuth;

  useEffect(() => {
    let authCheckTimeout: number | null = null;
    
    const checkAuthAndPermissions = async () => {
      setIsCheckingAuth(true);
      console.log("ProtectedRoute: Verificando autenticación y permisos...");
      
      // Si no está autenticado y no está cargando, redirigir a login
      if (!loading && !isAuthenticated) {
        console.log("ProtectedRoute: No autenticado, redirigiendo a login");
        navigate("/login", { replace: true });
        setIsCheckingAuth(false);
        return;
      }

      // If we're authenticated but don't have user profile data, try to refresh it
      if (isAuthenticated && user && (!userProfile || !userProfile.userType)) {
        console.log("ProtectedRoute: Autenticado pero sin perfil, obteniendo datos de usuario...");
        try {
          await refreshUserProfile();
          // Damos un pequeño tiempo para que los datos se actualicen en el contexto
          authCheckTimeout = window.setTimeout(() => {
            checkPermissionsAndSetState();
          }, 300);
        } catch (error) {
          console.error("ProtectedRoute: Error al refrescar perfil:", error);
          setIsCheckingAuth(false);
        }
        return;
      }
      
      // Si ya tenemos la información necesaria, verificar permisos directamente
      checkPermissionsAndSetState();
    };
    
    const checkPermissionsAndSetState = () => {
      console.log("ProtectedRoute: Verificando permisos con userProfile:", userProfile);
      
      // Si está autenticado y tenemos el perfil, verificar permisos
      if (isAuthenticated && userProfile) {
        let hasPermission = true;

        if (role) {
          if (role === 'worker') {
            hasPermission = userProfile.userType === 'worker' || userProfile.userType === 'admin';
            console.log(`ProtectedRoute: Requiere rol 'worker', usuario es '${userProfile.userType}', permission: ${hasPermission}`);
          } else {
            hasPermission = userProfile.userType === role;
            console.log(`ProtectedRoute: Requiere rol '${role}', usuario es '${userProfile.userType}', permission: ${hasPermission}`);
          }
        }

        if (requireAdmin) {
          const isAdmin = userProfile.userType === 'admin' || 
            (userProfile.userType === 'worker' && userProfile.isAdmin);
          hasPermission = hasPermission && isAdmin;
          console.log(`ProtectedRoute: Requiere admin: ${requireAdmin}, es admin: ${isAdmin}, permission final: ${hasPermission}`);
        }

        if (!hasPermission) {
          console.log("ProtectedRoute: Usuario no tiene permisos, redirigiendo al inicio");
          navigate("/", { replace: true });
          setIsAuthorized(false);
        } else {
          console.log("ProtectedRoute: Usuario autorizado para acceder a la ruta");
          setIsAuthorized(true);
        }
      } else {
        console.log("ProtectedRoute: Sin información de perfil para verificar permisos");
        setIsAuthorized(false);
      }
      
      setIsCheckingAuth(false);
    };

    checkAuthAndPermissions();
    
    // Limpieza del timeout al desmontar
    return () => {
      if (authCheckTimeout) {
        window.clearTimeout(authCheckTimeout);
      }
    };
  }, [user, userProfile, loading, isAuthenticated, role, requireAdmin, navigate, refreshUserProfile]);

  // Mostrar un indicador de carga mientras se verifica la autenticación y los permisos
  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si está autenticado y tiene los permisos necesarios (verificado en useEffect)
  if (isAuthenticated && isAuthorized) {
    return children;
  }

  // En cualquier otro caso, no renderizar nada mientras se resuelve la redirección
  return null;
}

export default ProtectedRoute;
