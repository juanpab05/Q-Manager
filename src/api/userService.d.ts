// Type definitions for @/api/userService.js

// Define el tipo para los datos básicos de un usuario que vienen de Supabase Auth y la tabla 'users'
export interface User {
  id: string;
  nombre?: string;
  cedula?: string;
  email?: string;
  phone_number?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  // Otros campos que puedan venir de la tabla 'users'
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

// Define el tipo para los datos de un actor
export interface Actor {
  user_id: string; // Coincide con User.id
  has_priority?: boolean;
  motive?: string;
  // Otros campos de la tabla 'actors'
}

// Define el tipo para los datos de un trabajador
export interface Worker {
  user_id: string; // Coincide con User.id
  is_admin?: boolean;
  // Otros campos de la tabla 'workers'
}

// Define el tipo para el perfil completo del usuario
export interface UserProfile extends User {
  actor: Actor | null;
  worker: Worker | null;
  isActor: boolean;
  isWorker: boolean;
  isAdmin: boolean;
}

// Define el tipo para los datos de registro de usuario
export interface UserRegistrationData {
  email: string;
  password?: string; // Password es opcional si usas proveedores OAuth, pero requerido para email/pass
  nombre: string;
  cedula: string;
  phone_number?: string;
  has_priority?: boolean; // Para actores
  motive?: string;       // Para actores
  is_admin?: boolean;    // Para trabajadores
  // Cualquier otro campo necesario para el registro
}

// Define el tipo para la respuesta de la función de registro
export interface RegistrationResponse {
  userId: string;
  success: boolean;
  // Cualquier otro dato que devuelva tu función de registro
}

// Declaraciones de las funciones exportadas por userService.js
export function getUserById(userId: string): Promise<User | null>;
export function getUserProfile(userId: string): Promise<UserProfile | null>;
export function updateUser(userId: string, userData: Partial<User>): Promise<User | null>;
export function updateActor(userId: string, actorData: Partial<Actor>): Promise<Actor | null>;
export function updateWorker(userId: string, workerData: Partial<Worker>): Promise<Worker | null>;
export function registerUser(userData: UserRegistrationData, userType?: 'actor' | 'worker' | 'cliente'): Promise<RegistrationResponse>;
export function getWorkers(): Promise<Worker[]>; // Asumiendo que devuelve una lista de perfiles de trabajadores
export function getAllWorkers(): Promise<any[]>; // Ajustar el tipo de retorno si se conoce mejor
export function deleteUsers(userIds: string[]): Promise<{
  success: boolean;
  deletedCount: number;
}>;
export function getActors(): Promise<UserProfile[]>; // O un tipo más específico si UserProfile no es exacto

// Function to sync all missing users to the actors table
export function syncMissingUsersToActors(): Promise<{
  success: boolean;
  usersAdded: number;
  details: any[]; // You might want to define a more specific type for details
  error?: string;
}>;

// Declaration for the RPC function to update actor profile
export function updateActorProfileRpc(
  userId: string, 
  actorData: { has_priority?: boolean; motive?: string | null }
): Promise<{ 
  success: boolean; 
  message: string; 
  actor?: Actor; // Assuming the RPC returns the updated actor on success
  details?: string 
}>;

// Declaration for the function to clean up workers from the actors table
export function cleanupWorkersFromActors(): Promise<{
  success: boolean;
  workersRemoved: number;
  message: string;
  error?: string;
}>;

// Asegúrate de que todos los exports de userService.js estén aquí con sus tipos correctos.

export function deleteAuthUsers(userIds: string[]): Promise<{
  success: boolean;
  message?: string;
  deletedCount?: number;
}>; 