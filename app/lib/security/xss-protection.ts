/**
 * Utilidades para protección contra ataques XSS (Cross-Site Scripting)
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuración para DOMPurify
 */
const DEFAULT_CONFIG = {
  ALLOWED_TAGS: [
    // Elementos de texto básicos
    'p', 'b', 'i', 'em', 'strong', 'a', 'br', 'span',
    // Elementos de estructura
    'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Listas
    'ul', 'ol', 'li',
    // Tablas simples
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Otros elementos seguros
    'blockquote', 'hr', 'code', 'pre'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'class', 'style', 'title', 'alt',
    'src', 'width', 'height', 'id', 'name', 'aria-label'
  ],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'],
  ALLOW_DATA_ATTR: false,
  USE_PROFILES: { html: true },
};

/**
 * Sanitiza HTML para prevenir ataques XSS
 * @param html HTML a sanitizar
 * @returns HTML sanitizado
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, DEFAULT_CONFIG);
}

/**
 * Sanitiza texto plano (elimina todo el HTML)
 * @param text Texto a sanitizar
 * @returns Texto sanitizado
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitiza URL para prevenir ataques XSS
 * @param url URL a sanitizar
 * @returns URL sanitizada o # si es inválida
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '#';
  
  try {
    // Verificar si la URL es válida
    const parsedUrl = new URL(url, window.location.origin);
    
    // Permitir solo protocolos seguros
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsedUrl.protocol)) {
      return parsedUrl.toString();
    }
    
    return '#';
  } catch (error) {
    // Si la URL no es válida, devolver #
    return '#';
  }
}

/**
 * Sanitiza atributos de estilo CSS
 * @param styles Estilos CSS a sanitizar
 * @returns Estilos CSS sanitizados
 */
export function sanitizeStyles(styles: string): string {
  if (!styles) return '';
  
  // Lista de propiedades CSS permitidas
  const allowedProperties = [
    'color', 'background-color', 'font-size', 'font-weight', 'font-style',
    'text-align', 'text-decoration', 'margin', 'padding', 'border',
    'display', 'width', 'height', 'max-width', 'max-height',
  ];
  
  // Expresiones regulares para validar valores CSS
  const validValueRegex = /^[\w\s\-\.,#%()]+$/;
  
  // Dividir los estilos en pares propiedad:valor
  const stylesPairs = styles.split(';').filter(Boolean);
  const sanitizedPairs = [];
  
  for (const pair of stylesPairs) {
    const [property, value] = pair.split(':').map(s => s.trim());
    
    // Verificar si la propiedad está permitida
    if (allowedProperties.includes(property)) {
      // Verificar si el valor es seguro
      if (validValueRegex.test(value)) {
        sanitizedPairs.push(`${property}: ${value}`);
      }
    }
  }
  
  return sanitizedPairs.join('; ');
}

/**
 * Sanitiza un objeto completo (útil para datos de formularios)
 * @param data Objeto a sanitizar
 * @returns Objeto con todos sus valores sanitizados
 */
export function sanitizeObject<T extends Record<string, any>>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeText(sanitized[key]) as T[Extract<keyof T, string>];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
}