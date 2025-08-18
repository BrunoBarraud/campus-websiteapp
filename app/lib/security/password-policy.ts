/**
 * Política de contraseñas seguras
 */

// Requisitos mínimos para contraseñas
const MIN_LENGTH = 8;
const REQUIRE_UPPERCASE = true;
const REQUIRE_LOWERCASE = true;
const REQUIRE_NUMBER = true;
const REQUIRE_SPECIAL = true;
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Lista de contraseñas comunes que no se deben permitir
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', 'qwerty', 'admin',
  'welcome', 'welcome123', 'letmein', 'abc123', 'monkey', '1234567890'
];

/**
 * Verifica si una contraseña cumple con la política de seguridad
 * @param password Contraseña a verificar
 * @returns Objeto con resultado y mensaje de error si no cumple
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  // Verificar longitud mínima
  if (password.length < MIN_LENGTH) {
    return {
      isValid: false,
      message: `La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`
    };
  }
  
  // Verificar si contiene mayúsculas
  if (REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos una letra mayúscula.'
    };
  }
  
  // Verificar si contiene minúsculas
  if (REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos una letra minúscula.'
    };
  }
  
  // Verificar si contiene números
  if (REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos un número.'
    };
  }
  
  // Verificar si contiene caracteres especiales
  if (REQUIRE_SPECIAL && !new RegExp(`[${SPECIAL_CHARS.replace(/[\[\]\\]/g, '\\$&')}]`).test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos un carácter especial.'
    };
  }
  
  // Verificar si es una contraseña común
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return {
      isValid: false,
      message: 'Esta contraseña es demasiado común. Por favor, elige una más segura.'
    };
  }
  
  // Si pasa todas las verificaciones, la contraseña es válida
  return { isValid: true };
}

/**
 * Genera una contraseña aleatoria que cumple con la política
 * @returns Contraseña generada
 */
export function generateSecurePassword(): string {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  
  // Asegurar que la contraseña tenga al menos un carácter de cada tipo requerido
  let password = '';
  
  if (REQUIRE_UPPERCASE) {
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
  }
  
  if (REQUIRE_LOWERCASE) {
    password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
  }
  
  if (REQUIRE_NUMBER) {
    password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
  }
  
  if (REQUIRE_SPECIAL) {
    password += SPECIAL_CHARS.charAt(Math.floor(Math.random() * SPECIAL_CHARS.length));
  }
  
  // Completar la contraseña hasta la longitud mínima
  const allChars = uppercaseChars + lowercaseChars + numberChars + SPECIAL_CHARS;
  
  while (password.length < MIN_LENGTH) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Mezclar los caracteres para que no sigan un patrón predecible
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Calcula la fortaleza de una contraseña del 0 al 100
 * @param password Contraseña a evaluar
 * @returns Puntuación de fortaleza (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;
  
  let score = 0;
  
  // Longitud base: hasta 40 puntos
  score += Math.min(40, password.length * 4);
  
  // Variedad de caracteres: hasta 20 puntos
  if (/[A-Z]/.test(password)) score += 5;
  if (/[a-z]/.test(password)) score += 5;
  if (/[0-9]/.test(password)) score += 5;
  if (new RegExp(`[${SPECIAL_CHARS.replace(/[\[\]\\]/g, '\\$&')}]`).test(password)) score += 5;
  
  // Complejidad: hasta 40 puntos
  const uniqueChars = new Set(password.split('')).size;
  score += Math.min(20, uniqueChars * 2);
  
  // Patrones: penalización hasta 30 puntos
  if (/(.)\1{2,}/.test(password)) score -= 10; // Caracteres repetidos
  if (/^[A-Za-z]+$/.test(password)) score -= 10; // Solo letras
  if (/^[0-9]+$/.test(password)) score -= 10; // Solo números
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) score -= 30; // Contraseña común
  
  // Asegurar que el puntaje esté entre 0 y 100
  return Math.max(0, Math.min(100, score));
}