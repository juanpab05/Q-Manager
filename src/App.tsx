import './styles/App.css'
import { useState, useEffect } from 'react'
import AppRoutes from './routes/AppRoutes'
// import AuthProvider from '@/contexts/auth/AuthProvider' 
import { AuthProvider } from './contexts/auth/AuthContext'
import NotificationProvider from './contexts/NotificationContext'

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Simulamos un pequeño retraso para asegurar que los contextos se inicialicen correctamente
    const initTimer = setTimeout(() => {
      setIsInitialized(true);
    }, 300);
    
    return () => {
      clearTimeout(initTimer);
    };
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        {isInitialized ? (
          <AppRoutes />
        ) : (
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
              <p className="text-lg text-indigo-800">Iniciando aplicación...</p>
            </div>
          </div>
        )}
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App