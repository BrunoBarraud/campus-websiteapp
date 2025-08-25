import teachersConfig from '../../../config/teachers.json';

/**
 * Verifica si un email pertenece a un profesor autorizado
 * @param email - Email a verificar
 * @returns true si es un profesor, false si es estudiante
 */
export function isTeacherEmail(email: string): boolean {
  return teachersConfig.teachers.includes(email.toLowerCase());
}

/**
 * Determina el rol basado en el email
 * @param email - Email del usuario
 * @returns 'teacher' o 'student'
 */
export function determineRole(email: string): 'teacher' | 'student' {
  return isTeacherEmail(email) ? 'teacher' : 'student';
}

/**
 * Obtiene la lista completa de profesores
 * @returns Array de emails de profesores
 */
export function getTeachersList(): string[] {
  return teachersConfig.teachers;
}

/**
 * Agrega un nuevo profesor a la lista (solo para uso administrativo)
 * Nota: Esta función solo modifica la lista en memoria, no el archivo
 * @param email - Email del nuevo profesor
 */
export function addTeacherToMemory(email: string): void {
  if (!teachersConfig.teachers.includes(email.toLowerCase())) {
    teachersConfig.teachers.push(email.toLowerCase());
  }
}

/**
 * Remueve un profesor de la lista (solo para uso administrativo)
 * Nota: Esta función solo modifica la lista en memoria, no el archivo
 * @param email - Email del profesor a remover
 */
export function removeTeacherFromMemory(email: string): void {
  const index = teachersConfig.teachers.indexOf(email.toLowerCase());
  if (index > -1) {
    teachersConfig.teachers.splice(index, 1);
  }
}