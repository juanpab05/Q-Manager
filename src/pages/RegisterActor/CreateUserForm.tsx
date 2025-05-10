import React, { useState, useEffect } from 'react'; // Importado useEffect
import imgRegister from '@/assets/imagenCreateUser.png';
import useMediaQuery from '@/hooks/useMediaQuery';
import { registerUser, UserRegistrationData } from '@/api/userService'; // Usar registerUser de userService.js
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { useAuth } from '@/contexts/auth/AuthContext'; // Para proteger la ruta

// Iconos SVG (reutilizados o definidos aquí si no están en un archivo común)
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

const CreateUserForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isPriority, setIsPriority] = useState(false);
    const [contraseña, setContraseña] = useState("");
    const [loading, setLoading] = useState(false);

    const [nombre, setNombre] = useState("");
    const [cedula, setCedula] = useState("");
    const [telefono, setTelefono] = useState("");
    const [email, setEmail] = useState("");
    const [prioridadTipo, setPrioridadTipo] = useState<"A" | "B" | "C" | "D" | "">(""); // Tipado más estricto

    const isMobile = useMediaQuery("(max-width: 768px)");
    const navigate = useNavigate();
    const auth = useAuth(); // Para proteger la ruta y potencialmente verificar roles

    useEffect(() => {
        if (!auth || !auth.isAuthenticated) {
            console.warn('CreateUserForm: Usuario no autenticado o contexto no disponible, redirigiendo...');
            navigate('/login');
            return;
        }
        // Opcional: Verificación de rol si solo ciertos usuarios pueden registrar otros usuarios
        // if (auth.user?.role !== 'worker' && auth.user?.role !== 'admin') { // Ejemplo
        //     toast.error("No tienes permisos para acceder a esta página.");
        //     navigate('/home-user'); 
        // }
    }, [auth, navigate]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handlePriorityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsPriority(e.target.checked);
        if (!e.target.checked) {
            setPrioridadTipo(""); // Limpiar motivo si se desmarca prioridad
        }
    };

    const manejadorContrasena = () => {
        const contraGenerada = generarContraseña(12); // Genera contraseña de 12 caracteres
        setContraseña(contraGenerada);
        setShowPassword(true); // Mostrar la contraseña generada
        toast.info("Nueva contraseña generada y mostrada.");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!nombre || !cedula || !telefono || !email || !contraseña) {
            toast.warn("Por favor complete todos los campos y genere una contraseña.");
            return;
        }
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
        if (contraseña.length < 8) { // Longitud mínima segura
            toast.error("Error en la generación de contraseña. Intente de nuevo.");
            return;
        }
        if (isPriority && !prioridadTipo) {
            toast.warn("Debe seleccionar un motivo de prioridad si marcó la casilla.");
            return;
        }

        setLoading(true);
        const payload: UserRegistrationData = {
            nombre: nombre,
            cedula: cedula, // userService.js espera string para cedula si así se definió en UserRegistrationData
            email: email,
            phone_number: telefono,
            password: contraseña,
            has_priority: isPriority,
            motive: isPriority ? prioridadTipo : undefined,
            // Asegúrate de que todos los campos requeridos por UserRegistrationData estén aquí
        };

        try {
            // Llamar a registerUser especificando el tipo 'actor'
            await registerUser(payload, 'actor');
            toast.success("Usuario (Actor) registrado con éxito.");
            setNombre(""); setCedula(""); setTelefono(""); setEmail(""); setContraseña("");
            setIsPriority(false); setPrioridadTipo(""); setShowPassword(false);
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.response?.data?.message || "Ocurrió un error al registrar el usuario.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const primaryButtonClasses = "w-full py-3 px-4 rounded-lg text-white font-semibold text-base shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center justify-center";
    const utilityButtonClasses = "w-full py-2 px-4 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 ease-in-out";
    const inputBaseClasses = "w-full py-3 px-4 rounded-lg bg-slate-50 border border-gray-300 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors";


    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <main className='flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28'>
                <ToastContainer position={isMobile ? "bottom-center" : "top-right"} autoClose={3500} theme="light" />
                <div className={`flex bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-4xl lg:max-w-5xl overflow-hidden ${isMobile ? "flex-col" : "flex-row"}`}>
                    {!isMobile && (
                        <div className="w-1/2 md:w-5/12 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 p-8 lg:p-12 rounded-l-2xl sm:rounded-l-3xl">
                            <img src={imgRegister} alt="Registrar Usuario" className="object-contain w-full h-auto max-h-[600px] rounded-lg"/>
                        </div>
                    )}
                    <div className={`flex flex-col justify-center p-6 sm:p-8 md:p-10 ${isMobile ? "w-full" : "w-1/2 md:w-7/12"}`}>
                        <form onSubmit={handleSubmit} className='flex flex-col w-full space-y-5'>
                            <div className="text-center sm:text-left mb-4">
                                <h2 className="font-bold text-2xl sm:text-3xl text-neutral-800">Registrar Nuevo Usuario</h2>
                                <p className="text-sm mt-2 text-neutral-600">
                                    Ingresa los datos para crear una nueva cuenta de usuario.
                                </p>
                            </div>

                            {/* Campos del formulario */}
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
                                        className={inputBaseClasses}
                                        required={field.required}
                                    />
                                </div>
                            ))}

                            {/* Prioridad */}
                            <div className="pt-2">
                                <label className="flex items-center text-sm text-neutral-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPriority}
                                        onChange={handlePriorityChange}
                                        className="form-checkbox h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3"
                                    />
                                    ¿Es usuario prioritario?
                                </label>
                                {isPriority && (
                                    <div className="mt-3">
                                        <label htmlFor="prioridadTipo" className="block text-neutral-700 text-sm font-bold mb-1">
                                            Motivo de Prioridad:
                                        </label>
                                        <select
                                            id="prioridadTipo"
                                            className={`${inputBaseClasses} appearance-none`}
                                            value={prioridadTipo}
                                            onChange={(e) => setPrioridadTipo(e.target.value as "A" | "B" | "C" | "D" | "")}
                                            required={isPriority} // Requerido solo si isPriority es true
                                        >
                                            <option value="" disabled>Seleccione un motivo</option>
                                            <option value="A">Mujer embarazada</option>
                                            <option value="B">Persona con movilidad reducida (ej. muletas)</option>
                                            <option value="C">Adulto mayor (tercera edad)</option>
                                            <option value="D">Otro caso que requiera prioridad</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            
                            {/* Contraseña Generada */}
                            <div>
                                <label htmlFor="contraseñaFormUser" className="block text-neutral-700 text-sm font-bold mb-1">
                                    Contraseña Generada:
                                </label>
                                <p className="text-xs text-neutral-500 mb-2">
                                    La contraseña se generará automáticamente. Haz clic en el botón.
                                </p>
                                <div className="relative">
                                    <input
                                        id="contraseñaFormUser"
                                        className={`${inputBaseClasses} pr-10 ${!contraseña ? 'italic placeholder-neutral-400' : ''}`}
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Contraseña (generada por el sistema)"
                                        value={contraseña}
                                        readOnly
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-indigo-500 rounded-md"
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        disabled={!contraseña}
                                    >
                                        {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className={`${utilityButtonClasses} mt-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1`}
                                    onClick={manejadorContrasena}
                                >
                                    Generar/Regenerar Contraseña
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !contraseña}
                                className={`${primaryButtonClasses} ${loading || !contraseña ? 'bg-neutral-400 cursor-not-allowed' :'bg-indigo-600 hover:bg-indigo-700'} focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Registrando...
                                    </>
                                ) : "Registrar Usuario"}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default CreateUserForm;