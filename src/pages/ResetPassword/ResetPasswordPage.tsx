import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import supabase from '@/services/supabase';
import useMediaQuery from '@/hooks/useMediaQuery';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '@/contexts/auth/AuthContext';

// Iconos
const EyeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const auth = useAuth(); // Use the auth context

  // Verificar si hay una sesión de recuperación al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error checking session:', error);
          setError('La sesión de recuperación ha expirado o es inválida. Por favor, solicite un nuevo enlace de recuperación.');
          return;
        }
        
        if (!data.session) {
          console.log('No active session found for password reset');
          setError('La sesión de recuperación ha expirado o es inválida. Por favor, solicite un nuevo enlace de recuperación.');
        } else {
          console.log('Valid session found for password reset');
        }
      } catch (err) {
        console.error('Error in checkSession:', err);
        setError('Ocurrió un error al verificar su sesión. Por favor, intente nuevamente.');
      }
    };
    
    checkSession();
  }, []);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    
    try {
      // Use auth context's updatePassword method instead of direct Supabase call
      const result = await auth.updatePassword(newPassword);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar contraseña');
      }

      console.log('Password update successful');
      setSuccess(true);
      toast.success('Contraseña actualizada con éxito. Serás redirigido al inicio de sesión en unos momentos.');
      
      // Redirigir después de un tiempo
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Error al restablecer contraseña:', err);
      
      // Show different error messages based on the error type
      if (err.message?.includes('session')) {
        toast.error('La sesión ha expirado. Por favor, solicite un nuevo enlace de recuperación.');
      } else {
        toast.error(err.message || 'Error al restablecer la contraseña');
      }
    } finally {
      setLoading(false);
    }
  };

  // Clases reutilizables
  const inputBaseClasses = "w-full py-3 px-4 rounded-lg bg-slate-50 border border-gray-300 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors";
  const buttonClasses = "w-full py-3 px-4 rounded-lg text-white font-semibold text-base shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <main className='flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28'>
        <ToastContainer position={isMobile ? "bottom-center" : "top-right"} autoClose={3500} theme="light" />
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <h2 className="text-center text-2xl font-bold mb-6 text-gray-800">Restablecer Contraseña</h2>
          
          {error ? (
            <div className="text-center space-y-6">
              <div className="text-red-600 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="mt-2 text-lg font-medium">Error de sesión</p>
              </div>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => navigate('/recover-password')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Solicitar nuevo enlace
              </button>
            </div>
          ) : !success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${inputBaseClasses} pr-10`}
                    disabled={loading}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-indigo-500 rounded-md"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">La contraseña debe tener al menos 8 caracteres</p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputBaseClasses} pr-10`}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`${buttonClasses} ${loading ? 'bg-neutral-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {loading ? (
                  <>
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </span>
                  </>
                ) : "Restablecer Contraseña"}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="text-green-600 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-lg font-medium">¡Contraseña actualizada!</p>
              </div>
              <p className="text-gray-600">
                Tu contraseña ha sido actualizada exitosamente.
              </p>
              <p className="text-gray-500">
                Serás redirigido automáticamente a la página de inicio de sesión.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordPage; 