// Type definitions for @/api/accessPointService.js

export interface AccessPoint {
  id: number;
  is_priority: boolean;
  horario_apertura?: string | null; // Assuming time strings like "HH:MM"
  horario_cierre?: string | null; // Assuming time strings like "HH:MM"
  worker_id?: string | null; // UUID from workers table
  worker?: any; // Worker data
  estado?: string; // e.g., 'ACTIVO', 'PAUSADO', 'CERRADO'
  estado_display?: string; // Display name for estado
  tickets_atendidos?: number;
  fecha_inicio?: string | null;
  fecha_pausa?: string | null;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  service: string;
  status: string;
  is_priority: boolean;
  created_at: string;
  updated_at?: string;
  user_id: string;
  access_point_id: number | null;
  user?: any; // User data
  modality?: string;
}

export interface PointDetail {
  id: number;
  is_priority: boolean;
  estado: string;
  tickets_atendidos: number;
  users_count: number;
  // Ensure this matches structure used in Statistics.tsx
}

export interface UserStatistics {
  // total_actors: number; // Removed as per new RPC structure focused on specific counts
  total_actors_non_admin: number; 
  total_operational_workers: number;
  total_admin_workers: number; // Admins are counted separately by RPC
}

export interface TicketStatistics {
  total: number;
  pending: number;
  attended: number;
  // priority: number; // Removed, replaced by total_priority and total_normal
  total_priority: number; // Added
  total_normal: number; // Added
  avg_wait_time_priority_minutes: number; // Added
  avg_wait_time_normal_minutes: number; // Added
}

export interface AccessPointStatistics {
  total: number;
  active: number;
  paused: number;
  priority: number;
  points_detail: PointDetail[];
}

export interface SystemStatistics {
  users: UserStatistics;
  tickets: TicketStatistics;
  access_points: AccessPointStatistics;
  // Add other top-level statistic groups if they exist
}

export function getAllAccessPoints(): Promise<AccessPoint[]>;

export function createAccessPoint(data: Partial<Pick<AccessPoint, 'is_priority' | 'horario_apertura' | 'horario_cierre'>>): Promise<AccessPoint>;

export function assignWorkerToAccessPoint(accessPointId: number, workerId: string): Promise<AccessPoint>;

export function closeAccessPoint(accessPointId: number): Promise<AccessPoint>;

export function deleteAccessPoint(accessPointId: number): Promise<boolean>;

export function getSystemStatistics(): Promise<SystemStatistics>;

// Worker dashboard functions
export function getWorkerAccessPoints(workerId?: string | number): Promise<AccessPoint[]>;

export function initializeAccessPoint(accessPointId: number, workerId: string | number): Promise<AccessPoint>;

export function togglePauseAccessPoint(accessPointId: number): Promise<AccessPoint>;

export function nextTicket(accessPointId: number): Promise<Ticket | { ticket: Ticket; message: string } | null>;

export function getCurrentTicket(accessPointId: number): Promise<Ticket | null>;

export function attendTicket(ticketId: number, accessPointId: number): Promise<Ticket>;

export function recallTicket(ticketId: number): Promise<Ticket>;

// Database maintenance functions
export function verifyDatabaseSchema(): Promise<boolean>;

// Add any other functions exported by accessPointService.js 