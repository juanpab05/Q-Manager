import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import supabase from '@/services/supabase';
import useMediaQuery from '@/hooks/useMediaQuery';
import 'react-toastify/dist/ReactToastify.css';

const RecoverPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Por favor ingrese un correo electrónico válido.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      toast.success('Se ha enviado un correo de recuperación. Por favor, revise su bandeja de entrada.');
    } catch (error: any) {
      console.error('Error al enviar correo de recuperación:', error);
      toast.error(error.message || 'Error al enviar el correo de recuperación.');
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
          <h2 className="text-center text-2xl font-bold mb-6 text-gray-800">Recuperar Contraseña</h2>
          
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Ingrese su correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputBaseClasses}
                  disabled={loading}
                  required
                />
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
                      Enviando...
                    </span>
                  </>
                ) : "Enviar Correo de Recuperación"}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="text-green-600 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-lg font-medium">Correo enviado</p>
              </div>
              <p className="text-gray-600">
                Se ha enviado un correo a <span className="font-medium">{email}</span> con las instrucciones para restablecer su contraseña.
              </p>
              <p className="text-gray-500 text-sm">
                Si no recibe el correo en unos minutos, revise su carpeta de spam o solicite un nuevo correo.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Intentar con otro correo
              </button>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Volver a Iniciar Sesión
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecoverPasswordPage; 