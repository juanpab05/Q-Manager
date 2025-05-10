import {Link } from "react-router-dom"; // Import Link
import useMediaQuery from "@/hooks/useMediaQuery";
import { useAuth } from "@/contexts/auth/AuthContext"; // Ensure useAuth is imported

// --- Iconos SVG ---
const LightBulbIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.354a15.055 15.055 0 0 1-4.5 0M10.5 14.25h3M12 14.25a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v5.25a2.25 2.25 0 0 0 2.25 2.25m2.25-2.25a2.25 2.25 0 0 1-2.25-2.25M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const ClockIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const CogIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15.036-7.126A11.956 11.956 0 0 1 12 2.25c1.993 0 3.717.62 5.286 1.626m-.002 12.246A11.952 11.952 0 0 1 12 21.75c-1.993 0-3.717-.62-5.286-1.626M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

// Feature Card Component
interface FeatureHighlightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureHighlightCard: React.FC<FeatureHighlightProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center p-6 bg-indigo-50 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
    <div className="text-indigo-600 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-neutral-700 mb-2">{title}</h3>
    <p className="text-neutral-600 text-sm text-center">{description}</p>
  </div>
);


export default function HomePage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const auth = useAuth(); // Use AuthContext

  const primaryButtonClasses = "py-3 px-8 rounded-lg text-white font-semibold text-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out";
  const secondaryButtonClasses = "py-3 px-8 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out";

  return (
    <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6">
      <div className={`flex flex-col ${isMobile ? "w-full max-w-xl" : "w-full max-w-4xl lg:max-w-5xl"} bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden`}>
        
        {/* Hero Section */}
        <div className="flex flex-col justify-center items-center text-center px-6 py-10 sm:px-10 sm:py-16 md:px-16 md:py-20 bg-white"> {/* Removed gradient from here for cleaner card */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-800 mb-6">
            Bienvenido a <span className="text-indigo-600">Q-Manager</span>
          </h1>
          <p className="text-neutral-600 text-base sm:text-lg mb-8 max-w-xl lg:max-w-2xl mx-auto">
            Gestiona usuarios, crea turnos y organiza el flujo de atención de manera eficiente, rápida y sin complicaciones. ¡Todo bajo tu control!
          </p>

          {/* Botones de navegación */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto justify-center items-center">
            <Link
              to="/about" // Use Link for navigation
              className={`${secondaryButtonClasses} bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50`}
            >
              Más sobre nosotros
            </Link>

            {/* Use auth.isAuthenticated from AuthContext for conditional rendering */}
            {!auth.isAuthenticated ? (
              <>
                <Link
                  to="/register-user" // Link to the new registration page
                  className={`${secondaryButtonClasses} bg-transparent border-2 border-purple-600 text-purple-600 hover:bg-purple-50`}
                >
                  Regístrate
                </Link>
                <Link
                  to="/login" // Use Link for navigation
                  className={`${primaryButtonClasses} bg-indigo-600 hover:bg-indigo-700`}
                >
                  Iniciar Sesión
                </Link>
              </>
            ) : (
              <Link
                to="/home-user" // Use Link for navigation
                className={`${primaryButtonClasses} bg-green-500 hover:bg-green-600`} // Changed color for logged in state
              >
                Acceder al Sistema
              </Link>
            )}
          </div>
        </div>

        {/* Sección de Características Clave */}
        <div className="px-6 py-10 sm:px-10 sm:py-16 md:px-16 md:py-20 bg-slate-50 border-t border-slate-200">
          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-800 mb-10 sm:mb-12 text-center">
            ¿Por qué elegir nuestro sistema?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <FeatureHighlightCard
              icon={<LightBulbIcon className="w-10 h-10 sm:w-12 sm:h-12" />}
              title="Intuitivo y Fácil de Usar"
              description="Diseñado para una experiencia de usuario fluida, permitiendo gestionar turnos y usuarios sin complicaciones."
            />
            <FeatureHighlightCard
              icon={<ClockIcon className="w-10 h-10 sm:w-12 sm:h-12" />}
              title="Eficiencia y Rapidez"
              description="Optimiza tu tiempo y recursos con nuestra herramienta, garantizando procesos ágiles y una atención rápida."
            />
            <FeatureHighlightCard
              icon={<CogIcon className="w-10 h-10 sm:w-12 sm:h-12" />}
              title="Control Total"
              description="Mantén todo organizado y bajo control, desde la creación de usuarios hasta la gestión detallada de los puntos de atención."
            />
          </div>
        </div>
      </div>
    </section>
  );
}