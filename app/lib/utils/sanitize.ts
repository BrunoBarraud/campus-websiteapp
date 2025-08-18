/**
 * Utilidades para sanitización de entradas de usuario
 */

import DOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify with JSDOM window for server-side sanitization
const window = new JSDOM('').window;
const purify = DOMPurify.sanitize;

/**
 * Sanitiza una cadena de texto para prevenir ataques XSS
 * @param input Texto a sanitizar
 * @returns Texto sanitizado
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'span',
      'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  });
}

/**
 * Sanitiza texto plano (elimina HTML y scripts)
 * @param input Texto a sanitizar
 * @returns Texto sanitizado
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitiza un objeto completo (útil para datos de formularios)
 * @param data Objeto a sanitizar
 * @returns Objeto con todos sus valores de texto sanitizados
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

/**
 * Sanitiza parámetros de URL
 * @param params Parámetros de URL a sanitizar
 * @returns Parámetros sanitizados
 */
export function sanitizeUrlParams(params: URLSearchParams): URLSearchParams {
  const sanitized = new URLSearchParams();
  
  for (const [key, value] of params.entries()) {
    sanitized.append(key, sanitizeText(value));
  }
  
  return sanitized;
}