// src/auth/AuthContext.tsx
"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useRef,
  useMemo,
} from "react";
// auth is deprecated, use supabase.auth directly for all auth operations
// import { auth } from "../../services/supabase"; 
import supabase from "@/services/supabase";
import userService from "@/services/userService";
import { User } from "@supabase/supabase-js";

// Define the inactivity timeout (24 hours in milliseconds)
const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const LAST_ACTIVITY_KEY = 'last_activity_timestamp';
const USER_PROFILE_KEY = 'cached_user_profile';

interface AuthContextType {
  user: User | null;
  userProfile: any | null; // Consider defining a more specific type for userProfile
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateLastActivity: () => void;
  refreshUserProfile: () => Promise<any | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to safely retrieve cached profile
const getCachedProfile = (): any | null => {
  try {
    const cachedData = sessionStorage.getItem(USER_PROFILE_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (e) {
    console.error('Error retrieving cached profile:', e);
  }
  return null;
};

// Helper to safely cache profile
const cacheUserProfile = (profile: any): void => {
  if (!profile) return;
  
  try {
    sessionStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    console.log('User profile cached in sessionStorage');
  } catch (e) {
    console.error('Error caching user profile:', e);
  }
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  
  // Crea una versión memoizada del contexto para evitar renderizaciones innecesarias
  const memoizedCtx = useMemo(() => {
    // Get potentially cached profile if current context profile is empty
    const cachedProfile = (!ctx.userProfile || Object.keys(ctx.userProfile).length === 0) 
      ? getCachedProfile() 
      : null;
    
    // Use context profile if available, otherwise use cached profile or fallback to empty object
    const userProfile = ctx.userProfile || cachedProfile || {};
    
    return {
      ...ctx,
      // Always provide a stable userProfile value - use context or cached
      userProfile,
      // Ensure isAuthenticated reflects user state
      isAuthenticated: !!ctx.user
    };
  }, [ctx]);
  
  return memoizedCtx;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(() => {
    // Initialize with cached profile if available
    return getCachedProfile();
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Referencia para rastrear el ID del usuario del que ya hemos cargado el perfil
  const loadedProfileId = useRef<string | null>(null);
  // Referencia para saber si el componente está montado
  const isMounted = useRef(true);

  const fetchAndSetUserProfile = async (userId: string): Promise<any | null> => {
    if (!userId) {
      return userProfile;
    }

    try {
      console.log(`AuthContext: Iniciando fetchAndSetUserProfile para userId: ${userId}`);
      setLoading(true);
      
      // First check if we have a valid cached profile matching this user
      const cachedProfile = getCachedProfile();
      if (cachedProfile && cachedProfile.id === userId) {
        console.log('AuthContext: Using cached profile during fetch');
        setUserProfile(cachedProfile);
        
        // If we're in a normal navigation context (not login/refresh), 
        // use the cached data and avoid the network request
        if (loadedProfileId.current === userId) {
          console.log('AuthContext: Using existing profile data, skipping network request');
          setLoading(false);
          return cachedProfile;
        }
        // Otherwise continue with fetch to ensure data is fresh
      }
      
      // Get fresh profile data
      const profile = await userService.getUserById(userId);
      
      if (!isMounted.current) return null;
      
      if (!profile) {
        console.error(`AuthContext: No se pudo obtener el perfil para el usuario ${userId}`);
        
        // If cached profile exists and matches user, keep using it rather than returning null
        if (cachedProfile && cachedProfile.id === userId) {
          return cachedProfile;
        }
        
        return cachedProfile || null;
      }

      console.log(`AuthContext: Perfil obtenido exitosamente:`, profile);
      
      // Mejorar el perfil con información de actor/worker
      try {
        // Verificar si es un actor
        const { data: actorData } = await supabase
          .from('actors')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        // Verificar si es un worker
        const { data: workerData } = await supabase
          .from('workers')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
          
        // Crear un perfil enriquecido
        const enrichedProfile = {
          ...profile,
          actor: actorData || null,
          worker: workerData || null,
          isActor: !!actorData,
          isWorker: !!workerData,
          isAdmin: workerData?.is_admin || false,
          userType: workerData ? (workerData.is_admin ? 'admin' : 'worker') : (actorData ? 'actor' : 'user')
        };
        
        console.log(`AuthContext: Perfil enriquecido:`, enrichedProfile);
        setUserProfile(enrichedProfile);
        loadedProfileId.current = userId;
        
        // Cache the profile for resilience against refreshes
        cacheUserProfile(enrichedProfile);
        
        return enrichedProfile;
      } catch (enrichmentError) {
        console.error(`AuthContext: Error al enriquecer el perfil:`, enrichmentError);
        // En caso de error, usar el perfil básico
        setUserProfile(profile);
        loadedProfileId.current = userId;
        
        // Cache even the basic profile 
        cacheUserProfile(profile);
        
        return profile;
      }
    } catch (error) {
      console.error(`AuthContext: Error al cargar el perfil del usuario ${userId}:`, error);
      
      // Return any cached profile if we have it
      const cachedProfile = getCachedProfile();
      if (cachedProfile && cachedProfile.id === userId) {
        return cachedProfile;
      }
      
      return null;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Function to update the last activity timestamp
  const updateLastActivity = () => {
    if (user) {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        // Also store the user ID to prevent race conditions on refresh
        localStorage.setItem('auth_user_id', user.id);
        console.log('AuthContext: Last activity updated for user', user.id);
      } catch (e) {
        console.error('AuthContext: Error updating last activity timestamp:', e);
      }
    }
  };

  // Function to check if the user has been inactive for too long
  const checkInactivity = () => {
    // Don't check inactivity if we're in the loading/initialization phase
    if (loading) {
      console.log('AuthContext: Skipping inactivity check during loading phase');
      return false;
    }
    
    if (!user) {
      // Clean up any orphaned timestamps if there's no user but there is a timestamp
      if (localStorage.getItem(LAST_ACTIVITY_KEY)) {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        localStorage.removeItem('auth_user_id');
      }
      return false;
    }
    
    // Check if the stored user ID matches the current user ID
    const storedUserId = localStorage.getItem('auth_user_id');
    if (storedUserId !== user.id) {
      // User IDs don't match, update the timestamp and user ID
      updateLastActivity();
      return false;
    }
    
    const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivityStr) {
      // If no last activity, set it now
      updateLastActivity();
      return false;
    }
    
    const lastActivity = parseInt(lastActivityStr, 10);
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastActivity;
    
    console.log('AuthContext: Time since last activity:', Math.round(timeSinceLastActivity / 60000), 'minutes');
    
    if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
      console.log('AuthContext: User inactive for too long, logging out automatically');
      // User has been inactive for too long
      return true;
    } else {
      // Update the timestamp as the user is still active
      updateLastActivity();
      return false;
    }
  };

  // Force logout due to inactivity
  const forceLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      loadedProfileId.current = null;
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem('auth_user_id');
      sessionStorage.removeItem(USER_PROFILE_KEY);
      
      // Redirect to login page after force logout
      window.location.href = '/login';
    } catch (error) {
      console.error("AuthContext: Error during forced logout:", error);
      
      // Still attempt to redirect even if there was an error
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    console.log("AuthContext: useEffect");
    isMounted.current = true;
    setLoading(true);
    
    // Safety timeout to prevent infinite loading state
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && loading) {
        console.log('AuthContext: Safety timeout triggered, resolving loading state');
        setLoading(false);
      }
    }, 15000); // 15 seconds timeout
    
    // Inicialización: obtener sesión actual
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted.current) return;
        
