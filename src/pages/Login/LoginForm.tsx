import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useAuth } from "@/contexts/auth/AuthContext";
import imagenLogin from "@/assets/formsImage.png";
import "react-toastify/dist/ReactToastify.css";

// Iconos reutilizados del formulario de registro
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