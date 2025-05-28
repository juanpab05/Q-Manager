import React, { useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  const { user, userProfile, loading, isAuthenticated } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Simplified authentication check - runs only once when component mounts or dependencies change
  useEffect(() => {
    // Set checking state
    setIsCheckingAuth(true);
    
    // If still loading auth state, wait
    if (loading) {
      return;
    }
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      setIsCheckingAuth(false);
      return;
    }
    
    // Check permissions with available profile
    if (userProfile && Object.keys(userProfile).length > 0) {
      const hasPermission = hasRequiredPermissions(userProfile, role, requireAdmin);
      
      if (hasPermission) {
        setIsAuthorized(true);
      } else {
        // User doesn't have required permissions, redirect to home
        navigate("/", { replace: true });
      }
    } else {
      // No profile data available, assume unauthorized
      setIsAuthorized(false);
      navigate("/", { replace: true });
    }
    
    // Done checking
    setIsCheckingAuth(false);
  }, [user, userProfile, loading, isAuthenticated, role, requireAdmin, navigate]);

  // Show loading indicator while checking
  if (loading || isCheckingAuth) {
    return <LoadingSpinner message="Verificando acceso..." />;
  }

  // If authorized, render children
  if (isAuthenticated && isAuthorized) {
    return children;
  }

  // In any other case, render nothing while redirect is happening
  return null;
}

export default ProtectedRoute;
