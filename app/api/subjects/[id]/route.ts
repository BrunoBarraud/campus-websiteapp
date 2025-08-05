// 📚 API para gestionar materias con permisos por rol
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireSubjectTeacher, requireRole, requireRole as requireAuth } from '@/app/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth(['admin', 'teacher', 'student']);

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
    }
    // Los profesores y admins pueden ver todas las materias
    // La restricción de edición se maneja en el frontend
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

// PUT - Actualizar materia (solo profesores de la materia y admins)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔄 PUT: Actualizando materia con ID: ${id}`);
    
    // Verificar que el usuario sea profesor de esta materia o admin
    await requireSubjectTeacher(id); // Solo para verificación de permisos
    
    const {
      name,
      code,
      description,
      year,
      division,
      teacher_id,
      image_url
    } = await request.json();

    console.log('📝 Datos para actualizar:', { name, code, description, year, division });

    // Validaciones básicas
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

    // Actualizar la materia
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .update({
        name,
        code,
        description,
        year,
        division: division || null,
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
      console.error('❌ Error updating subject:', error);
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

    console.log('✅ Materia actualizada exitosamente:', data);
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: unknown) {
    console.error('💥 Error in PUT /api/subjects/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar materia (solo admins)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🗑️ DELETE: Eliminando materia con ID: ${id}`);
    
    // Solo admins pueden eliminar materias
    await requireRole(['admin']);
    
    // Marcar como inactiva en lugar de eliminar
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error deleting subject:', error);
      return NextResponse.json(
        { error: 'Error al eliminar la materia' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    console.log('✅ Materia eliminada exitosamente:', data);
    return NextResponse.json({
      success: true,
      message: 'Materia eliminada exitosamente'
    });

  } catch (error: unknown) {
    console.error('💥 Error in DELETE /api/subjects/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
