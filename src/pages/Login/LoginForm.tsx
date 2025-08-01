import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useAuth } from "@/contexts/auth/AuthContext";
import imagenLogin from "@/assets/formsImage.png";
import "react-toastify/dist/ReactToastify.css";

// Iconos reutilizados del formulario de registro
const EyeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
  </svg>
);

const EyeSlashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38c.145-.382.145-.806 0-1.188a10.01 10.01 0 0 0-2.29-3.577l-1.521-1.522a10.007 10.007 0 0 0-1.53-.962L3.28 2.22ZM7.75 7.25c0-.219.029-.43.084-.635l1.972 1.972a2.5 2.5 0 0 1-.635.084A2.5 2.5 0 0 1 7.5 10a2.5 2.5 0 0 1 1.637-2.353L7.75 7.25Z" clipRule="evenodd" />
    <path d="m10.748 13.93 1.523 1.523a9.987 9.987 0 0 1-1.523.962A10.007 10.007 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41a1.652 1.652 0 0 1 0-1.188A10.007 10.007 0 0 1 2.94 6.095l-1.546-1.546A11.508 11.508 0 0 0 .006 9.41a1.651 1.651 0 0 0 0 1.186A11.479 11.479 0 0 0 10 18.5c1.905 0 3.7-.462 5.29-.126L10.748 13.93Z" />
  </svg>
);

