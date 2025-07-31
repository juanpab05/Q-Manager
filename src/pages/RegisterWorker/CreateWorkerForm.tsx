import React, { useState, useEffect } from 'react';
// import imgRegister from '@/assets/imagenCreateUser.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useMediaQuery from '@/hooks/useMediaQuery';
import { registerUser, UserRegistrationData, cleanupWorkersFromActors } from '@/api/userService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';

// Iconos SVG
const EyeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
  </svg>
);

const EyeSlashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38c.145-.382.145-.806 0-1.188a10.01 10.01 0 0 0-2.29-3.577l-1.521-1.522a10.007 10.007 0 0 0-1.53-.962L3.28 2.22ZM7.75 7.25c0-.219.029-.43.084-.635l1.972 1.972a2.5 2.5 0 0 1-.635.084A2.5 2.5 0 0 1 7.5 10a2.5 2.5 0 0 1 1.637-2.353L7.75 7.25Z" clipRule="evenodd" />
    <path d="m10.748 13.93 1.523 1.523a9.987 9.987 0 0 1-1.523.962A10.007 10.007 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41a1.652 1.652 0 0 1 0-1.188A10.007 10.007 0 0 1 2.94 6.095l-1.546-1.546A11.508 11.508 0 0 0 .006 9.41a1.651 1.651 0 0 0 0 1.186A11.479 11.479 0 0 0 10 18.5c1.905 0 3.7-.462 5.29-.126L10.748 13.93Z" />
  </svg>
);
// --- ---

function generarContraseña(longitud: number): string {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let contraseña = "";
    for (let i = 0; i < longitud; i++) {
      const indice = Math.floor(Math.random() * caracteres.length);
      contraseña += caracteres[indice];
    }
    return contraseña;
}

