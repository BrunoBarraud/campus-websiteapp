// 🔒 Guards para route handlers: devuelven 401/403 en vez de lanzar excepciones
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { createAccessDeniedResponse } from './adminCheck';

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  school_id?: string;
};

type GuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

/**
 * Exige una sesión válida y, opcionalmente, uno de los roles indicados.
 * - Sin sesión → 401
 * - Rol no permitido → 403
 */
export async function requireSession(allowedRoles?: string[]): Promise<GuardResult> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return {
      ok: false,
      response: createAccessDeniedResponse('Acceso denegado. Debes iniciar sesión.', 401),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { ok: false, response: createAccessDeniedResponse() };
  }

  return { ok: true, user };
}

/**
 * Admin o profesor asignado a la materia.
 */
export async function canManageSubject(user: SessionUser, subjectId: string): Promise<boolean> {
  if (user.role === 'admin') return true;
  if (user.role !== 'teacher' || !subjectId) return false;

  const { data: subject } = await supabaseAdmin
    .from('subjects')
    .select('teacher_id')
    .eq('id', subjectId)
    .single();

  return !!subject && subject.teacher_id === user.id;
}

/**
 * Admin, profesor de la materia o estudiante inscripto activo.
 */
export async function canViewSubject(user: SessionUser, subjectId: string): Promise<boolean> {
  if (await canManageSubject(user, subjectId)) return true;
  if (user.role !== 'student' || !subjectId) return false;

  const { data: enrollment } = await supabaseAdmin
    .from('student_subjects')
    .select('id')
    .eq('student_id', user.id)
    .eq('subject_id', subjectId)
    .eq('is_active', true)
    .maybeSingle();

  return !!enrollment;
}

/**
 * Participante activo de la conversación (los admins también tienen acceso).
 */
export async function isConversationParticipant(user: SessionUser, conversationId: string): Promise<boolean> {
  if (user.role === 'admin') return true;
  if (!conversationId) return false;

  const { data: participant } = await supabaseAdmin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  return !!participant;
}
