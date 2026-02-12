import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

/**
 * Verifica si el usuario actual es un estudiante aprobado.
 * Retorna el usuario si está aprobado, o null si no está autenticado.
 * Lanza un error si el estudiante está pendiente o rechazado.
 */
export async function requireApprovedStudent() {
  const session = await auth();
  
  if (!session?.user) {
    return { error: 'No autenticado', status: 401 };
  }

  // Si no es estudiante, no aplica la verificación
  if (session.user.role !== 'student') {
    return { user: session.user };
  }

  // Obtener el estado de aprobación actualizado desde la BD
  const { data: dbUser, error } = await supabaseAdmin
    .from('users')
    .select('id, approval_status')
    .eq('id', session.user.id)
    .single();

  if (error || !dbUser) {
    return { error: 'Usuario no encontrado', status: 404 };
  }

  if (dbUser.approval_status === 'pending') {
    return { 
      error: 'Tu cuenta está pendiente de aprobación. No podés realizar esta acción hasta que un administrador apruebe tu cuenta.', 
      status: 403 
    };
  }

  if (dbUser.approval_status === 'rejected') {
    return { 
      error: 'Tu cuenta ha sido rechazada. Contactá a un administrador para más información.', 
      status: 403 
    };
  }

  return { user: session.user };
}

/**
 * Verifica si un estudiante puede realizar acciones (no está pendiente ni rechazado).
 * Retorna true si puede, false si no.
 */
export async function canStudentAct(userId: string): Promise<boolean> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('role, approval_status')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return false;
  }

  // Si no es estudiante, puede actuar
  if (user.role !== 'student') {
    return true;
  }

  // Solo estudiantes aprobados pueden actuar
  return user.approval_status === 'approved';
}
