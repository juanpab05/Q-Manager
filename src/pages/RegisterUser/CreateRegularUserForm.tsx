import React, { useState, useEffect } from 'react';
// import imgRegister from '@/assets/imagenCreateUser.png'; // Consider using a different image or none for regular users
import useMediaQuery from '@/hooks/useMediaQuery';
import { registerUser, UserRegistrationData } from '@/api/userService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate } from 'react-router-dom'; // Import Link
import { useAuth } from '@/contexts/auth/AuthContext';

// SVG Icons (reused)
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

const CreateRegularUserForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPriority, setIsPriority] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [nombre, setNombre] = useState("");
    const [cedula, setCedula] = useState("");
    const [telefono, setTelefono] = useState("");
    const [email, setEmail] = useState("");
    const [prioridadTipo, setPrioridadTipo] = useState<"A" | "B" | "C" | "D" | "">("");

    const isMobile = useMediaQuery("(max-width: 768px)");
    const navigate = useNavigate();
    const auth = useAuth(); // For redirecting if user is already logged in

    useEffect(() => {
        // Redirect if user is already logged in
        if (auth && auth.isAuthenticated) {
            toast.info("Ya has iniciado sesión. Redirigiendo...");
            navigate('/home-user'); 
        }
    }, [auth, navigate]);

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    const handlePriorityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsPriority(e.target.checked);
        if (!e.target.checked) {
            setPrioridadTipo("");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!nombre || !cedula || !telefono || !email || !password || !confirmPassword) {
            toast.warn("Por favor complete todos los campos.");
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
            toast.warn("Ingrese un número de teléfono válido (entre 7 y 15 dígitos).");
            return;
        }
        if (password.length < 8) {
            toast.warn("La contraseña debe tener al menos 8 caracteres.");
            return;
        }
        if (password !== confirmPassword) {
            toast.warn("Las contraseñas no coinciden.");
            return;
        }
        if (isPriority && !prioridadTipo) {
            toast.warn("Debe seleccionar un motivo de prioridad si marcó la casilla.");
            return;
        }

        setLoading(true);
        const payload: UserRegistrationData = {
            nombre: nombre,
            cedula: cedula,
            email: email,
            phone_number: telefono,
            password: password,
            has_priority: isPriority,
            motive: isPriority ? prioridadTipo : undefined,
        };

        try {
            await registerUser(payload, 'actor'); // Changed from 'cliente' to 'actor' to ensure it's added to the actors table
            toast.success("¡Registro exitoso! Serás redirigido al inicio de sesión.");
            setNombre(""); setCedula(""); setTelefono(""); setEmail(""); setPassword(""); setConfirmPassword("");
            setIsPriority(false); setPrioridadTipo(""); setShowPassword(false); setShowConfirmPassword(false);
            setTimeout(() => {
                navigate('/login');
            }, 2500);
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.response?.data?.message || "Ocurrió un error durante el registro.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const primaryButtonClasses = "w-full py-3 px-4 rounded-lg text-white font-semibold text-base shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out flex items-center justify-center";
    const inputBaseClasses = "w-full py-3 px-4 rounded-lg bg-slate-50 border border-gray-300 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors";

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <main className='flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28'>
                <ToastContainer position={isMobile ? "bottom-center" : "top-right"} autoClose={3500} theme="light" />
                <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-xl lg:max-w-2xl overflow-hidden`}>
                    <div className={`flex flex-col justify-center p-6 sm:p-8 md:p-10 w-full`}>
                        <form onSubmit={handleSubmit} className='flex flex-col w-full space-y-5'>
                            <div className="text-center sm:text-left mb-4">
                                <h2 className="font-bold text-2xl sm:text-3xl text-neutral-800">Crea tu Cuenta</h2>
                                <p className="text-sm mt-2 text-neutral-600">
                                    Ingresa tus datos para registrarte en Q-Manager.
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
                                        className={inputBaseClasses}
                                        required={field.required}
                                    />
                                </div>
                            ))}

                            {/* Password Input */}
                            <div>
                                <label htmlFor="passwordUser" className="sr-only">Contraseña</label>
                                <div className="relative">
                                    <input
                                        id="passwordUser"
                                        className={`${inputBaseClasses} pr-10`}
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Contraseña (mínimo 8 caracteres)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-indigo-500 rounded-md"
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Input */}
                            <div>
                                <label htmlFor="confirmPasswordUser" className="sr-only">Confirmar Contraseña</label>
                                <div className="relative">
                                    <input
                                        id="confirmPasswordUser"
                                        className={`${inputBaseClasses} pr-10`}
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="Confirmar Contraseña"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleConfirmPasswordVisibility}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-indigo-500 rounded-md"
                                        aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Prioridad */}
                            <div className="pt-2">
                                <label className="flex items-center text-sm text-neutral-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isPriority}
                                        onChange={handlePriorityChange}
                                        className="form-checkbox h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3"
                                    />
                                    Soy usuario prioritario
                                </label>
                                {isPriority && (
                                    <div className="mt-3 space-y-2">
                                        <label htmlFor="prioridadTipo" className="block text-neutral-700 text-sm font-medium">
                                            Motivo de Prioridad:
                                        </label>
                                        <select
                                            id="prioridadTipo"
                                            className={`${inputBaseClasses} appearance-none`}
                                            value={prioridadTipo}
                                            onChange={(e) => setPrioridadTipo(e.target.value as "A" | "B" | "C" | "D" | "")}
                                            required={isPriority}
                                        >
                                            <option value="" disabled>Seleccione un motivo</option>
                                            <option value="A">Mujer embarazada</option>
                                            <option value="B">Persona con movilidad reducida</option>
                                            <option value="C">Adulto mayor (tercera edad)</option>
                                            <option value="D">Otro caso que requiera prioridad</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className={`${primaryButtonClasses} ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                disabled={loading}
                            >
                                {loading ? 'Registrando...' : 'Crear Cuenta'}
                            </button>

                            <div className="text-center text-sm text-neutral-600 pt-2">
                                ¿Ya tienes una cuenta?{' '}
                                <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
                                    Inicia Sesión aquí
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CreateRegularUserForm;
