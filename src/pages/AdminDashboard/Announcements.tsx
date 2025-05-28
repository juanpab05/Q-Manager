import React, { useEffect, useState, useRef } from 'react';
// import { useNavigate } from 'react-router-dom'; // Only if used for the deleted auth check
// import Navbar from '../navbar/navbar'; // Navbar is already global
import { 
  getAllAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement,
  Announcement 
} from '@/api/announcementService';
import { formatMediaUrl } from '@/utils/mediaUtils';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from '@/components/LoadingSpinner';

const Announcements: React.FC = () => {
  // const navigate = useNavigate(); // Removed as it was for the localStorage check
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<Announcement>>({
    is_active: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null);

  useEffect(() => {
    // The localStorage check and navigation has been REMOVED.
    // ProtectedRoutes.tsx handles route protection.
    fetchAnnouncements();
  }, []); // Removed navigate from dependencies

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAllAnnouncements();
      setAnnouncements(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Error al cargar los anuncios');
      toast.error('Error al cargar los anuncios');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCurrentAnnouncement((prev: Partial<Announcement>) => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setCurrentAnnouncement((prev: Partial<Announcement>) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if media file is selected (required for creating)
    if (!isEditing && !selectedFile) {
      setError('Debe seleccionar una imagen o video para crear un anuncio');
      toast.error('Debe seleccionar una imagen o video para crear un anuncio');
      return;
    }
    
    try {
      if (isEditing && currentAnnouncement.id) {
        // Create a new update object with only the fields we want to update
        const updateData: Partial<Announcement> = {
          id: currentAnnouncement.id,
          is_active: currentAnnouncement.is_active
        };
        
        // Only include the media_file if a new file is selected
        if (selectedFile) {
          updateData.media_file = selectedFile;
        }
        
        console.log("Updating announcement with data:", updateData);
        const result = await updateAnnouncement(currentAnnouncement.id, updateData);
        toast.success('Anuncio actualizado correctamente');
        console.log("Update result:", result);
      } else {
        if (selectedFile) {
          const result = await createAnnouncement({
            is_active: currentAnnouncement.is_active === undefined ? true : currentAnnouncement.is_active,
            media_file: selectedFile
          });
          toast.success('Anuncio creado correctamente');
          console.log("Create result:", result);
        }
      }
      
      // Refrescar la lista después de crear/editar
      await fetchAnnouncements();
      resetForm();
      setError(null);
    } catch (err) {
      console.error('Error saving announcement:', err);
      setError('Error al guardar el anuncio');
      toast.error('Error al guardar el anuncio');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    // Set current announcement data
    setCurrentAnnouncement({
      ...announcement,
      // Don't include the media_file as it can't be loaded from the server
      media_file: undefined 
    });
    
    // If there's a media file path, create a preview
    if (announcement.media_file && typeof announcement.media_file === 'string') {
      // Only set media preview, not the actual file
      setMediaPreview(formatMediaUrl(announcement.media_file));
    } else {
      setMediaPreview(null);
    }
    
    setIsEditing(true);
    setShowForm(true);
    setSelectedFile(null); // Reset selected file when editing
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    setAnnouncementToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (!announcementToDelete) return;
    
    try {
      const result = await deleteAnnouncement(announcementToDelete);
      console.log("Delete result:", result);
      
      if (result) {
        // Update local state to remove the deleted announcement
        setAnnouncements(prev => prev.filter(ann => ann.id !== announcementToDelete));
        toast.success('Anuncio eliminado correctamente');
      } else {
        // If result is false, deletion failed
        toast.error('No se pudo eliminar el anuncio');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('Error al eliminar el anuncio');
      toast.error('Error al eliminar el anuncio');
    } finally {
      setShowDeleteModal(false);
      setAnnouncementToDelete(null);
    }
  };
  
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setAnnouncementToDelete(null);
  };

  const resetForm = () => {
    setCurrentAnnouncement({
      is_active: true
    });
    setSelectedFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsEditing(false);
    setShowForm(false);
  };

  if (loading && announcements.length === 0) {
    return <LoadingSpinner message="Cargando anuncios..." />;
  }

  return (
    <>
      {/* <Navbar /> */}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Administración de Anuncios
            </h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {showForm ? 'Cancelar' : 'Nuevo Anuncio'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
              <button 
                className="ml-4 underline"
                onClick={() => setError(null)}
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Formulario para crear/editar anuncios */}
          {showForm && (
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {isEditing ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Media file upload */}
                  <div>
                    <label htmlFor="file-input-actual" className="block text-sm font-medium text-gray-700 mb-1">
                      Imagen o Video {!isEditing && "*"}
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="file"
                        id="file-input-actual"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,video/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <label 
                        htmlFor="file-input-actual"
                        className="block w-full p-2 border border-gray-300 rounded-md text-gray-500 bg-white truncate cursor-pointer"
                      >
                        {selectedFile ? selectedFile.name : "Seleccionar imagen o video..."}
                      </label>
                    </div>

                    {selectedFile && (
                      <div className="mt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleClearFile}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Eliminar archivo
                        </button>
                      </div>
                    )}
                    {mediaPreview && (
                      <div className="mt-3 border rounded-md p-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Vista previa:</p>
                        {selectedFile?.type.startsWith('image/') ? (
                          <img src={mediaPreview} alt="Vista previa" className="max-h-48 max-w-full" />
                        ) : selectedFile?.type.startsWith('video/') ? (
                          <video src={mediaPreview} controls className="max-h-48 max-w-full" />
                        ) : currentAnnouncement.media_type?.includes('image') ? (
                          <img src={mediaPreview} alt="Vista previa" className="max-h-48 max-w-full" />
                        ) : currentAnnouncement.media_type?.includes('video') ? (
                          <video src={mediaPreview} controls className="max-h-48 max-w-full" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={currentAnnouncement.is_active || false}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Anuncio activo
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      {isEditing ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Lista de anuncios */}
          <div className="bg-white overflow-hidden shadow-md rounded-xl">
            <h2 className="text-xl font-semibold text-gray-800 p-6 border-b">
              Anuncios Existentes
            </h2>
            {announcements.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No hay anuncios disponibles
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {announcements.map(announcement => (
                  <li key={announcement.id} className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className="mb-4 sm:mb-0 sm:flex-1">
                        <div className="flex items-center mb-1">
                          <h3 className="text-lg font-medium text-gray-900 mr-2">
                            Anuncio #{announcement.id}
                          </h3>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            announcement.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {announcement.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        
                        {/* Display media if available */}
                        {announcement.media_file && typeof announcement.media_file === 'string' && (
                          <div className="mt-2 mb-3">
                            {announcement.media_type?.includes('image') ? (
                              <img 
                                src={formatMediaUrl(announcement.media_file)} 
                                alt={`Anuncio #${announcement.id}`} 
                                className="max-h-64 rounded-md" 
                              />
                            ) : announcement.media_type?.includes('video') ? (
                              <video 
                                src={formatMediaUrl(announcement.media_file)} 
                                controls 
                                className="max-h-64 rounded-md" 
                              />
                            ) : null}
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-500">
                          Creado: {new Date(announcement.created_at).toLocaleString()}
                          {announcement.created_by_detail && (
                            <> por {announcement.created_by_detail.nombre}</>
                          )}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="py-1 px-3 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="py-1 px-3 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-10 transition-opacity" onClick={closeDeleteModal}></div>
          
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6 shadow-xl transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirmar eliminación</h3>
              
              <p className="text-sm text-gray-500 mb-6">
                ¿Está seguro que desea eliminar este anuncio? Esta acción no se puede deshacer.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  No, cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Announcements; 