// 📚 API para gestión individual de materias (PUT/DELETE)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { userService } from '@/app/lib/services';

// GET - Obtener una materia específica
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
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (currentUser.role === 'student' && data.year !== currentUser.year) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver esta materia' },
        { status: 403 }
      );
    }

    if (currentUser.role === 'teacher' && data.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver esta materia' },
        { status: 403 }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in GET /api/admin/subjects/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar materia (Solo administradores)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await userService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden editar materias' },
        { status: 403 }
      );
    }

    const {
      name,
      code,
      description,
      year,
      semester,
      credits,
      teacher_id,
      image_url
    } = await request.json();

    // Validaciones
    if (!name || !code || !year) {
      return NextResponse.json(
        { error: 'Nombre, código y año son requeridos' },
        { status: 400 }
      );
    }

    if (year < 1 || year > 6) {
      return NextResponse.json(
        { error: 'El año debe estar entre 1 y 6' },
        { status: 400 }
      );
    }

    // Verificar que el código no exista en otra materia
    const { data: existingSubject } = await supabaseAdmin
      .from('subjects')
      .select('id')
      .eq('code', code)
      .neq('id', id)
      .single();

    if (existingSubject) {
      return NextResponse.json(
        { error: 'Ya existe otra materia con ese código' },
        { status: 400 }
      );
    }

    // Verificar que el profesor existe si se asigna uno
    if (teacher_id) {
      const { data: teacher } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('id', teacher_id)
        .eq('role', 'teacher')
        .single();

      if (!teacher) {
        return NextResponse.json(
          { error: 'El profesor seleccionado no existe o no tiene rol de profesor' },
          { status: 400 }
        );
      }
    }

    // Actualizar la materia
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .update({
        name,
        code,
        description,
        year,
        semester: semester || 1,
        credits: credits || 3,
        teacher_id: teacher_id || null,
        image_url: image_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        teacher:users!subjects_teacher_id_fkey(id, name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating subject:', error);
      return NextResponse.json(
        { error: 'Error al actualizar la materia' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in PUT /api/admin/subjects/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar materia (Solo administradores)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await userService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar materias' },
        { status: 403 }
      );
    }

    // Verificar que la materia existe
    const { data: subject } = await supabaseAdmin
      .from('subjects')
      .select('id, name')
      .eq('id', id)
      .single();

    if (!subject) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay unidades o contenido asociado
    const { data: units } = await supabaseAdmin
      .from('subject_units')
      .select('id')
      .eq('subject_id', id)
      .limit(1);

    const { data: events } = await supabaseAdmin
      .from('calendar_events')
      .select('id')
      .eq('subject_id', id)
      .limit(1);

    if (units && units.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la materia porque tiene unidades asociadas' },
        { status: 400 }
      );
    }

    if (events && events.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la materia porque tiene eventos asociados' },
        { status: 400 }
      );
    }

    // Eliminar la materia
    const { error } = await supabaseAdmin
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subject:', error);
      return NextResponse.json(
        { error: 'Error al eliminar la materia' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Materia eliminada exitosamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error in DELETE /api/admin/subjects/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