const LoginForm: React.FC = () => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  // Email login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Phone login states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  
  const [loading, setLoading] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const navigate = useNavigate();
  const auth = useAuth();

  // Check for confirmation success in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const confirmation = urlParams.get('confirmation');
    
    if (confirmation === 'success') {
      toast.success("¡Email confirmado! Ya puedes iniciar sesión con tu cuenta.", {
        autoClose: 5000
      });
      
      // Remove the confirmation param from the URL to prevent showing the message on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
    
    // Check for error in URL hash (when confirmation link fails)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const error = hashParams.get('error');
    
    if (error) {
      const errorDesc = hashParams.get('error_description');
      toast.error(errorDesc?.replace(/\+/g, ' ') || "Error al confirmar el email", {
        autoClose: 7000
      });
      
      // Remove the error param from the URL to prevent showing the message on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor ingrese las credenciales.");
      return;
    }
    
    // Validar formato de email básico
    if (!email.includes('@')) {
      toast.error("Por favor ingrese un email válido.");
      return;
    }

    setLoading(true);
    try {
      const success = await auth.login(email, password);
      
      if (success) {
        console.log("Login successful, redirecting to home-user");
        navigate("/home-user");
      } else {
        toast.error("Credenciales inválidas o error de conexión.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Error al iniciar sesión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length < 7) {
      toast.error("Por favor ingrese un número de teléfono válido.");
      return;
    }

    setLoading(true);
    try {
      const result = await auth.sendPhoneOtp(phoneNumber);
      
      if (result.success) {
        setOtpSent(true);
        toast.success("Se ha enviado un código de verificación a tu teléfono.");
      } else {
        toast.error(result.error || "Error al enviar el código de verificación.");
      }
    } catch (error: any) {
      console.error("Error al enviar OTP:", error);
      toast.error(error.message || "Error al enviar el código de verificación.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error("Por favor ingrese el código de 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const result = await auth.verifyPhoneOtp(phoneNumber, otp);
      
      if (result.success) {
        toast.success("Verificación exitosa.");
        console.log("Login successful, redirecting to home-user");
        navigate("/home-user");
      } else {
        toast.error(result.error || "Error al verificar el código.");
      }
    } catch (error: any) {
      console.error("Error al verificar OTP:", error);
      toast.error(error.message || "Error al verificar el código.");
    } finally {
      setLoading(false);
    }
  };

  // Clases reutilizables
  const inputBaseClasses = "w-full py-3 px-4 rounded-lg bg-slate-50 border border-gray-300 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors";
  const primaryButtonClasses = "w-full py-3 px-4 rounded-lg text-white font-semibold text-base shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center justify-center";
  const tabButtonClasses = "flex-1 py-2 px-4 font-medium rounded-t-lg transition-colors";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <main className='flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28'>
        <ToastContainer position={isMobile ? "bottom-center" : "top-right"} autoClose={3500} theme="light" />
        <div className={`flex bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-4xl lg:max-w-5xl overflow-hidden ${isMobile ? "flex-col" : "flex-row"}`}>
          
          {!isMobile && (
            <div className="w-1/2 md:w-5/12 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 p-8 lg:p-12 rounded-l-2xl sm:rounded-l-3xl">
              <img src={imagenLogin} alt="Login" className="object-contain w-full h-auto max-h-[600px] rounded-lg"/>
            </div>
          )}

          <div className={`flex flex-col justify-center p-6 sm:p-8 md:p-10 ${isMobile ? "w-full" : "w-1/2 md:w-7/12"}`}>
            <div className="text-center sm:text-left mb-4">
              <h2 className="font-bold text-2xl sm:text-3xl text-neutral-800">Iniciar Sesión</h2>
              <p className="text-sm mt-2 text-neutral-600">
                Accede a tu cuenta de Q-Manager
              </p>
            </div>

            {/* Auth Method Tabs */}
            <div className="flex mb-6 border-b border-gray-200">
              <button
                className={`${tabButtonClasses} ${authMethod === 'email' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => {
                  setAuthMethod('email');
                  setOtpSent(false);
                }}
              >
                Email
              </button>
              <button
                className={`${tabButtonClasses} text-gray-400 cursor-not-allowed`}
                disabled={true}
                title="Función temporalmente deshabilitada"
              >
                Teléfono
                <span className="ml-1 text-xs">(Próximamente)</span>
              </button>
            </div>

            {authMethod === 'email' && (
              <form onSubmit={handleEmailLogin} className='flex flex-col w-full space-y-5'>
                <div>
                  <label htmlFor="email" className="sr-only">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputBaseClasses}
                    disabled={loading}
                  />
                </div>

                <div className="relative">
                  <label htmlFor="password" className="sr-only">Contraseña</label>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputBaseClasses} pr-10`}
                    disabled={loading}
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

                <button
                  type="submit"
                  disabled={loading}
                  className={`${primaryButtonClasses} ${loading ? 'bg-neutral-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      Iniciando sesión...
                    </>
                  ) : "Iniciar Sesión"}
                </button>

                <div className="mt-4 text-center">
                  <button
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    onClick={() => navigate("/recover-password")}
                    type="button"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </form>
            )}

            {authMethod === 'phone' && !otpSent && (
              <form onSubmit={handleSendOtp} className='flex flex-col w-full space-y-5'>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Función temporalmente deshabilitada
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>El inicio de sesión por SMS está temporalmente deshabilitado mientras configuramos el servicio. Por favor, use su correo electrónico para iniciar sesión.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="sr-only">Número de Teléfono</label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Número de teléfono (ej: +573001234567)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`${inputBaseClasses} opacity-50`}
                    disabled={true}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Función temporalmente no disponible
                  </p>
                </div>

                <button
                  type="button"
                  disabled={true}
                  className={`${primaryButtonClasses} bg-neutral-400 cursor-not-allowed opacity-50`}
                >
                  Función deshabilitada
                </button>
              </form>
            )}

            {authMethod === 'phone' && otpSent && (
              <form onSubmit={handleVerifyOtp} className='flex flex-col w-full space-y-5'>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    Ingresa el código de verificación
                  </label>
                  <input
                    id="otp"
                    type="text"
                    placeholder="Código de 6 dígitos"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={inputBaseClasses}
                    disabled={loading}
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                </div>

                <div className="flex justify-between">
                  <button 
                    type="button" 
                    onClick={() => setOtpSent(false)}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                    disabled={loading}
                  >
                    Cambiar número
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSendOtp}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                    disabled={loading}
                  >
                    Reenviar código
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${primaryButtonClasses} ${loading ? 'bg-neutral-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      Verificando...
                    </>
                  ) : "Verificar código"}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">¿No tienes una cuenta? </span>
              <button 
                type="button"
                onClick={() => navigate("/signup")}
                className="font-medium text-indigo-600 hover:text-indigo-800"
              >
                Regístrate
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginForm;