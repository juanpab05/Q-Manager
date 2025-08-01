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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
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