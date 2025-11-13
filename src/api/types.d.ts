// Type definitions for @/api/types.js

// Basado en el uso en TicketHistory.tsx y otros posibles usos
export interface TicketResponseData {
  id: number;
  ticket_number: string;
  service: string;
  status: 'PENDIENTE' | 'ATENDIDO' | 'EN_PROGRESO' | 'EN_ATENCIÓN' | 'CANCELADO' | 'COMPLETADO'; // Ajustar según todos los estados posibles
  status_display?: string; // Si se usa para mostrar un estado más amigable
  created_at: string; // ISO date string
  updated_at?: string; // ISO date string
  modality: 'VIRTUAL' | 'PRESENCIAL';
  modality_display?: string;
  is_priority?: boolean;
  user_id?: string; // UUID del usuario
  access_point_id?: number | null;
  // Otros campos que pueda tener un ticket
}

export interface TicketRequestData {
  service: string;
  modality: 'VIRTUAL' | 'PRESENCIAL';
  user_id: string;
  is_priority?: boolean; // Added for ticket number generation
}

export interface Ticket {
  // ... existing code ...
}

export interface ActorPayload {
  nombre: string;
  cedula: number | string; // Puede ser string si se maneja como tal en el form
  email: string;
  phone_number: string;
  password?: string; // Opcional si se genera en backend o no se actualiza
  has_priority?: boolean;
  motive?: "A" | "B" | "C" | "D" | string; // string para 'Otro caso'
}

export interface CreateUserWorkerPayload {
  nombre: string;
  cedula: number | string;
  email: string;
  phone_number: number | string;
  password?: string;
  is_admin?: boolean;
}

// Podrías añadir más tipos que estén definidos en types.js
// Por ejemplo, si tienes tipos para AccessPoint, Announcement, etc.

export interface AccessPointData {
  id: number;
  nombre?: string; // Asumiendo que puede tener un nombre
  is_priority?: boolean;
  horario_apertura?: string; // Formato HH:MM:SS
  horario_cierre?: string;   // Formato HH:MM:SS
  estado?: 'ABIERTO' | 'CERRADO' | 'PAUSADO' | 'ACTIVO';
  worker_id?: string | null; // UUID del trabajador asignado
  worker?: any; // O un tipo más específico WorkerProfile
  estado_display?: string;
  tickets_atendidos?: number;
  // ...otros campos que vengan de la API/Supabase
}

export interface AnnouncementData {
  id: number;
  title?: string;
  content?: string;
  is_active: boolean;
  media_file?: File | string; // Puede ser un archivo al crear/actualizar o string (URL) al leer
  media_url?: string; // URL del medio almacenado
  media_type?: 'image' | 'video';
  created_at?: string;
  created_by_id?: string;
  // ...otros campos
}

// Esta es solo una base, deberías completarla con todas las exportaciones de types.js 

// Represents the user data, often from the 'users' table
export interface UserData {
  id: string;
  nombre: string;
  cedula: string;
  email: string;
  phone_number?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  // Campos específicos de actor o worker pueden ir en sus propias interfaces
  actor?: ActorData | null; // Si tienes una interfaz ActorData
  worker?: WorkerSpecificData | null; // Si tienes una interfaz WorkerSpecificData
}

// Represents the specific data stored in the 'workers' table for a worker
export interface WorkerSpecificData {
  id: number; // Este es el id de la tabla 'workers', no el user_id
  user_id: string; // Foreign key to users table
  is_admin: boolean;
  // otros campos específicos de worker...
}

// Combined profile for a worker, as returned by getAllWorkers
export interface WorkerProfile {
  id: string; // This is the user_id from the users table (UUID)
  worker_id: number; // This is the primary key from the workers table
  nombre: string;
  email: string;
  cedula?: string;
  phone_number?: string;
  is_admin: boolean; // Specifically from the workers table context
  role: 'worker'; // Added by the transformation in getAllWorkers
  // Add other user-related fields if getAllWorkers includes them and they are not optional
}

// Interfaz para los datos de registro de un usuario (general, para Auth y tabla users)
// ... existing code ... 