const CreateWorkerForm = () => {
    const [nombre, setNombre] = useState("");
    const [cedula, setCedula] = useState("");
    const [telefono, setTelefono] = useState("");
    const [email, setEmail] = useState("");
    const [contraseña, setContraseña] = useState(""); // Se llenará solo con el generador
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    const isMobile = useMediaQuery("(max-width: 768px)");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const auth = useAuth();

    useEffect(() => {
        async function checkPermissions() {
            setInitialLoading(true);
        if (!auth || !auth.isAuthenticated) {
            console.warn('CreateWorkerForm: Usuario no autenticado o contexto no disponible, redirigiendo...');
            navigate('/login');
            return;
        }

            // Verificar si el usuario es un superusuario antes de permitir acceso
            if (auth.userProfile && !auth.userProfile.is_superuser) {
                console.warn('CreateWorkerForm: Usuario no tiene permisos de administrador');
                setPermissionError("No tienes permisos para registrar trabajadores. Se requiere ser administrador.");
            }
            setInitialLoading(false);
        }
        
        checkPermissions();
    }, [auth, navigate]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const manejadorContrasena = () => {
        const contraGenerada = generarContraseña(12); // Genera contraseña de 12 caracteres
        setContraseña(contraGenerada);
        setShowPassword(true); // Mostrar la contraseña generada automáticamente
        toast.info("Nueva contraseña generada y mostrada.");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // La validación de contraseña ahora se centra en si fue generada
        if (!nombre || !cedula || !telefono || !email || !contraseña) {
            toast.warn("Por favor complete todos los campos y genere una contraseña.");
            return;
        }
        // ... (otras validaciones se mantienen)
        if (nombre.trim().length < 3) {
            toast.warn("El nombre debe tener al menos 3 caracteres.");
            return;
        }
        if (cedula.length > 10 || !/^\d+$/.test(cedula)) {
            toast.warn("La cédula debe tener máximo 10 dígitos numéricos.");
            return;
        }
        if (!/^\d+$/.test(telefono) || telefono.length < 7 || telefono.length > 15) {
            toast.warn("Ingrese un número de teléfono válido.");
            return;
        }
        // Si la contraseña es generada por el sistema, su longitud será la definida (12)
        // La validación de `contraseña.length < 8` sigue siendo una buena práctica por si acaso.
        if (contraseña.length < 8) { 
            toast.error("Error en la generación de contraseña. Intente de nuevo."); // Mensaje más específico
            return;
        }

        setLoading(true);
        const payload: UserRegistrationData & { is_admin?: boolean } = {
            nombre: nombre,
            cedula: cedula,
            email: email,
            phone_number: telefono,
            password: contraseña,
            is_admin: false,
        };

        try {
            // Registrar el trabajador
            await registerUser(payload, 'worker');

            // Ejecutar la limpieza para asegurar que los trabajadores no estén en la tabla de actores
            try {
                const cleanupResult = await cleanupWorkersFromActors();
                if (cleanupResult.success && cleanupResult.workersRemoved > 0) {
                    console.log(`[CreateWorkerForm] Se eliminaron ${cleanupResult.workersRemoved} registros de trabajadores de la tabla actores`);
                }
            } catch (cleanupError) {
                // Solo log, no afecta la creación del trabajador
                console.error('[CreateWorkerForm] Error al limpiar trabajadores de la tabla actores:', cleanupError);
            }

            toast.success("Trabajador creado con éxito.");
            setNombre(""); setCedula(""); setTelefono(""); setEmail(""); setContraseña(""); setShowPassword(false);
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || "Ocurrió un error al crear el trabajador.";
            
            if (errorMessage.includes("permisos") || errorMessage.includes("superusuario") || errorMessage.includes("administrador")) {
                setPermissionError(errorMessage);
                toast.error("No tienes permisos para registrar trabajadores.");
            } else {
            toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const primaryButtonClasses = "w-full py-3 px-4 rounded-lg text-white font-semibold text-base shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center justify-center";
    const utilityButtonClasses = "w-full py-2 px-4 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 ease-in-out";

    // Mostrar mensaje de carga o error de permisos
    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <p className="text-neutral-600">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    if (permissionError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-red-600 mb-4">Error de permisos</h2>
                    <p className="text-neutral-600">{permissionError}</p>
                    <button 
                        onClick={() => navigate('/home-user')}
                        className={`${primaryButtonClasses} mt-6 bg-indigo-600 hover:bg-indigo-700`}
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <main className='flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28'>
                <ToastContainer position={isMobile ? "bottom-center" : "top-right"} autoClose={3500} theme="light" />
                <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-xl lg:max-w-2xl overflow-hidden`}>
                    <div className={`flex flex-col justify-center p-6 sm:p-8 md:p-10 w-full`}>
                        <form onSubmit={handleSubmit} className='flex flex-col w-full space-y-5'>
                            <div className="text-center sm:text-left mb-4">
                                <h2 className="font-bold text-2xl sm:text-3xl text-neutral-800">Registrar Nuevo Trabajador</h2>
                                <p className="text-sm mt-2 text-neutral-600">
                                    Completa los datos para añadir un nuevo miembro al equipo.
                                </p>
                            </div>
                            {[
                                { name: "nombre", type: "text", placeholder: "Nombre Completo", value: nombre, setter: setNombre, required: true },
                                { name: "cedula", type: "number", placeholder: "Cédula (solo números)", value: cedula, setter: setCedula, required: true, inputMode: "numeric", pattern: "[0-9]*" },
                                { name: "telefono", type: "tel", placeholder: "Teléfono", value: telefono, setter: setTelefono, required: true, inputMode: "tel" },
                                { name: "email", type: "email", placeholder: "Correo Electrónico", value: email, setter: setEmail, required: true, inputMode: "email" },
                            ].map(field => (
                                <div key={field.name}>
                                    <label htmlFor={field.name} className="sr-only">{field.placeholder}</label>
                                    <input
                                        id={field.name}
                                        type={field.type}
                                        name={field.name}
                                        placeholder={field.placeholder}
                                        value={field.value}
                                        onChange={(e) => field.setter(e.target.value)}
                                        inputMode={field.inputMode as any}
                                        pattern={field.pattern}
                                        className="w-full py-3 px-4 rounded-lg bg-slate-50 border border-gray-300 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                        required={field.required}
                                    />
                                </div>
                            ))}
                            <div>
                                <label htmlFor="contraseñaForm" className="block text-neutral-700 text-sm font-bold mb-1">
                                    Contraseña Generada:
                                </label>
                                <p className="text-xs text-neutral-500 mb-2">
                                    La contraseña se generará automáticamente y se mostrará aquí.
                                </p>
                                <div className="relative">
                                    <input
                                        id="contraseñaForm"
                                        className="w-full py-3 px-4 pr-10 rounded-lg bg-slate-100 border border-gray-300 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Contraseña (generada por el sistema)"
                                        value={contraseña}
                                        readOnly // Campo de solo lectura
                                        // No se necesita onChange si es readOnly para el usuario
                                        required // Sigue siendo requerida para el envío del formulario
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-indigo-500 rounded-md"
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        disabled={!contraseña} // Deshabilitar si no hay contraseña generada
                                    >
                                        {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className={`${utilityButtonClasses} mt-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1`}
                                    onClick={manejadorContrasena}
                                >
                                    Generar Contraseña Segura
                                </button>
                            </div>
                            
                            <div className="space-y-4 pt-4">
                                <button
                                    type="submit"
                                    className={`${primaryButtonClasses} bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${loading && 'opacity-70 cursor-not-allowed'}`}
                                    disabled={loading}
                                >
                                    {loading ? "Creando trabajador..." : "Crear Trabajador"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CreateWorkerForm;