        if (data.session?.user) {
          // Check for inactivity before setting the user
          const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
          if (lastActivityStr) {
            const lastActivity = parseInt(lastActivityStr, 10);
            const currentTime = Date.now();
            const timeSinceLastActivity = currentTime - lastActivity;
            
            if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
              await forceLogout();
              setLoading(false);
              return;
            }
          }
          
          // User is active or no activity recorded yet
          setUser(data.session.user);
          await fetchAndSetUserProfile(data.session.user.id);
          updateLastActivity();
        }
      } catch (error) {
        console.error('AuthContext: Error during initialization:', error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    // Set up a periodic check for inactivity
    const inactivityCheckInterval = setInterval(() => {
      if (user && checkInactivity()) {
        forceLogout();
      }
    }, 60000); // Check every minute
    
    // Also check on visibility change (when user comes back to the tab/window)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Only update activity timestamp when coming back to the tab
        // Don't trigger any authentication checks or profile refreshes
        try {
          localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
          if (user) {
            localStorage.setItem('auth_user_id', user.id);
          }
        } catch (e) {
          console.error('AuthContext: Error updating timestamp on visibility change:', e);
        }
      } else if (document.visibilityState === 'hidden') {
        // When tab becomes hidden, ensure we don't get stuck in loading state
        if (loading && user) {
          console.log('AuthContext: Tab hidden, ensuring loading state is resolved');
          setLoading(false);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return;
        
        console.log('AuthContext: Auth state change event:', event);
        
        // Ensure we set loading state for all auth events
        setLoading(true);
        
        // Si es el mismo usuario que ya tenemos, solo actualizar el objeto user
        if (session?.user && user?.id === session.user.id) {
          setUser(session.user);
          
          // Si es un evento USER_UPDATED, actualizar el perfil
          if (event === 'USER_UPDATED') {
            await fetchAndSetUserProfile(session.user.id);
          }
          
          // Update last activity timestamp
          updateLastActivity();
          setLoading(false);
          return;
        }
        
        // Para eventos que realmente cambian el estado de autenticación
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
                setUser(session.user);
                
                // Update last activity timestamp on sign in
                updateLastActivity();
                
                // Make sure we wait for the profile data to be fetched and set
                await fetchAndSetUserProfile(session.user.id);
            }
            break;
            
          case 'SIGNED_OUT':
            setUser(null);
            setUserProfile(null);
            loadedProfileId.current = null;
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            break;
            
          default:
            // No hacer nada para otros eventos
            break;
        }
        
        if (isMounted.current) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
      clearInterval(inactivityCheckInterval);
      clearTimeout(safetyTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("AuthContext: Login error:", error.message);
        return false;
      }
      
      // Set last activity timestamp upon successful login
      if (data.user) {
        updateLastActivity();
      }
      
      return !!data.user;
    } catch (err) {
      console.error("AuthContext: CATCH block login error:", err);
      return false;
    }
  };

  const sendPhoneOtp = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Format phone number to include country code if not present
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      
      // First, check if there's an existing user with this phone number
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, nombre, email')
        .eq('phone_number', formattedPhone)
        .single();
        
      if (!existingUser || userError) {
        console.log('AuthContext: No existing user found for phone:', formattedPhone);
        return { 
          success: false, 
          error: 'No existe una cuenta registrada con este número de teléfono. Por favor, regístrese primero o use su correo electrónico.' 
        };
      }
      
      console.log('AuthContext: Found existing user for phone login:', existingUser);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        // Handle specific Twilio errors with user-friendly messages
        if (error.message.includes('21608') || error.message.includes('unverified')) {
          return { 
            success: false, 
            error: 'Este número no está verificado en nuestro sistema. Por favor, contacte al administrador para verificar su número de teléfono.' 
          };
        }
        
        if (error.message.includes('trial account')) {
          return { 
            success: false, 
            error: 'Error en el servicio de SMS. Por favor, use su correo electrónico para iniciar sesión.' 
          };
        }
        
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err: any) {
      console.error("AuthContext: Send OTP error:", err);
      return { success: false, error: err.message || "Error desconocido al enviar OTP" };
    }
  };

  const verifyPhoneOtp = async (phone: string, token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Format phone number to include country code if not present
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: 'sms',
      });

      if (error) {
        return { success: false, error: error.message };
      }
      
      // Set last activity timestamp upon successful verification
      updateLastActivity();
      
      return { success: true };
    } catch (err: any) {
      console.error("AuthContext: Verify OTP error:", err);
      return { success: false, error: err.message || "Error desconocido al verificar OTP" };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err: any) {
      console.error("AuthContext: Reset password error:", err);
      return { success: false, error: err.message || "Error desconocido al solicitar cambio de contraseña" };
    }
  };

  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }
      
      // Update last activity timestamp after password update
      updateLastActivity();
      
      return { success: true };
    } catch (err: any) {
      console.error("AuthContext: Update password error:", err);
      return { success: false, error: err.message || "Error desconocido al actualizar contraseña" };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // First clear state to ensure UI responds immediately
      setUser(null);
      setUserProfile(null);
      loadedProfileId.current = null;
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem('auth_user_id');
      sessionStorage.removeItem(USER_PROFILE_KEY);
      
      // Then sign out from supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("AuthContext: Logout error:", error);
        throw error;
      }
      
      // Redirect to login page after logout
      window.location.href = '/login';
    } catch (err) {
      console.error("AuthContext: CATCH block logout error:", err);
      // Still try to redirect even if there was an error
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh the user's profile data
  const refreshUserProfile = async (): Promise<any | null> => {
    if (!user) {
      console.log('AuthContext: Cannot refresh user profile, no user logged in');
      return null;
    }
    
    console.log(`AuthContext: Refreshing user profile for ${user.id}`);
    return await fetchAndSetUserProfile(user.id);
  };

  const contextValue = {
    user,
    userProfile,
    loading,
    login,
    sendPhoneOtp,
    verifyPhoneOtp,
    resetPassword,
    updatePassword,
    logout,
    isAuthenticated: !!user,
    updateLastActivity,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
