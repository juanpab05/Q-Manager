import { supabase } from '../lib/supabase';

export const announcementService = {
  // Obtener todos los anuncios
  getAllAnnouncements: async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, workers:created_by_id(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Obtener anuncios activos
  getActiveAnnouncements: async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, workers:created_by_id(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Obtener un anuncio por su ID
  getAnnouncementById: async (id) => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, workers:created_by_id(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Crear un nuevo anuncio
  createAnnouncement: async (announcementData) => {
    // Si hay archivo multimedia, primero lo subimos al storage
    let mediaPath = null;
    
    if (announcementData.media_file instanceof File) {
      const file = announcementData.media_file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Obtener URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      mediaPath = publicUrl;
    }
    
    // Crear el anuncio en la base de datos
    const dataToInsert = {
      ...announcementData,
      media_file: mediaPath || announcementData.media_file,
    };
    
    const { data, error } = await supabase
      .from('announcements')
      .insert(dataToInsert)
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  // Actualizar un anuncio
  updateAnnouncement: async (id, announcementData) => {
    // Si hay nuevo archivo multimedia, primero lo subimos al storage
    let mediaPath = announcementData.media_file;
    
    if (announcementData.media_file instanceof File) {
      const file = announcementData.media_file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Obtener URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      mediaPath = publicUrl;
    }
    
    // Actualizar el anuncio en la base de datos
    const dataToUpdate = {
      ...announcementData,
      media_file: mediaPath,
    };
    
    const { data, error } = await supabase
      .from('announcements')
      .update(dataToUpdate)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  // Cambiar el estado de un anuncio (activar/desactivar)
  toggleAnnouncementStatus: async (id, isActive) => {
    const { data, error } = await supabase
      .from('announcements')
      .update({ is_active: isActive })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  // Eliminar un anuncio
  deleteAnnouncement: async (id) => {
    // Primero, obtener la información del anuncio para ver si tiene archivo multimedia
    const { data: announcement, error: fetchError } = await supabase
      .from('announcements')
      .select('media_file')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Si hay archivo multimedia, eliminarlo del storage
    if (announcement.media_file) {
      try {
        const mediaPath = announcement.media_file.split('/').pop();
        
        if (mediaPath) {
          await supabase.storage
            .from('media')
            .remove([`announcements/${mediaPath}`]);
        }
      } catch (error) {
        console.error("Error eliminando archivo multimedia:", error);
      }
    }
    
    // Eliminar el anuncio de la base de datos
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

export default announcementService; 