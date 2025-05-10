import React, { useState } from 'react';
import { auth } from '../services/supabase';

const TestAuth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const createTestUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1. Create user in Supabase Auth
      const { data, error } = await auth.signUp(email, password);
      
      if (error) {
        setMessage(`Error al crear usuario: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data?.user?.id) {
        setMessage('Error: No se pudo obtener el ID del usuario');
        setLoading(false);
        return;
      }

      const userId = data.user.id;
      
      // 2. Mensaje de confirmación
      setMessage(`
        Usuario creado correctamente en auth.users con ID: ${userId}
        
        Para completar la configuración, ejecuta este SQL en la consola de Supabase:
        
        -- Insertar en public.users
        INSERT INTO public.users (
          id, nombre, cedula, email, phone_number, is_staff, password, is_superuser
        ) VALUES (
          '${userId}', 
          '${nombre}', 
          ${parseInt(cedula)}, 
          '${email}', 
          '${phone}', 
          TRUE, 
          'migrated_password', 
          TRUE
        );
        
        -- Insertar en public.workers
        INSERT INTO public.workers (
          user_id, code, is_admin
        ) VALUES (
          '${userId}', 
          'ADM${cedula.substring(0, 4)}', 
          TRUE
        );
      `);
      
    } catch (err: any) {
      setMessage(`Error inesperado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // También prueba el método de login para verificar las credenciales
  const testLogin = async () => {
    if (!email || !password) {
      setMessage('Debes ingresar email y contraseña para probar el login');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        setMessage(`Error al iniciar sesión: ${error.message}`);
        return;
      }
      
      if (data?.user) {
        setMessage(`Login exitoso como: ${data.user.email}`);
      } else {
        setMessage('Login fallido por razones desconocidas');
      }
    } catch (err: any) {
      setMessage(`Error en login: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Crear Usuario de Prueba (Admin)</h2>
      
      {message && (
        <div className={`p-3 mb-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} whitespace-pre-wrap`}>
          {message}
        </div>
      )}
      
      <form onSubmit={createTestUser}>
        <div className="mb-4">
          <label className="block mb-1">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Nombre Completo:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Cédula:</label>
          <input
            type="number"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Teléfono:</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
          
          <button
            type="button"
            onClick={testLogin}
            disabled={loading}
            className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            Probar Login
          </button>
        </div>
      </form>
      
      <div className="mt-6 p-4 bg-yellow-50 rounded border border-yellow-200">
        <h3 className="font-bold text-lg mb-2">Instrucciones:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Crea un usuario con el formulario</li>
          <li>Copia el SQL generado</li>
          <li>Ve a la <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">consola de Supabase</a> y ejecuta el SQL en el SQL Editor</li>
          <li>Regresa a esta página y prueba el login con las credenciales</li>
        </ol>
      </div>
    </div>
  );
};

export default TestAuth; 