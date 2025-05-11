// Type definitions for notificationService.js
import { TicketResponseData } from './types';

declare module '@/api/notificationService' {
  export function requestNotificationPermission(): Promise<boolean>;
  
  export function createBrowserNotification(
    title: string, 
    options?: NotificationOptions
  ): Notification | null;
  
  export function subscribeToTicketStatusChange(
    ticketId: number, 
    callback: (updatedTicket: TicketResponseData) => void
  ): () => void;
  
  export function subscribeToUserTicketsChange(
    userId: string, 
    callback: (updatedTicket: TicketResponseData) => void
  ): () => void;
  
  export function notifyTicketStatus(ticket: TicketResponseData): void;
  
  export function setupUserNotifications(userId: string): () => void;
} 