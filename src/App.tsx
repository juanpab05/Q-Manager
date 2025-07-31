import './styles/App.css'
import { useState, useEffect } from 'react'
import AppRoutes from './routes/AppRoutes'
// import AuthProvider from '@/contexts/auth/AuthProvider' 
import { AuthProvider } from './contexts/auth/AuthContext'
import NotificationProvider from './contexts/NotificationContext'
import LoadingSpinner from '@/components/LoadingSpinner'
// Remove the FloatingQueueStatus import since we're moving it to AppRoutes

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  console.log("App: isInitialized", isInitialized);
  
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
          <LoadingSpinner message="Iniciando aplicación..." />
        )}
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App