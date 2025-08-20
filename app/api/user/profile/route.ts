import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

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
      // Campos adicionales que pueden no estar en la BD aún
      birthdate,
      location,
      course,
      student_id,
      interests,
      title
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

    // Preparar la actualización solo con campos que sabemos que existen
    const basicUpdate = {
      name: name || existingUser.name,
      phone: phone || existingUser.phone,
      bio: bio || existingUser.bio,
      updated_at: new Date().toISOString()
    };

    // Si hay una imagen de perfil, intentar guardarla en avatar_url
    if (profile_image) {
      (basicUpdate as any).avatar_url = profile_image;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(basicUpdate)
      .eq('email', session.user.email)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar perfil:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el perfil: ' + error.message },
        { status: 500 }
      );
    }

    // Combinar datos guardados con campos adicionales del frontend
    const extendedData = {
      ...data,
      birthdate: birthdate || '',
      location: location || '',
      course: course || '6to Año',
      student_id: student_id || '',
      interests: interests || [],
      title: title || 'Estudiante de Secundaria',
      profile_image: data.avatar_url || profile_image
    };

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      user: extendedData
    });

  } catch (error) {
    console.error('Error en POST /api/user/profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener el perfil del usuario usando supabaseAdmin
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
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
      // Retornar datos por defecto basados en la sesión
      const defaultData = {
        id: '',
        email: session.user.email,
        name: session.user.name || '',
        role: 'student',
        phone: '',
        bio: 'Estudiante del Instituto Privado Dalmacio Vélez Sarsfield',
        avatar_url: '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Campos adicionales
        birthdate: '',
        location: '',
        course: '6to Año',
        student_id: '',
        interests: [],
        title: 'Estudiante de Secundaria',
        profile_image: ''
      };
      return NextResponse.json(defaultData);
    }

    // Agregar campos adicionales con valores por defecto
    const extendedData = {
      ...data,
      birthdate: data.birthdate || '',
      location: data.location || '',
      course: data.course || (data.year ? `${data.year}° Año` : '6to Año'),
      student_id: data.student_id || '',
      interests: data.interests || [],
      title: data.title || 'Estudiante de Secundaria',
      profile_image: data.avatar_url || ''
    };

    return NextResponse.json(extendedData);

  } catch (error) {
    console.error('Error en GET /api/user/profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
