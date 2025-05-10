import { TicketRequestData, TicketResponseData } from './types';

declare module '@/api/ticketService' {
  export function getTickets(): Promise<TicketResponseData[]>;
  export function getUserTickets(userId: string): Promise<TicketResponseData[]>;
  export function requestTicket(ticketData: TicketRequestData): Promise<TicketResponseData>;
  export function checkPendingTicket(userId?: string): Promise<{ hasPendingTicket: boolean; pendingTicket: TicketResponseData | null }>;
  export function updateTicketStatus(ticketId: number, status: string, puntoAccesoId?: number | null): Promise<TicketResponseData>;
  export function getQueueStatus(ticketId?: number): Promise<any>;
  export function getMyTickets(): Promise<TicketResponseData[]>;
  export function subscribeToTicketUpdates(callback: (payload: any) => void): () => void;
  export function subscribeToUserTicketUpdates(userId: string, callback: (payload: any) => void): () => void;
  export function subscribeToAccessPointUpdates(callback: (payload: any) => void): () => void;
  export function getAllAnnouncements(): Promise<any[]>;
  export function getNextTicketForAttention(puntoAccesoId: number): Promise<any>;
  export function getNextTickets(limit?: number): Promise<TicketResponseData[]>;
  export function fixTicketSchema(): Promise<any>;
}