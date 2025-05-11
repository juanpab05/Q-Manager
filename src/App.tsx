import './styles/App.css'
import AppRoutes from './routes/AppRoutes'
// import AuthProvider from '@/contexts/auth/AuthProvider' 
import { AuthProvider } from './contexts/auth/AuthContext'
import NotificationProvider from './contexts/NotificationContext'

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes/>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App