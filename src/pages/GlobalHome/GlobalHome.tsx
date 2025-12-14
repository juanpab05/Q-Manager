import {Link } from "react-router-dom"; // Import Link
import useMediaQuery from "@/hooks/useMediaQuery";
import { useAuth } from "@/contexts/auth/AuthContext"; // Ensure useAuth is imported
import QueueStatusWidget from "@/components/QueueStatusWidget"; // Import the new widget
import AnnouncementsCarousel from "@/components/AnnouncementsCarousel/AnnouncementsCarousel";

// --- Updated modern icons ---
const UserFriendlyIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-md">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${className} text-white`}>
      <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clipRule="evenodd" />
    </svg>
  </div>
);

const TimeIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-md">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${className} text-white`}>
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
    </svg>
  </div>
);

const NotificationIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${className} text-white`}>
      <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
    </svg>
  </div>
);

// Feature Card Component
interface FeatureHighlightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureHighlightCard: React.FC<FeatureHighlightProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-4px]">
    <div className="mb-4 transform transition-transform hover:scale-110">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-neutral-700 mb-2 text-center">{title}</h3>
    <p className="text-neutral-600 text-sm text-center">{description}</p>
  </div>
);


export default function HomePage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const auth = useAuth(); // Use AuthContext

  const primaryButtonClasses = "py-3 px-8 rounded-lg text-white font-semibold text-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out";
  const secondaryButtonClasses = "py-3 px-8 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out";

  return (
    <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-blue-50 to-blue-100 p-4 sm:p-6">
      <div className={`flex flex-col ${isMobile ? "w-full max-w-xl" : "w-full max-w-6xl lg:max-w-7xl"} bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden`}>
        
        {/* Hero Section with Queue Widgets - Optimized Two Column Layout */}
        <div className="px-6 py-8 sm:px-10 sm:py-12 md:px-16 md:py-16 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-8 items-center">
            
            {/* Left Column - Welcome Message */}
            <div className="lg:col-span-2 flex flex-col justify-center text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-bold text-neutral-800 mb-4">
                Bienvenido a <span className="text-blue-600">Q-Manager</span>
              </h1>
              <p className="text-neutral-600 text-base sm:text-lg mb-6 max-w-lg mx-auto lg:mx-0">
                Optimiza tu tiempo con nuestro sistema de gestión de turnos. Una experiencia más ágil y ordenada para todos los usuarios.
              </p>

              {/* Botones de navegación */}
              <div className="flex flex-col gap-3 w-full justify-center lg:justify-start">
                {/* Use auth.isAuthenticated from AuthContext for conditional rendering */}
                {!auth.isAuthenticated ? (
                  <>
                    <Link
                      to="/login"
                      className={`${primaryButtonClasses} bg-blue-600 hover:bg-blue-700 text-center`}
                    >
                      Iniciar Sesión
                    </Link>
                    <Link
                      to="/signup"
                      className={`${secondaryButtonClasses} bg-transparent border-2 border-red-600 text-red-600 hover:bg-red-50 text-center`}
                    >
                      Regístrate
                    </Link>
                    <Link
                      to="/about"
                      className={`${secondaryButtonClasses} bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-center`}
                    >
                      Más sobre nosotros
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/home-user"
                      className={`${primaryButtonClasses} bg-green-500 hover:bg-green-600 text-center`}
                    >
                      Acceder al Sistema
                    </Link>
                    <Link
                      to="/about"
                      className={`${secondaryButtonClasses} bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-center`}
                    >
                      Más sobre nosotros
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column - Queue Status Widgets */}
            <div className="lg:col-span-3 flex flex-col space-y-6">
              <div className="text-center lg:text-left">
                <h2 className="text-xl sm:text-2xl font-semibold text-neutral-800 mb-3">
                  Estado de la Cola 
                </h2>
                <p className="text-neutral-600 text-sm sm:text-base mb-6">
                  Ve qué tickets están siendo atendidos en tiempo real.
                </p>
              </div>
              
              <div className="space-y-4">
                {/* Widget principal con estilo carousel - más compacto */}
                <QueueStatusWidget 
                  variant="carousel" 
                  showUserTicket={auth.isAuthenticated}
                  className="w-full"
                />
                
              
              </div>

            </div>
            
          </div>
          
        </div>
 
        <div className="px-10 py-12 sm:px-10 sm:py-12 md:px-16 md:py-16 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300">
          {/* Componente de anuncios ajustado al tamaño del widget */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 w-full max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-800">Anuncios</h4>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs text-gray-500">En vivo</span>
                    </div>
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <AnnouncementsCarousel />
                  </div>
                </div>
        </div>

        {/* Sección de Beneficios para Usuarios */}
        <div className="px-6 py-10 sm:px-10 sm:py-16 md:px-16 md:py-20 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 border-t border-slate-200">
          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-800 mb-10 sm:mb-12 text-center">
            Mejora tu experiencia como usuario
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <FeatureHighlightCard
              icon={<UserFriendlyIcon className="w-8 h-8" />}
              title="Fácil de Usar"
              description="Solicita tu turno en segundos, sin filas físicas iniciales y sin necesidad de complicados procedimientos."
            />
            <FeatureHighlightCard
              icon={<TimeIcon className="w-8 h-8" />}
              title="Libertad de Movimiento"
              description="Conoce tu tiempo de espera estimado y aprovéchalo como prefieras, sin estar atado a una sala de espera."
            />
            <FeatureHighlightCard
              icon={<NotificationIcon className="w-8 h-8" />}
              title="Notificaciones Oportunas"
              description="Recibe alertas cuando tu turno se acerque, permitiéndote llegar justo a tiempo para ser atendido."
            />
          </div>
        </div>
      </div>
    </section>
  );
}