import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

// POST: Rechazar un estudiante
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener razón del rechazo (opcional) - para uso futuro en notificaciones
    let _reason = '';
    try {
      const body = await request.json();
      _reason = body.reason || '';
    } catch {
      // No body provided
    }
    // TODO: Usar _reason para enviar notificación al estudiante rechazado

    // Verificar que el estudiante existe
    const { data: student, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, approval_status')
      .eq('id', id)
      .eq('role', 'student')
      .single();

    if (findError || !student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    if (student.approval_status === 'rejected') {
      return NextResponse.json({ error: 'El estudiante ya está rechazado' }, { status: 400 });
    }

    // Rechazar al estudiante
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        approval_status: 'rejected',
        approved_by: session.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error rejecting student:', updateError);
      return NextResponse.json({ error: 'Error al rechazar estudiante' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Estudiante ${student.name} rechazado` 
    });
  } catch (error) {
    console.error('Error in reject student API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
