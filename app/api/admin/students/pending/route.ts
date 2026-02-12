import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

// GET: Listar estudiantes pendientes de aprobación
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admin y admin_director pueden ver estudiantes pendientes
    if (session.user.role !== 'admin' && session.user.role !== 'admin_director') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data: students, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, year, division, created_at, approval_status')
      .eq('role', 'student')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending students:', error);
      return NextResponse.json({ error: 'Error al obtener estudiantes' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    console.error('Error in pending students API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
