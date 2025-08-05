// 🔧 Utilidades para manejar tipos de contenido con la limitación actual de BD

/**
 * Extrae el tipo original del contenido si fue preservado
 */
export function extractOriginalContentType(content: string): {
  originalType: string;
  cleanContent: string;
} {
  const typeMatch = content.match(/^\[TIPO: (.*?)\]\n\n([\s\S]*)/);
  
  if (typeMatch) {
    return {
      originalType: typeMatch[1].toLowerCase(),
      cleanContent: typeMatch[2]
    };
  }
  
  return {
    originalType: 'assignment', // Tipo por defecto actual en BD
    cleanContent: content
  };
}

/**
 * Obtiene el ícono apropiado basado en el tipo de contenido
 */
export function getContentTypeIcon(content: string) {
  const { originalType } = extractOriginalContentType(content);
  
  switch (originalType) {
    case 'document':
      return '📄';
    case 'content':
      return '📝';
    case 'assignment':
      return '✅';
    case 'video':
      return '🎥';
    case 'link':
      return '🔗';
    default:
      return '📋';
  }
}

/**
 * Obtiene la etiqueta de tipo de contenido
 */
export function getContentTypeLabel(content: string) {
  const { originalType } = extractOriginalContentType(content);
  
  switch (originalType) {
    case 'document':
      return 'Documento';
    case 'content':
      return 'Contenido';
    case 'assignment':
      return 'Tarea';
    case 'video':
      return 'Video';
    case 'link':
      return 'Enlace';
    default:
      return 'Contenido';
  }
}

/**
 * Verifica si el contenido tiene archivo adjunto basado en el tipo
 */
export function hasAttachment(content: string, file_url?: string) {
  const { originalType } = extractOriginalContentType(content);
  return originalType === 'document' && !!file_url;
}
