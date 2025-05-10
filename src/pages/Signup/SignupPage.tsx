import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '@/services/supabase'; // Assuming supabase service is here
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
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
          emailRedirectTo: `${window.location.origin}/login`,
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
  
  // Basic styling, can be enhanced with Tailwind similar to your other pages
  const inputClasses = "w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
  const buttonClasses = "w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300";


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Crear una cuenta
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          {!registrationSuccess ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                  Nombre completo
                </label>
                <div className="mt-1">
                  <input id="nombre" name="nombre" type="text" required className={inputClasses} onChange={handleChange} value={formData.nombre} />
                  {formErrors.nombre && <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>}
                </div>
              </div>
              
              <div>
                <label htmlFor="cedula" className="block text-sm font-medium text-gray-700">
                  Cédula
                </label>
                <div className="mt-1">
                  <input id="cedula" name="cedula" type="text" required className={inputClasses} onChange={handleChange} value={formData.cedula} />
                  {formErrors.cedula && <p className="mt-1 text-sm text-red-600">{formErrors.cedula}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <div className="mt-1">
                  <input id="email" name="email" type="email" autoComplete="email" required className={inputClasses} onChange={handleChange} value={formData.email} />
                  {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                </div>
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Número de Teléfono
                </label>
                <div className="mt-1">
                  <input id="phoneNumber" name="phoneNumber" type="tel" required className={inputClasses} onChange={handleChange} value={formData.phoneNumber} />
                  {formErrors.phoneNumber && <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="mt-1">
                  <input id="password" name="password" type="password" autoComplete="new-password" required className={inputClasses} onChange={handleChange} value={formData.password} />
                  {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Contraseña
                </label>
                <div className="mt-1">
                  <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className={inputClasses} onChange={handleChange} value={formData.confirmPassword} />
                  {formErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>}
                </div>
              </div>

              {/* Prioridad */}
              <div className="mt-4">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="hasPriority" 
                    name="hasPriority" 
                    checked={formData.hasPriority} 
                    onChange={handleChange} 
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasPriority" className="ml-2 block text-sm font-medium text-gray-700">
                    Usuario Prioritario
                  </label>
                </div>
                
                {formData.hasPriority && (
                  <div className="mt-2">
                    <label htmlFor="priorityMotive" className="block text-sm font-medium text-gray-700">
                      Motivo de Prioridad
                    </label>
                    <select
                      id="priorityMotive"
                      name="priorityMotive"
                      value={formData.priorityMotive}
                      onChange={handleChange}
                      className={`${inputClasses} mt-1`}
                    >
                      <option value="">Seleccione un motivo</option>
                      <option value="A">Mujer embarazada</option>
                      <option value="B">Persona con movilidad reducida</option>
                      <option value="C">Adulto mayor</option>
                      <option value="D">Otro</option>
                    </select>
                    {formErrors.priorityMotive && <p className="mt-1 text-sm text-red-600">{formErrors.priorityMotive}</p>}
                  </div>
                )}
              </div>

              <div>
                <button type="submit" className={buttonClasses} disabled={loading}>
                  {loading ? 'Registrando...' : 'Crear cuenta'}
                </button>
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
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          )}
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">¿Ya tienes una cuenta?</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 