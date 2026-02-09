import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { isValidDivisionForYear, yearHasDivisions } from '@/app/lib/utils/divisions';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      phone,
      bio,
      profile_image,
      year,
      division
    } = body;

    // Primero verificar que el usuario existe usando supabaseAdmin
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();

    if (checkError) {
      console.error('Error al verificar usuario:', checkError);
      return NextResponse.json(
        { error: 'Error al verificar usuario: ' + checkError.message },
        { status: 500 }
      );
    }

    if (!existingUser) {
      console.error('Usuario no encontrado en la base de datos:', session.user.email);
      return NextResponse.json(
        { error: 'Usuario no encontrado en la base de datos' },
        { status: 404 }
      );
    }

    const nextYear: number | null = year === null || year === undefined || year === '' ? null : Number(year);
    const nextDivision: string | null = division === null || division === undefined || division === '' ? null : String(division);

    if (nextYear !== null && (Number.isNaN(nextYear) || nextYear < 1 || nextYear > 6)) {
      return NextResponse.json(
        { error: 'Año inválido' },
        { status: 400 }
      );
    }

    if (nextYear !== null && !isValidDivisionForYear(nextYear, nextDivision || undefined)) {
      return NextResponse.json(
        { error: yearHasDivisions(nextYear)
          ? 'Para años de 1° a 4°, debes seleccionar una división válida (A o B)'
          : 'Para 5° y 6° año no debe haber división' },
        { status: 400 }
      );
    }

    const isStudent = session.user.role === 'student';
    const isAdmin = session.user.role === 'admin';

    // Solo bloquear si el alumno intenta CAMBIAR year/division cuando ya existen en DB.
    // Si el frontend manda los mismos valores (o manda nulls), se permite actualizar el resto del perfil.
    if (isStudent && !isAdmin) {
      const alreadyHasAcademicData = existingUser.year !== null || existingUser.division !== null;
      if (alreadyHasAcademicData) {
        const existingYear: number | null = existingUser.year ?? null;
        const existingDivision: string | null = existingUser.division ?? null;

        const normalizedNextDivision = nextDivision || null;
        const normalizedExistingDivision = existingDivision || null;

        const isAcademicChange = nextYear !== existingYear || normalizedNextDivision !== normalizedExistingDivision;
        if (isAcademicChange) {
          return NextResponse.json(
            { error: 'No podés modificar tu año/división. Contactá a un administrador.' },
            { status: 403 }
          );
        }
      }
    }

    const basicUpdate: Record<string, any> = {
      name: name ?? existingUser.name,
      phone: phone ?? existingUser.phone,
      bio: bio ?? existingUser.bio,
      updated_at: new Date().toISOString()
    };

    // Si hay una imagen de perfil, intentar guardarla en avatar_url
    if (profile_image) {
      (basicUpdate as any).avatar_url = profile_image;
    }

    if (nextYear !== null) {
      (basicUpdate as any).year = nextYear;
      (basicUpdate as any).division = yearHasDivisions(nextYear) ? nextDivision : null;
    }

    const { data: updatedUser, error: updateErr } = await supabaseAdmin
      .from('users')
      .update(basicUpdate)
      .eq('id', session.user.id)
      .select('id, email, name, role, year, division, phone, bio, avatar_url, updated_at')
      .single();

    if (updateErr) {
      console.error('Error al actualizar perfil:', updateErr);
      return NextResponse.json(
        { error: 'Error al actualizar el perfil: ' + updateErr.message },
        { status: 500 }
      );
    }

    // Auto-inscribir al estudiante en materias de su año/división (solo cuando se completa por primera vez)
    if (session.user.role === 'student' && existingUser.year === null && updatedUser?.year) {
      try {
        let query = supabaseAdmin
          .from('subjects')
          .select('id, division')
          .eq('year', updatedUser.year)
          .eq('is_active', true);

        if (yearHasDivisions(updatedUser.year)) {
          if (updatedUser.division) {
            query = query.or(`division.eq.${updatedUser.division},division.is.null`);
          } else {
            query = query.is('division', null);
          }
        }

        const { data: subjects } = await query;

        if (subjects && subjects.length > 0) {
          const enrollments = subjects.map((subject) => ({
            student_id: updatedUser.id,
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
        console.log('[Profile] Error en auto-inscripción (no crítico):', enrollError);
      }
    }

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      user: {
        ...updatedUser,
        profile_image: updatedUser.avatar_url || profile_image || ''
      }
    });

  } catch (error) {
    console.error('Error en POST /api/user/profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, phone, bio, avatar_url, avatar, year, division, is_active, created_at, updated_at')
      .eq('email', session.user.email)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener perfil:', error);
      return NextResponse.json(
        { error: 'Error al obtener el perfil: ' + error.message },
        { status: 500 }
      );
    }

    if (!data) {
      console.error('Usuario no encontrado en la base de datos:', session.user.email);
      return NextResponse.json({
        id: '',
        email: session.user.email,
        name: session.user.name || '',
        role: (session.user.role as string) || 'student',
        phone: '',
        bio: '',
        avatar_url: '',
        avatar: '',
        year: null,
        division: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile_image: ''
      });
    }

    return NextResponse.json({
      ...data,
      profile_image: data.avatar_url || data.avatar || ''
    });

  } catch (error) {
    console.error('Error en GET /api/user/profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
