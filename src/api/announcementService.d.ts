// Type definitions for @/api/announcementService.js

// Based on its usage in Announcements.tsx and common patterns

export interface Announcement {
  id: number;
  created_by_id?: string;
  is_active?: boolean;
  media_file?: string | File | null; // Path in storage bucket or file for upload
  media_type?: string | null; // MIME type of the media file
  created_at: string;
  updated_at?: string | null;
  created_by_detail?: { nombre?: string };
  // We no longer need media_content_type since it's handled by the RPC
}

/**
 * Get all announcements from the database
 */
export function getAllAnnouncements(): Promise<Announcement[]>;

/**
 * Create a new announcement
 * @param announcementData The announcement data containing at least a media file
 */
export function createAnnouncement(
  announcementData: Partial<Announcement> & { media_file: File }
): Promise<Announcement>;

/**
 * Update an existing announcement
 * @param id The ID of the announcement to update
 * @param announcementData The data to update
 */
export function updateAnnouncement(
  id: number, 
  announcementData: Partial<Announcement>
): Promise<Announcement>;

/**
 * Delete an announcement
 * @param id The ID of the announcement to delete
 */
export function deleteAnnouncement(id: number): Promise<boolean>;

/**
 * Get only active announcements
 */
export function getActiveAnnouncements(): Promise<Announcement[]>;

/**
 * Get a single announcement by ID
 * @param id The ID of the announcement to retrieve
 */
export function getAnnouncementById(id: number): Promise<Announcement>;

// Add any other functions exported by announcementService.js 