// 📚 API pública para obtener información de una materia
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { userService } from '@/app/lib/services';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await userService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .select(`
        *,
        teacher:users!subjects_teacher_id_fkey(id, name, email)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos según el rol del usuario
    if (currentUser.role === 'student') {
      // Los estudiantes solo pueden ver materias de su año
      if (data.year !== currentUser.year) {
        return NextResponse.json(
          { error: 'No tienes permiso para ver esta materia' },
          { status: 403 }
        );
      }
    } else if (currentUser.role === 'teacher') {
      // Los profesores solo pueden ver sus materias asignadas
      if (data.teacher_id !== currentUser.id) {
        return NextResponse.json(
          { error: 'No tienes permiso para ver esta materia' },
          { status: 403 }
        );
      }
    }
    // Los admins pueden ver todas las materias

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error in GET /api/subjects/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
