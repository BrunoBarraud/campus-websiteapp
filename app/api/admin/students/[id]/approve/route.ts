import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

// POST: Aprobar un estudiante
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

    if (session.user.role !== 'admin' && session.user.role !== 'admin_director') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar que el estudiante existe y está pendiente
    const { data: student, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, approval_status')
      .eq('id', id)
      .eq('role', 'student')
      .single();

    if (findError || !student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    if (student.approval_status === 'approved') {
      return NextResponse.json({ error: 'El estudiante ya está aprobado' }, { status: 400 });
    }

    // Aprobar al estudiante
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        approval_status: 'approved',
        approved_by: session.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error approving student:', updateError);
      return NextResponse.json({ error: 'Error al aprobar estudiante' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Estudiante ${student.name} aprobado exitosamente` 
    });
  } catch (error) {
    console.error('Error in approve student API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
