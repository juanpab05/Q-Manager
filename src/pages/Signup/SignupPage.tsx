import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '@/services/supabase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useMediaQuery from '@/hooks/useMediaQuery';

// SVG Icons
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

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    hasPriority: false,
    priorityMotive: ''
  });
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    cedula: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    priorityMotive: ''
  });

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const validateForm = (): boolean => {
    const errors: any = {};
    
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es requerido.';
    else if (!/^[a-zA-ZÀ-ÿ\s']+$/.test(formData.nombre)) errors.nombre = 'El nombre solo debe contener letras.';
    
    if (!formData.cedula) errors.cedula = 'La cédula es requerida.';
    else if (!/^\d{7,10}$/.test(formData.cedula)) errors.cedula = 'La cédula debe tener entre 7 y 10 dígitos.';
    
    if (!formData.email) errors.email = 'El correo electrónico es requerido.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Correo electrónico inválido.';
    
    if (!formData.phoneNumber) errors.phoneNumber = 'El teléfono es requerido.';
    else if (!/^\d{7,15}$/.test(formData.phoneNumber)) errors.phoneNumber = 'El teléfono debe tener entre 7 y 15 dígitos.';
    
    if (!formData.password) errors.password = 'La contraseña es requerida.';
    else if (formData.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';
    
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden.';
    
    if (formData.hasPriority && !formData.priorityMotive) {
      errors.priorityMotive = 'Debe seleccionar un motivo de prioridad.';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      // First, register the user using Supabase Auth with email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmation=success`,
          data: {
            full_name: formData.nombre,
            cedula: formData.cedula,
            phone: formData.phoneNumber,
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("No se pudo crear el usuario");
      }

      // Store the registered email for the success message
      setRegisteredEmail(formData.email);
      
      // Set registration as successful - we'll save profile data after email confirmation
      setRegistrationSuccess(true);
      toast.success('¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.');
      
      // Don't attempt to save the profile data here since the user isn't authenticated yet
      // The profile data will be created after email confirmation and login
      console.log('Usuario creado exitosamente en Auth. ID:', authData.user.id);
      console.log('Se creará el perfil completo después de la confirmación del correo.');
      
    } catch (error: any) {
      console.error("SignupPage: Error during handleSubmit:", error);
      toast.error(error.message || 'Ocurrió un error durante el registro.');
    } finally {
      setLoading(false);
    }
  };
  
  const inputBaseClasses = "w-full py-3 px-4 rounded-lg bg-slate-50 border border-gray-300 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors";
  const primaryButtonClasses = "w-full py-3 px-4 rounded-lg text-white font-semibold text-base shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center justify-center";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <main className='flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28'>
        <ToastContainer position={isMobile ? "bottom-center" : "top-right"} autoClose={3500} theme="light" />
        <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-xl lg:max-w-2xl overflow-hidden`}>
          <div className={`flex flex-col justify-center p-6 sm:p-8 md:p-10 w-full`}>
            {!registrationSuccess ? (
              <form onSubmit={handleSubmit} className='flex flex-col w-full space-y-5'>
                <div className="text-center sm:text-left mb-4">
                  <h2 className="font-bold text-2xl sm:text-3xl text-neutral-800">Crea tu Cuenta</h2>
                  <p className="text-sm mt-2 text-neutral-600">
                    Ingresa tus datos para registrarte en Q-Manager.
                  </p>
                </div>

                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" className="sr-only">Nombre completo</label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    placeholder="Nombre Completo"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={inputBaseClasses}
                    required
                  />
                  {formErrors.nombre && <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>}
                </div>
                
                {/* Cédula */}
                <div>
                  <label htmlFor="cedula" className="sr-only">Cédula</label>
                  <input
                    id="cedula"
                    name="cedula"
                    type="text"
                    inputMode="numeric"
                    placeholder="Cédula (solo números)"
                    pattern="[0-9]*"
                    value={formData.cedula}
                    onChange={handleChange}
                    className={inputBaseClasses}
                    required
                  />
                  {formErrors.cedula && <p className="mt-1 text-sm text-red-600">{formErrors.cedula}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="sr-only">Correo Electrónico</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Correo Electrónico"
                    inputMode="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputBaseClasses}
                    required
                  />
                  {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                </div>
                
                {/* Teléfono */}
                <div>
                  <label htmlFor="phoneNumber" className="sr-only">Número de Teléfono</label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="Teléfono"
                    inputMode="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={inputBaseClasses}
                    required
                  />
                  {formErrors.phoneNumber && <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="sr-only">Contraseña</label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña (mínimo 8 caracteres)"
                      value={formData.password}
                      onChange={handleChange}
                      className={`${inputBaseClasses} pr-10`}
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-indigo-500 rounded-md"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                    {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">Confirmar Contraseña</label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmar Contraseña"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`${inputBaseClasses} pr-10`}
                      required
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-indigo-500 rounded-md"
                      aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                    {formErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Prioridad */}
                <div className="pt-2">
                  <label className="flex items-center text-sm text-neutral-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="hasPriority"
                      name="hasPriority"
                      checked={formData.hasPriority}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3"
                    />
                    Soy usuario prioritario
                  </label>
                  
                  {formData.hasPriority && (
                    <div className="mt-3 space-y-2">
                      <label htmlFor="priorityMotive" className="block text-neutral-700 text-sm font-medium">
                        Motivo de Prioridad:
                      </label>
                      <select
                        id="priorityMotive"
                        name="priorityMotive"
                        value={formData.priorityMotive}
                        onChange={handleChange}
                        className={`${inputBaseClasses} appearance-none`}
                        required={formData.hasPriority}
                      >
                        <option value="">Seleccione un motivo</option>
                        <option value="A">Mujer embarazada</option>
                        <option value="B">Persona con movilidad reducida</option>
                        <option value="C">Adulto mayor (tercera edad)</option>
                        <option value="D">Otro caso que requiera prioridad</option>
                      </select>
                      {formErrors.priorityMotive && <p className="mt-1 text-sm text-red-600">{formErrors.priorityMotive}</p>}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className={`${primaryButtonClasses} ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  disabled={loading}
                >
                  {loading ? 'Registrando...' : 'Crear Cuenta'}
                </button>
                
                <div className="text-center text-sm text-neutral-600 pt-2">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
                    Inicia Sesión aquí
                  </Link>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="text-green-600 flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-lg font-medium">¡Registro Exitoso!</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold text-blue-800">Importante: Confirma tu correo</span>
                  </div>
                  <p className="text-blue-700 mb-2 text-sm">
                    Te hemos enviado un correo a <span className="font-medium">{registeredEmail}</span> con un enlace de confirmación.
                  </p>
                  <p className="text-blue-700 text-sm">
                    <strong>Debes hacer clic en el enlace para activar tu cuenta</strong> antes de poder iniciar sesión.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">
                    Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado.
                  </p>
                  <p className="text-gray-600 text-sm">
                    El enlace de confirmación expirará en 24 horas.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className={`${primaryButtonClasses} bg-indigo-600 hover:bg-indigo-700`}
                >
                  Ir a Iniciar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignupPage; 