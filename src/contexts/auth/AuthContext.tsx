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

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  
  // Crea una versión memoizada del contexto para evitar renderizaciones innecesarias
  const memoizedCtx = useMemo(() => {
    return {
      ...ctx,
      // Asegurarnos de que userProfile siempre tenga al menos un objeto vacío para evitar errores null
      userProfile: ctx.userProfile || {},
      // Asegurarnos de que isAuthenticated refleje correctamente el estado de autenticación
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
  const [userProfile, setUserProfile] = useState<any | null>(null);
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
      
      // Always get fresh profile data on explicit fetch requests
      // This ensures we always have the latest data when a fetch is requested
      
      // Get fresh profile data
      const profile = await userService.getUserById(userId);
      
      if (!isMounted.current) return null;
      
      if (!profile) {
        console.error(`AuthContext: No se pudo obtener el perfil para el usuario ${userId}`);
        
        // If profile fetch fails but we have a valid user, try to ensure actor record exists
        // This helps with first-time logins where profile might be incomplete
        if (user && user.id === userId) {
          try {
            console.log(`AuthContext: Verificando/creando registro de actor para ${userId}`);
            // Check if actor record exists
            const { data: actorData, error: actorQueryError } = await supabase
              .from('actors')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();
              
            if (!actorData && (!actorQueryError || actorQueryError.code === 'PGRST116')) {
              // Create actor record if it doesn't exist
              const { error: actorCreateError } = await supabase
                .from('actors')
                .insert({
                  user_id: userId,
                  has_priority: false,
                  motive: ''
                });
                
              if (actorCreateError) {
                console.error('AuthContext: Error creating actor record:', actorCreateError);
              } else {
                console.log('AuthContext: Actor record created successfully');
                // Try fetching the profile again after creating actor record
                return await fetchAndSetUserProfile(userId);
              }
            }
          } catch (error) {
            console.error('AuthContext: Error en la verificación/creación de actor:', error);
          }
        }
        
        return null;
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
        return enrichedProfile;
      } catch (enrichmentError) {
        console.error(`AuthContext: Error al enriquecer el perfil:`, enrichmentError);
        // En caso de error, usar el perfil básico
        setUserProfile(profile);
        loadedProfileId.current = userId;
        return profile;
      }
    } catch (error) {
      console.error(`AuthContext: Error al cargar el perfil del usuario ${userId}:`, error);
      return null;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Function to update the user's last activity timestamp
  const updateLastActivity = () => {
    if (user) {
      const timestamp = Date.now();
      localStorage.setItem(LAST_ACTIVITY_KEY, timestamp.toString());
      console.log('AuthContext: Updated last activity timestamp', new Date(timestamp).toISOString());
    }
  };

  // Function to check if the user has been inactive for too long
  const checkInactivity = () => {
    if (!user) return false;
    
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
    } catch (error) {
      console.error("AuthContext: Error during forced logout:", error);
    }
  };

  useEffect(() => {
    console.log("AuthContext: useEffect");
    isMounted.current = true;
    setLoading(true);
    
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
        if (checkInactivity()) {
          forceLogout();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return;
        
        
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
        // switch (event) {
        //   case 'SIGNED_IN':
        //     if (session?.user) {
        //         setUser(session.user);
                
        //         // Make sure we wait for the profile data to be fetched and set
        //         await fetchAndSetUserProfile(session.user.id);
                
        //         // Update last activity timestamp on sign in
        //         updateLastActivity();
                
        //         // Check if this is a new user (post-email-confirmation)
        //         // We'll check the auth metadata to see if this is a first login after email confirmation
        //         const metadata = session.user.user_metadata;
        //         const fullName = metadata?.full_name;
        //         const cedula = metadata?.cedula;
        //         const phone = metadata?.phone;
                
        //         if (fullName && cedula) {
        //           try {
        //             // Try to fetch existing profile
        //             const { data: existingProfile } = await supabase
        //               .from('users')
        //               .select('*')
        //               .eq('id', session.user.id)
        //               .single();
                      
        //             // Only create profile if it doesn't exist yet
        //             if (!existingProfile) {
        //               // Create user profile now that we have a valid session
        //               const { error: insertError } = await supabase
        //                 .from('users')
        //                 .insert({
        //                   id: session.user.id,
        //                   email: session.user.email,
        //                   nombre: fullName,
        //                   cedula: cedula,
        //                   phone_number: phone || '',
        //                   is_staff: false,
        //                   is_superuser: false
        //                 });
                        
        //               if (insertError) {
        //                 console.error('AuthContext: Error creating user profile after email confirmation:', insertError);
        //               } else {
        //                 console.log('AuthContext: User profile created successfully after email confirmation');
                        
        //                 // Also create actor record for the user
        //                 const { error: actorError } = await supabase
        //                   .from('actors')
        //                   .insert({
        //                     user_id: session.user.id,
        //                     has_priority: false,
        //                     motive: ''
        //                   });
                          
        //                 if (actorError) {
        //                   console.error('AuthContext: Error creating actor record:', actorError);
        //                 } else {
        //                   console.log('AuthContext: Actor record created successfully');
        //                 }
                        
        //                 // Refresh user profile
        //                 // Force fresh fetch by clearing the loaded profile ID
        //                 loadedProfileId.current = null;
        //                 await fetchAndSetUserProfile(session.user.id);
        //               }
        //             }
        //           } catch (error) {
        //             console.error('AuthContext: Error in profile creation after email confirmation:', error);
        //           }
        //         }
        //     }
        //     break;
            
        //   case 'SIGNED_OUT':
        //     setUser(null);
        //     setUserProfile(null);
        //     loadedProfileId.current = null;
        //     localStorage.removeItem(LAST_ACTIVITY_KEY);
        //     break;
            
        //   default:
        //     // No hacer nada para otros eventos
        //     break;
        // }
        
        if (isMounted.current) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
      clearInterval(inactivityCheckInterval);
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
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
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
      
      const { error } = await supabase.auth.verifyOtp({
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
      
      // Then sign out from supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("AuthContext: Logout error:", error);
        throw error;
      }
    } catch (err) {
      console.error("AuthContext: CATCH block logout error:", err);
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
