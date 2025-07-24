// Helper para verificar permisos por rol
import { getCurrentUser } from './auth';
import { createClient } from '@supabase/supabase-js';

export async function requireRole(allowedRoles: string[]) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('No autenticado');
  }
  
  if (!allowedRoles.includes(currentUser.role)) {
    throw new Error('No tienes permisos para realizar esta acción');
  }
  
  return currentUser;
}

export async function requireOwnership(resourceUserId: string, allowedRoles: string[] = []) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('No autenticado');
  }
  
  // Admin siempre puede acceder
  if (currentUser.role === 'admin') {
    return currentUser;
  }
  
  // Si está en roles permitidos, puede acceder
  if (allowedRoles.includes(currentUser.role)) {
    return currentUser;
  }
  
  // Si es el propietario del recurso, puede acceder
  if (currentUser.id === resourceUserId) {
    return currentUser;
  }
  
  throw new Error('No tienes permisos para acceder a este recurso');
}

export async function requireSubjectTeacher(subjectId: string) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('No autenticado');
  }
  
  // Admin siempre puede acceder
  if (currentUser.role === 'admin') {
    return currentUser;
  }
  
  // Solo profesores pueden gestionar materias
  if (currentUser.role !== 'teacher') {
    throw new Error('Solo los profesores pueden gestionar materias');
  }
  
  // Verificar que el profesor esté asignado a la materia
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: subject, error } = await supabase
    .from('subjects')
    .select('teacher_id')
    .eq('id', subjectId)
    .single();
    
  if (error || !subject) {
    throw new Error('Materia no encontrada');
  }
  
  if (subject.teacher_id !== currentUser.id) {
    throw new Error('No tienes permisos para gestionar esta materia');
  }
  
  return currentUser;
}

export const PERMISSIONS = {
  // Administrador puede hacer todo
  ADMIN: {
    canManageUsers: true,
    canManageAllSubjects: true,
    canManageSystem: true,
    canViewAllData: true
  },
  
  // Profesor puede gestionar SUS materias
  TEACHER: {
    canManageOwnSubjects: true,
    canCreateAssignments: true,
    canGradeAssignments: true,
    canManageSubjectContent: true,
    canViewStudentSubmissions: true
  },
  
  // Estudiante solo puede ver y participar
  STUDENT: {
    canViewEnrolledSubjects: true,
    canSubmitAssignments: true,
    canViewOwnGrades: true,
    canDownloadMaterials: true
  }
};
