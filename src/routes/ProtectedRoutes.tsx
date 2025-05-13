import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
  role?: string;
  requireAdmin?: boolean;
}

// Function to check if a user has the required permissions
const hasRequiredPermissions = (userProfile: any, role?: string, requireAdmin?: boolean): boolean => {
  if (!userProfile || typeof userProfile !== 'object' || Object.keys(userProfile).length === 0) {
    return false;
  }

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
      (userProfile.userType === 'worker' && userProfile.isAdmin);
    hasPermission = hasPermission && isAdmin;
  }

  return hasPermission;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role, requireAdmin }) => {
  const navigate = useNavigate();
  const { user, userProfile, loading, isAuthenticated, refreshUserProfile } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const permissionChecksRef = useRef(0);
  const MAX_PERMISSION_CHECKS = 5;
  const lastProfileRef = useRef<any>(null);

  // Preserve a stable reference to the latest profile data we've seen
  // This helps address issues where userProfile temporarily becomes empty
  useEffect(() => {
    if (userProfile && Object.keys(userProfile).length > 0) {
      lastProfileRef.current = userProfile;
    }
  }, [userProfile]);

  // Solo mostrar loading si es la primera carga o si no hay usuario autenticado
  const shouldShowLoading = loading || isCheckingAuth;

  useEffect(() => {
    let authCheckTimeout: number | null = null;
    let authRetryCount = 0;
    const MAX_RETRIES = 3;
    
    const checkAuthAndPermissions = async () => {
      setIsCheckingAuth(true);
      console.log("ProtectedRoute: Verificando autenticación y permisos...");
      
      // First time initialization flag to prevent premature redirects during refresh
      if (!hasInitialized && loading) {
        console.log("ProtectedRoute: Initial loading, waiting for auth to initialize...");
        setHasInitialized(true);
        authCheckTimeout = window.setTimeout(() => {
          checkAuthAndPermissions();
        }, 500);
        return;
      }
      
      // Si no está autenticado y no está cargando, redirigir a login
      if (!loading && !isAuthenticated && permissionChecksRef.current >= 2) {
        console.log("ProtectedRoute: No autenticado, redirigiendo a login");
        navigate("/login", { replace: true });
        setIsCheckingAuth(false);
        return;
      }

      // Check permissions with current profile or last seen profile
      const profileToCheck = (userProfile && Object.keys(userProfile).length > 0) 
        ? userProfile
        : lastProfileRef.current;

      if (isAuthenticated && profileToCheck && hasRequiredPermissions(profileToCheck, role, requireAdmin)) {
        console.log("ProtectedRoute: Usuario autorizado basado en perfil existente");
        setIsAuthorized(true);
        setIsCheckingAuth(false);
        return;
      }

      // If we're authenticated but don't have user profile data, try to refresh it
      if (isAuthenticated && user && (!userProfile || !userProfile.userType)) {
        console.log("ProtectedRoute: Autenticado pero sin perfil, obteniendo datos de usuario...");
        try {
          const refreshedProfile = await refreshUserProfile();
          
          // Check if the refreshed profile gives us permission
          if (refreshedProfile && hasRequiredPermissions(refreshedProfile, role, requireAdmin)) {
            console.log("ProtectedRoute: Usuario autorizado después de refrescar perfil");
            setIsAuthorized(true);
            setIsCheckingAuth(false);
            return;
          }
          
          // If we still don't have a user profile after refresh, retry a few times
          if ((!refreshedProfile || Object.keys(refreshedProfile).length === 0) && authRetryCount < MAX_RETRIES) {
            authRetryCount++;
            console.log(`ProtectedRoute: Intentando obtener perfil de usuario (intento ${authRetryCount}/${MAX_RETRIES})...`);
            
            // Aumentar el tiempo de espera con cada intento
            const retryDelay = 500 * Math.pow(2, authRetryCount);
            authCheckTimeout = window.setTimeout(() => {
              checkAuthAndPermissions();
            }, retryDelay);
            return;
          }
          
          // If we've reached max retries but we have a last known good profile, use that
          if (lastProfileRef.current && hasRequiredPermissions(lastProfileRef.current, role, requireAdmin)) {
            console.log("ProtectedRoute: Usuario autorizado basado en último perfil conocido");
            setIsAuthorized(true);
            setIsCheckingAuth(false);
            return;
          }
          
          // Count this permission check
          permissionChecksRef.current += 1;
          
          // If we've made too many permission checks, make a decision to avoid infinite loop
          if (permissionChecksRef.current >= MAX_PERMISSION_CHECKS) {
            if (isAuthenticated) {
              console.log("ProtectedRoute: Max permission checks reached, assuming authorized");
              setIsAuthorized(true);
            } else {
              console.log("ProtectedRoute: Max permission checks reached, redirecting to login");
              navigate("/login", { replace: true });
            }
            setIsCheckingAuth(false);
            return;
          }
          
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
      console.log("userProfile:", userProfile);
      
      // Increment permission check counter to avoid infinite loops
      permissionChecksRef.current += 1;
      
      // Try with current profile
      const currentProfile = userProfile || {};
      
      // Si está autenticado y tenemos el perfil, verificar permisos
      if (isAuthenticated && Object.keys(currentProfile).length > 0) {
        const hasPermission = hasRequiredPermissions(currentProfile, role, requireAdmin);

        if (role) {
          console.log(`ProtectedRoute: Requiere rol '${role}', usuario es '${currentProfile.userType}', permission: ${hasPermission}`);
        }

        if (requireAdmin) {
          const isAdmin = currentProfile.userType === 'admin' || 
            (currentProfile.userType === 'worker' && currentProfile.isAdmin);
          console.log(`ProtectedRoute: Requiere admin: ${requireAdmin}, es admin: ${isAdmin}`);
        }

        if (!hasPermission) {
          // Before redirecting, check if our last good profile has permission
          if (lastProfileRef.current && hasRequiredPermissions(lastProfileRef.current, role, requireAdmin)) {
            console.log("ProtectedRoute: Usuario autorizado basado en último perfil conocido");
            setIsAuthorized(true);
            setIsCheckingAuth(false);
            return;
          }
          
          // If we've made too many checks, give benefit of doubt to avoid jarring UX
          if (permissionChecksRef.current >= MAX_PERMISSION_CHECKS && isAuthenticated) {
            console.log("ProtectedRoute: Max permission checks reached, assuming authorized");
            setIsAuthorized(true);
            setIsCheckingAuth(false);
            return;
          }
          
          console.log("ProtectedRoute: Usuario no tiene permisos, redirigiendo al inicio");
          navigate("/", { replace: true });
          setIsAuthorized(false);
        } else {
          console.log("ProtectedRoute: Usuario autorizado para acceder a la ruta");
          setIsAuthorized(true);
        }
      } else if (!loading && !isAuthenticated && permissionChecksRef.current >= 2) {
        // Si no está autenticado y no está cargando, redirigir a login
        // But only after we've done a couple of checks to avoid race conditions during refresh
        console.log("ProtectedRoute: No autenticado (en verificación de permisos), redirigiendo a login");
        navigate("/login", { replace: true });
      } else {
        console.log("ProtectedRoute: Sin información de perfil para verificar permisos");
        
        // If we have a last known good profile with permission, use that
        if (lastProfileRef.current && hasRequiredPermissions(lastProfileRef.current, role, requireAdmin)) {
          console.log("ProtectedRoute: Usuario autorizado basado en último perfil conocido");
          setIsAuthorized(true);
        } else {
        setIsAuthorized(false);
        }
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
  }, [user, userProfile, loading, isAuthenticated, role, requireAdmin, navigate, refreshUserProfile, hasInitialized]);

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
