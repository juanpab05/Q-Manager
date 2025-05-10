import './styles/App.css'
import AppRoutes from './routes/AppRoutes'
// import AuthProvider from '@/contexts/auth/AuthProvider' 
import { AuthProvider } from '@/contexts/auth/AuthContext'

function App() {
  return (
    <AuthProvider>
      <AppRoutes/>
    </AuthProvider>
  )
}

export default App