import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, year, division } = await request.json();

    // Validaciones básicas
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email' },
        { status: 409 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar para desarrollo
      user_metadata: {
        name,
        role: 'student' // Por defecto los registros son estudiantes
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Error al crear la cuenta. Intenta nuevamente.' },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Error al crear la cuenta' },
        { status: 500 }
      );
    }

    // Crear perfil de usuario en la tabla users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        password: hashedPassword, // Guardamos el hash para compatibilidad con el login local
        name,
        role: 'student',
        year: year || null,
        division: division || null,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user profile:', userError);
      
      // Limpiar usuario de auth si falla la creación del perfil
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: 'Error al crear el perfil de usuario' },
        { status: 500 }
      );
    }

    // Auto-inscribir al estudiante en materias de su año si especificó año
    if (year) {
      try {
        const { data: subjects } = await supabaseAdmin
          .from('subjects')
          .select('id')
          .eq('year', year)
          .eq('is_active', true);

        if (subjects && subjects.length > 0) {
          const enrollments = subjects.map(subject => ({
            student_id: userData.id,
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
        console.log('Error en auto-inscripción (no crítico):', enrollError);
        // No fallar el registro si la inscripción falla
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        year: userData.year,
        division: userData.division
      },
      message: 'Usuario registrado exitosamente'
    });

  } catch (error: unknown) {
    console.error('Error in register API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
