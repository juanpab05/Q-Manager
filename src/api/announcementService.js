import supabase from '../utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Obtener todos los anuncios
export const getAllAnnouncements = async () => {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      created_by:created_by_id(
        user_id,
        is_admin,
        user:users!workers_user_id_fkey(
          id,
          nombre
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener anuncios:', error);
    throw error;
  }

  return data;
};

// Obtener anuncios activos
export const getActiveAnnouncements = async () => {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      created_by:created_by_id(
        user_id,
        is_admin,
        user:users!workers_user_id_fkey(
          id,
          nombre
        )
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener anuncios activos:', error);
    throw error;
  }

  return data;
};

// Obtener un anuncio por ID
export const getAnnouncementById = async (id) => {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      created_by:created_by_id(
        user_id,
        is_admin,
        user:users!workers_user_id_fkey(
          id,
          nombre
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error al obtener anuncio con ID ${id}:`, error);
    throw error;
  }

  return data;
};

// Crear un nuevo anuncio usando RPC
export const createAnnouncement = async (announcementData) => {
  if (!announcementData.media_file) {
    throw new Error('Media file is required to create an announcement.');
  }

  // 1. Upload media to Supabase Storage
  const file = announcementData.media_file;
  const fileName = `${uuidv4()}-${file.name}`; // Create a unique file name
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('announcements-media')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading media:', uploadError);
    throw uploadError;
  }

  const mediaPath = uploadData.path; // Path in the bucket

  // 2. Call the RPC function to insert announcement data
  const { data, error } = await supabase.rpc('create_announcement', {
    p_media_path: mediaPath,
    p_media_type: file.type,
    p_is_active: announcementData.is_active === undefined ? true : announcementData.is_active
  });

  if (error) {
    console.error('Error al crear anuncio:', error);
    // Attempt to delete the uploaded file if RPC call fails
    await supabase.storage.from('announcements-media').remove([mediaPath]);
    throw error;
  }

  return data;
};

// Actualizar un anuncio usando RPC
export const updateAnnouncement = async (id, announcementData) => {
  let mediaPath = null;
  let mediaType = null;

  // If a new media file is provided, upload it
  if (announcementData.media_file instanceof File) {
    const file = announcementData.media_file;
    const fileName = `${uuidv4()}-${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('announcements-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading new media for update:', uploadError);
      throw uploadError;
    }
    mediaPath = uploadData.path;
    mediaType = file.type;
  }

  // Call the RPC function to update announcement
  const { data, error } = await supabase.rpc('update_announcement', {
    p_id: id,
    p_is_active: announcementData.is_active,
    p_media_path: mediaPath, // Will be null if no new file was uploaded
    p_media_type: mediaType  // Will be null if no new file was uploaded
  });

  if (error) {
    console.error(`Error al actualizar anuncio con ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

// Activar/desactivar un anuncio
export const toggleAnnouncementStatus = async (id, isActive) => {
  const { data, error } = await supabase
    .from('announcements')
    .update({ 
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error al cambiar estado del anuncio con ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

// Eliminar un anuncio
export const deleteAnnouncement = async (id) => {
  try {
    // First get the announcement to know its media file path
    const { data: announcement, error: fetchError } = await supabase
      .from('announcements')
      .select('media_file')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error(`Error al obtener datos del anuncio con ID ${id} para eliminación:`, fetchError);
      throw fetchError;
    }
    
    // Store media path for later cleanup
    const mediaPath = announcement?.media_file;
    
    // Call the RPC function to delete the announcement from database
    const { data, error } = await supabase.rpc('delete_announcement', {
      p_id: id
    });
    
    if (error) {
      console.error(`Error al eliminar anuncio con ID ${id}:`, error);
      throw error;
    }
    
    // If database deletion was successful and there is a media file, clean up storage
    if (data && mediaPath) {
      console.log(`Attempting to delete from storage: announcements-media, path: ${mediaPath}`);
      const { error: deleteMediaError } = await supabase.storage
        .from('announcements-media')
        .remove([mediaPath]);
        
      if (deleteMediaError) {
        console.warn(`Error al eliminar archivo multimedia ${mediaPath}:`, deleteMediaError);
        // Continue despite storage cleanup failure
      }
    }
    
    return true;
  } catch (err) {
    console.error(`Error executing delete_announcement for ID ${id}:`, err);
    throw err;
  }
}; 