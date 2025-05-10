// src/pages/RequestTicketPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext'; 
import { requestTicket, checkPendingTicket } from '@/api/ticketService';
import { TicketRequestData } from '@/api/types';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useMediaQuery from '@/hooks/useMediaQuery';
import supabase from '@/utils/supabaseClient';

// Icono de Spinner (opcional, el botón ya tiene un SVG en línea)
// const SpinnerIcon = ({className = "animate-spin h-5 w-5 text-white"}: {className?: string}) => (
//   <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//   </svg>
// );

const SERVICE_VALUE_OTHER = 'OTRO_SERVICIO_PERSONALIZADO';
const serviceOptions = [
  { value: 'ASESORIA', label: 'Asesoría General' },
  { value: 'PAGO_FACTURA', label: 'Pago de Factura' },
  { value: 'RADICACION', label: 'Radicación de Documentos' },
  { value: 'CONSULTA', label: 'Consulta Específica' },
  { value: SERVICE_VALUE_OTHER, label: 'Otro' },
];

interface SuccessData {
  ticketNumber: string;
}

interface PendingTicketData {
  id: number;
  ticket_number: string;
  service: string;
}

const RequestTicketPage: React.FC = () => {
  const authContext = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // --- Estados ---
  const [selectedServiceValue, setSelectedServiceValue] = useState<string>('');
  const [customServiceText, setCustomServiceText] = useState<string>('');
  const [showCustomServiceInput, setShowCustomServiceInput] = useState<boolean>(false);
  const [selectedModality, setSelectedModality] = useState<'VIRTUAL' | 'PRESENCIAL'>('PRESENCIAL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [pendingTicket, setPendingTicket] = useState<PendingTicketData | null>(null);
  const [isCheckingPendingTicket, setIsCheckingPendingTicket] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = () => {
      if (!authContext || !authContext.isAuthenticated) {
        console.warn('RequestTicketPage: Usuario no autenticado o contexto no disponible, redirigiendo a /login');
        navigate('/login');
        return false;
      }
      return true;
    };

    const checkExistingTicket = async () => {
      if (!checkAuth()) return;
      
      setIsCheckingPendingTicket(true);
      try {
        const { hasPendingTicket, pendingTicket } = await checkPendingTicket();
        
        if (hasPendingTicket && pendingTicket) {
          setPendingTicket({
            id: pendingTicket.id,
            ticket_number: pendingTicket.ticket_number,
            service: pendingTicket.service
          });
        } else {
          setPendingTicket(null);
        }
      } catch (error) {
        console.error('Error al verificar tickets pendientes:', error);
        toast.error('No se pudo verificar si ya tiene tickets pendientes');
      } finally {
        setIsCheckingPendingTicket(false);
      }
    };

    // Check user priority status
    const checkPriorityStatus = async () => {
      try {
        if (authContext.userProfile?.actor) {
          console.log('User priority status from profile:', authContext.userProfile.actor.has_priority);
        } else {
          console.log('User profile does not have actor data, checking API...');
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Check actor table directly
            const { data: actorData, error } = await supabase
              .from('actors')
              .select('has_priority, motive')
              .eq('user_id', user.id)
              .single();
              
            if (error && error.code !== 'PGRST116') {
              console.error('Error fetching user priority status:', error);
            } else if (actorData) {
              console.log('User priority status from API:', actorData.has_priority);
            } else {
              console.log('No actor data found for user');
            }
          }
        }
      } catch (error) {
        console.error('Error checking priority status:', error);
      }
    };
    
    checkPriorityStatus();

    checkAuth();
    checkExistingTicket();
  }, [authContext, navigate]);

  const handleServiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedServiceValue(value);
    setShowCustomServiceInput(value === SERVICE_VALUE_OTHER);
    if (value !== SERVICE_VALUE_OTHER) setCustomServiceText('');
  };

  const handleCustomServiceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomServiceText(event.target.value);
  };

  const handleModalityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedModality(event.target.value as 'VIRTUAL' | 'PRESENCIAL');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Verificar de nuevo si hay un ticket pendiente antes de enviar
    try {
      const { hasPendingTicket } = await checkPendingTicket();
      if (hasPendingTicket) {
        toast.error("Ya tiene un ticket pendiente. No puede solicitar otro hasta que sea atendido.");
        // Recargar la página para mostrar el ticket pendiente
        window.location.reload();
        return;
      }
    } catch (error) {
      console.error('Error al verificar tickets pendientes:', error);
    }

    let serviceToSend = selectedServiceValue;
    if (selectedServiceValue === SERVICE_VALUE_OTHER) {
      if (!customServiceText.trim()) {
        toast.warn('Por favor, especifique el servicio personalizado.');
        return;
      }
      serviceToSend = customServiceText.trim();
    } else if (!selectedServiceValue) {
      toast.warn('Por favor, seleccione un servicio.');
      return;
    }
    if (!selectedModality) {
        toast.warn('Por favor, seleccione una modalidad.');
        return;
    }

    setIsLoading(true);
    setSuccessData(null);

    if (!authContext.user?.id) {
      toast.error("Error de autenticación: ID de usuario no encontrado.");
      setIsLoading(false);
      return;
    }

    const userProfile = authContext.userProfile; // Get userProfile
    // Determine if the user/ticket is priority based on their profile
    const isPriority = userProfile?.actor?.has_priority || false;
    console.log('Is user priority?', isPriority, 'User profile:', userProfile);

    const payload: TicketRequestData = {
      service: serviceToSend,
      modality: selectedModality,
      user_id: authContext.user.id,
      is_priority: isPriority, // Pass is_priority in the payload
    };

    try {
      const response = await requestTicket(payload);
      setSuccessData({ ticketNumber: response.ticket_number });
      setSelectedServiceValue('');
      setCustomServiceText('');
      setShowCustomServiceInput(false);
      setSelectedModality('PRESENCIAL');
      toast.success("¡Turno solicitado con éxito!");
    } catch (err: any) {
      console.error('Fallo al solicitar ticket:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Error al solicitar ticket.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuccess = () => {
    setSuccessData(null);
    navigate('/home-user');
  };

  const handleGoBack = () => {
    navigate('/home-user');
  };

  // Clases base comunes para botones, ajustadas para consistencia
  const baseButtonStyles = "py-3 px-6 rounded-lg font-semibold text-base shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Si se muestra el mensaje de éxito
  if (successData) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'>
        <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'>
          <section className='flex flex-col items-center justify-center pt-24 pb-12 px-4'> {/* pt para Navbar */}
            <ToastContainer position={isMobile ? "bottom-center" : "top-right"} autoClose={3000} theme="light" />
            <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-xl p-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-green-600">¡Turno Solicitado!</h2>
              <p className="text-lg mb-4 text-neutral-700">Su número de turno asignado es:</p>
              <p className="text-4xl sm:text-5xl font-bold mb-8 text-indigo-600 bg-indigo-50 py-4 rounded-lg">
                {successData.ticketNumber}
              </p>
              <button
                onClick={handleAcceptSuccess}
                // Clases corregidas para el botón "Aceptar":
                // - w-full en móvil para centrado natural.
                // - sm:w-auto para que el ancho sea según contenido en desktop.
                // - sm:mx-auto para centrarlo horizontalmente en desktop.
                // - El resto son estilos base y de color primario.
                className={`
                  ${baseButtonStyles} 
                  w-full sm:w-auto sm:mx-auto 
                  bg-indigo-600 hover:bg-indigo-700 text-white 
                  focus:ring-indigo-500
                `}
              >
                Aceptar
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Si hay un ticket pendiente, mostrar mensaje
  if (pendingTicket) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'>
        <section className='flex flex-col items-center justify-center pt-24 pb-12 px-4'> {/* pt para Navbar */}
          <ToastContainer position={isMobile ? "bottom-center" : "top-right"} autoClose={3000} theme="light" />
          <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-xl p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-amber-600">Ticket Pendiente</h2>
            <p className="text-lg mb-4 text-neutral-700">Ya tiene un ticket pendiente por atender:</p>
            <p className="text-4xl sm:text-5xl font-bold mb-4 text-indigo-600 bg-indigo-50 py-4 rounded-lg">
              {pendingTicket.ticket_number}
            </p>
            <p className="text-md mb-8 text-neutral-600">Servicio: {pendingTicket.service}</p>
            <p className="text-sm mb-8 text-neutral-500">No puede solicitar un nuevo ticket hasta que éste sea atendido.</p>
            <button
              onClick={() => navigate('/home-user')}
              className={`
                ${baseButtonStyles} 
                w-full sm:w-auto sm:mx-auto 
                bg-indigo-600 hover:bg-indigo-700 text-white 
                focus:ring-indigo-500
              `}
            >
              Regresar al Inicio
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Si está cargando la verificación
  if (isCheckingPendingTicket) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'>
        <section className='flex flex-col items-center justify-center pt-24 pb-12 px-4'>
          <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-xl p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-neutral-800">Verificando...</h2>
            <div className="flex justify-center mb-6">
              <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-neutral-600">Comprobando si ya tiene un ticket pendiente...</p>
          </div>
        </section>
      </div>
    );
  }

  // Vista principal del formulario
  // Estas clases ahora usan la baseButtonStyles también
  const primaryButtonClasses = `${baseButtonStyles} w-full sm:w-auto sm:flex-grow-0 text-white flex items-center justify-center`;
  const secondaryButtonClasses = `${baseButtonStyles} w-full sm:w-auto sm:flex-grow-0`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <main className='flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28'>
        <ToastContainer position={isMobile ? "bottom-center" : "top-right"} autoClose={3000} theme="light" />
        <div className={`w-full ${isMobile ? "max-w-lg" : "max-w-xl"} bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 md:p-10`}>
          <h2 className="font-bold text-2xl sm:text-3xl text-center mb-8 text-neutral-800">Solicitar Turno</h2>
          <form onSubmit={handleSubmit} className='flex flex-col w-full gap-y-6'>
            {/* Selección de Servicio */}
            <div>
              <label htmlFor="service" className="block text-neutral-700 text-sm font-bold mb-2">
                Servicio Requerido:
              </label>
              <select
                id="service"
                value={selectedServiceValue}
                onChange={handleServiceChange}
                className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                required={!showCustomServiceInput}
              >
                <option value="" disabled>-- Por favor seleccione --</option>
                {serviceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Input para Servicio Personalizado */}
            {showCustomServiceInput && (
              <div>
                <label htmlFor="customService" className="block text-neutral-700 text-sm font-bold mb-2">
                  Especifique el servicio:
                </label>
                <input
                  type="text"
                  id="customService"
                  value={customServiceText}
                  onChange={handleCustomServiceChange}
                  className="w-full p-3 rounded-lg bg-slate-50 border border-gray-300 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: Consulta de saldo"
                  required
                />
              </div>
            )}

            {/* Selección de Modalidad */}
            <div>
              <label className="block text-neutral-700 text-sm font-bold mb-3">
                Modalidad de Atención:
              </label>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-6">
                <label htmlFor="virtual" className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors">
                  <input
                    type="radio"
                    id="virtual"
                    name="modality"
                    value="VIRTUAL"
                    checked={selectedModality === 'VIRTUAL'}
                    onChange={handleModalityChange}
                    className="form-radio h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-3 text-neutral-700">Virtual</span>
                </label>
                <label htmlFor="presencial" className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors">
                  <input
                    type="radio"
                    id="presencial"
                    name="modality"
                    value="PRESENCIAL"
                    checked={selectedModality === 'PRESENCIAL'}
                    onChange={handleModalityChange}
                    className="form-radio h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-3 text-neutral-700">Presencial</span>
                </label>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-center justify-center mt-6 gap-4">
              <button
                type="button"
                onClick={handleGoBack}
                className={`${secondaryButtonClasses} bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-100 focus:ring-indigo-500`}
              >
                Regresar
              </button>
              <button
                type="submit"
                disabled={isLoading || (!selectedServiceValue && !showCustomServiceInput) || (showCustomServiceInput && !customServiceText.trim())}
                className={`${primaryButtonClasses} ${
                  (isLoading || (!selectedServiceValue && !showCustomServiceInput) || (showCustomServiceInput && !customServiceText.trim()))
                    ? 'bg-neutral-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:ring-indigo-500`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Solicitando...
                  </>
                ) : ( 'Solicitar Turno' )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default RequestTicketPage;