// src/auth/AuthContext.tsx
"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useRef,
} from "react";
// auth is deprecated, use supabase.auth directly for all auth operations
// import { auth } from "../../services/supabase"; 
import supabase from "@/services/supabase";
import userService from "@/services/userService";
import { User } from "@supabase/supabase-js";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
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
      
      // Clear the loaded profile ID reference to force a fresh fetch
      // This ensures we always get the latest data after sign-in events
      if (loadedProfileId.current === userId) {
        loadedProfileId.current = null;
      }
      
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
      setUserProfile(profile);
      loadedProfileId.current = userId;
      return profile;
    } catch (error) {
      console.error(`AuthContext: Error al cargar el perfil del usuario ${userId}:`, error);
      return null;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    
    // Inicialización: obtener sesión actual
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted.current) return;
        
        if (data.session?.user) {
          setUser(data.session.user);
          await fetchAndSetUserProfile(data.session.user.id);
        }
      } catch (error) {
        console.error("Error al inicializar Auth:", error);
      } finally {
        if (isMounted.current) {
        setLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return;
        
        console.log(`AuthContext: Evento de autenticación: ${event}`);
        
        // Si es el mismo usuario que ya tenemos, solo actualizar el objeto user
        if (session?.user && user?.id === session.user.id) {
          setUser(session.user);
          
          // Si es un evento USER_UPDATED, actualizar el perfil
          if (event === 'USER_UPDATED') {
            await fetchAndSetUserProfile(session.user.id);
          }
          return;
        }
        
        // Para eventos que realmente cambian el estado de autenticación
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
                setUser(session.user);
                
                // Make sure we wait for the profile data to be fetched and set
                await fetchAndSetUserProfile(session.user.id);
                
                // Check if this is a new user (post-email-confirmation)
                // We'll check the auth metadata to see if this is a first login after email confirmation
                const metadata = session.user.user_metadata;
                const fullName = metadata?.full_name;
                const cedula = metadata?.cedula;
                const phone = metadata?.phone;
                
                if (fullName && cedula) {
                  console.log(`AuthContext: Detected first login after email confirmation. Creating user profile for: ${fullName}`);
                  try {
                    // Try to fetch existing profile
                    const { data: existingProfile } = await supabase
                      .from('users')
                      .select('*')
                      .eq('id', session.user.id)
                      .single();
                      
                    // Only create profile if it doesn't exist yet
                    if (!existingProfile) {
                      // Create user profile now that we have a valid session
                      const { error: insertError } = await supabase
                        .from('users')
                        .insert({
                          id: session.user.id,
                          email: session.user.email,
                          nombre: fullName,
                          cedula: cedula,
                          phone_number: phone || '',
                          is_staff: false,
                          is_superuser: false
                        });
                        
                      if (insertError) {
                        console.error('AuthContext: Error creating user profile after email confirmation:', insertError);
                      } else {
                        console.log('AuthContext: User profile created successfully after email confirmation');
                        
                        // Also create actor record for the user
                        const { error: actorError } = await supabase
                          .from('actors')
                          .insert({
                            user_id: session.user.id,
                            has_priority: false,
                            motive: ''
                          });
                          
                        if (actorError) {
                          console.error('AuthContext: Error creating actor record:', actorError);
                        } else {
                          console.log('AuthContext: Actor record created successfully');
                        }
                        
                        // Refresh user profile
                        // Force fresh fetch by clearing the loaded profile ID
                        loadedProfileId.current = null;
                        await fetchAndSetUserProfile(session.user.id);
                      }
                    }
                  } catch (error) {
                    console.error('AuthContext: Error in profile creation after email confirmation:', error);
                  }
                }
            }
            break;
            
          case 'SIGNED_OUT':
            setUser(null);
            setUserProfile(null);
            loadedProfileId.current = null;
            break;
            
          default:
            // No hacer nada para otros eventos
            break;
        }
      }
    );

    return () => {
      isMounted.current = false;
        subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("AuthContext: Login error:", error.message);
        return false;
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
      
      return { success: true };
    } catch (err: any) {
      console.error("AuthContext: Update password error:", err);
      return { success: false, error: err.message || "Error desconocido al actualizar contraseña" };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("AuthContext: Logout error:", error);
        throw error;
      }
      setUser(null);
      setUserProfile(null);
      loadedProfileId.current = null;
    } catch (err) {
      console.error("AuthContext: CATCH block logout error:", err);
    } finally {
      setLoading(false);
    }
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
  };
  
  // console.log("AuthContext: Provider rendering with state:", contextValue);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
