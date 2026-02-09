// 👥 API para actualizar/eliminar usuarios individuales (protegida - solo admins)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { checkAdminAccess } from '@/app/lib/auth/adminCheck';
import { isValidDivisionForYear, yearHasDivisions } from '@/app/lib/utils/divisions';

// PUT - Actualizar usuario (protegido - solo admins)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔄 PUT: Actualizando usuario con ID: ${id}`);
    
    // Verificar permisos de admin
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.hasAccess) {
      return adminCheck.response;
    }

    console.log('✅ Admin access verified for updating user by:', adminCheck.user?.email);
    
    const {
      name,
      email,
      role,
      year,
      division,
      is_active,
      recalcEnrollments
    } = await request.json();

    console.log('📝 Datos para actualizar:', { name, email, role, year, division, is_active, recalcEnrollments });

    // Validaciones básicas
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Nombre, email y rol son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el email no exista en otro usuario
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe otro usuario con ese email' },
        { status: 400 }
      );
    }

    const nextYear: number | null = role === 'student'
      ? (year === null || year === undefined || year === '' ? null : Number(year))
      : null;

    const nextDivision: string | null = division === null || division === undefined || division === '' ? null : String(division);

    if (role === 'student' && nextYear !== null && (Number.isNaN(nextYear) || nextYear < 1 || nextYear > 6)) {
      return NextResponse.json(
        { error: 'Año inválido' },
        { status: 400 }
      );
    }

    if (role === 'student' && nextYear !== null && !isValidDivisionForYear(nextYear, nextDivision || undefined)) {
      return NextResponse.json(
        { error: yearHasDivisions(nextYear)
          ? 'Para años de 1° a 4°, debes seleccionar una división válida (A o B)'
          : 'Para 5° y 6° año no debe haber división' },
        { status: 400 }
      );
    }

    // Actualizar el usuario
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        name,
        email,
        role,
        year: role === 'student' ? (nextYear ?? 1) : null,
        division: role === 'student'
          ? (nextYear !== null && yearHasDivisions(nextYear) ? nextDivision : null)
          : null,
        is_active: is_active !== false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, email, role, year, division, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('❌ Error updating user:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el usuario' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Recalcular inscripciones si corresponde (solo para students)
    if (role === 'student' && recalcEnrollments && data.id && data.year) {
      try {
        // Limpiar inscripciones existentes
        await supabaseAdmin
          .from('student_subjects')
          .delete()
          .eq('student_id', data.id);

        // Obtener materias del año/división
        let query = supabaseAdmin
          .from('subjects')
          .select('id, division')
          .eq('year', data.year)
          .eq('is_active', true);

        if (yearHasDivisions(data.year)) {
          if (data.division) {
            query = query.or(`division.eq.${data.division},division.is.null`);
          } else {
            query = query.is('division', null);
          }
        }

        const { data: subjects } = await query;

        if (subjects && subjects.length > 0) {
          const enrollments = subjects.map(subject => ({
            student_id: data.id,
            subject_id: subject.id
          }));

          await supabaseAdmin
            .from('student_subjects')
            .upsert(enrollments, {
              onConflict: 'student_id,subject_id',
              ignoreDuplicates: true
            });
        }
      } catch (enrollError) {
        console.log('Error recalculando inscripciones (no crítico):', enrollError);
      }
    }

    console.log('✅ Usuario actualizado exitosamente:', data);
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('💥 Error in PUT /api/users/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar usuario (protegido - solo admins)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🗑️ DELETE: Eliminando usuario con ID: ${id}`);
    
    // Verificar permisos de admin
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.hasAccess) {
      return adminCheck.response;
    }

    console.log('✅ Admin access verified for deleting user by:', adminCheck.user?.email);
    
    // Marcar como inactivo en lugar de eliminar
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error deleting user:', error);
      return NextResponse.json(
        { error: 'Error al eliminar el usuario' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Usuario eliminado exitosamente:', data);
    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error: any) {
    console.error('💥 Error in DELETE /api/users/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
