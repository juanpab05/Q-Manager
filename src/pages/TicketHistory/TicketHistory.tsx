import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { getMyTickets } from '@/api/ticketService';
import { TicketResponseData } from '@/api/types.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TicketHistoryPage: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketResponseData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate('/login'); return;
    }
    const fetchTickets = async () => {
      setLoading(true); setError(null);
      try {
        const data = await getMyTickets();
        setTickets(data);
      } catch (err: any) {
        const msg = err.response?.data?.detail || err.message;
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [auth, navigate]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });

  const goBack = () => navigate('/home-user');

  // styles
  const secondaryBtn = "py-2 px-5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <main className="flex items-center justify-center pt-24 pb-12 px-4 text-center">
          <p className="text-xl text-neutral-600">Cargando historial de tickets...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <button onClick={goBack} className={`${secondaryBtn} bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mb-8`}>
          Regresar
        </button>
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-neutral-800 text-center">Historial de Tickets</h1>

        {error && (
          <div role="alert" className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow mb-6 text-center">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        {!tickets.length && !error && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-xl text-neutral-600">No tienes turnos en tu historial.</p>
            <p className="text-neutral-500 mt-2">Puedes solicitar un nuevo turno desde el menú principal.</p>
          </div>
        )}

        {tickets.length > 0 && (
          <div className="overflow-x-auto bg-white shadow-xl rounded-xl">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Servicio</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Fecha Solicitud</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Modalidad</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">
                      {ticket.ticket_number}
                      {ticket.is_priority && <span className="ml-2 px-2 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Prioritario</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{ticket.service}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center justify-center w-28 ${
                        ticket.status === 'PENDIENTE' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                          : 'bg-green-100 text-green-800 border border-green-300'
                      }`}>
                        {/* Icon for pending */}
                        {ticket.status === 'PENDIENTE' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {/* Icon for attended */}
                        {ticket.status === 'ATENDIDO' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {ticket.status_display || ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{formatDate(ticket.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{ticket.modality_display || ticket.modality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default TicketHistoryPage;
