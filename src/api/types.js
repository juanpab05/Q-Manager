/**
 * @typedef {Object} TicketRequestData
 * @property {string} service - El servicio solicitado
 * @property {'VIRTUAL' | 'PRESENCIAL'} modality - Modalidad del ticket
 * @property {boolean} [is_priority] - Si el ticket es prioritario
 */

/**
 * @typedef {Object} TicketResponseData
 * @property {number} id - ID del ticket
 * @property {string} ticket_number - Número de ticket (ej. N-001)
 * @property {string} service - Servicio solicitado
 * @property {string} status - Estado del ticket (PENDIENTE, EN_ATENCIÓN, ATENDIDO, etc.)
 * @property {string} [status_display] - Display text para el estado
 * @property {string} modality - Modalidad del ticket (VIRTUAL, PRESENCIAL)
 * @property {string} [modality_display] - Display text para la modalidad
 * @property {boolean} is_priority - Si es prioritario
 * @property {string} created_at - Fecha de creación
 * @property {string} updated_at - Fecha de última actualización
 * @property {string} user_id - ID del usuario (UUID)
 * @property {number} [access_point_id] - ID del punto de acceso asignado
 */

/**
 * @typedef {Object} Announcement
 * @property {number} id - ID del anuncio
 * @property {string} title - Título del anuncio
 * @property {string} content - Contenido del anuncio
 * @property {boolean} is_active - Si el anuncio está activo
 * @property {string} [media_url] - URL del archivo multimedia
 * @property {string} [media_type] - Tipo de archivo multimedia
 * @property {string} created_at - Fecha de creación
 * @property {string} [updated_at] - Fecha de actualización
 * @property {string} created_by_id - ID del trabajador que creó el anuncio
 * @property {Object} [created_by] - Información del creador
 */

/**
 * @typedef {Object} AccessPoint
 * @property {number} id - ID del punto de acceso
 * @property {string} nombre - Nombre del punto de acceso
 * @property {string} ubicacion - Ubicación del punto de acceso
 * @property {string} estado - Estado actual (ACTIVO, PAUSADO, CERRADO)
 * @property {string} [worker_id] - ID del trabajador asignado
 * @property {string} [fecha_inicio] - Fecha de inicio de operación
 * @property {string} [fecha_pausa] - Fecha de pausa
 * @property {number} tickets_atendidos - Cantidad de tickets atendidos
 * @property {Object} [worker] - Información del trabajador asignado
 */

/**
 * @typedef {Object} User
 * @property {string} id - ID de usuario (UUID)
 * @property {string} email - Correo electrónico
 * @property {string} nombre - Nombre completo
 * @property {string} [cedula] - Número de cédula
 * @property {string} [phone_number] - Número de teléfono
 */

/**
 * @typedef {Object} Worker
 * @property {string} user_id - ID del usuario (UUID)
 * @property {string} code - Código de empleado
 * @property {boolean} is_admin - Si es administrador
 * @property {User} [user] - Información del usuario
 */ 