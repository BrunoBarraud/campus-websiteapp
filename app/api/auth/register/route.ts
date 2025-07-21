import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/app/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { email, password, name, year } = await request.json();

    // Validar datos
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar año si se proporciona
    if (year && (year < 1 || year > 6)) {
      return NextResponse.json(
        { error: 'El año debe estar entre 1 y 6' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // 🔥 NUEVO: Usar Supabase Auth para crear el usuario
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          role: 'student',
          year: year || null
        },
        emailRedirectTo: `${process.env.NEXTAUTH_URL}/campus/auth/verify-email`
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      if (authError.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // El usuario se crea automáticamente en auth.users
    // Ahora sincronizar con nuestra tabla personalizada users (SIN password)
    if (authData.user) {
      // Verificar si el usuario ya existe en nuestra tabla personalizada
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (!existingUser) {
        // Solo insertar si no existe
        const { error: dbError } = await supabaseAdmin
          .from('users')
          .insert([
            {
              id: authData.user.id, // Usar el mismo ID de auth
              email: authData.user.email,
              name: name,
              role: 'student',
              year: year || null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
              // NO incluir password - Supabase Auth lo maneja de forma segura
            }
          ]);

        if (dbError) {
          console.error('Database sync error:', dbError);
          // Si hay error en la tabla personalizada, eliminar el usuario de auth
          await supabase.auth.admin.deleteUser(authData.user.id);
          
          return NextResponse.json(
            { error: 'Error al sincronizar los datos del usuario' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      { 
        message: 'Usuario registrado exitosamente. Por favor, verifica tu email para completar el registro.',
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          name: name,
          role: 'student',
          year: year || null
        },
        needsVerification: true
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    
    // Detectar si es un error de Supabase temporalmente caído
    if (error instanceof Error && error.message.includes('fetch failed')) {
      return NextResponse.json(
        { 
          error: 'Servicio temporalmente no disponible',
          details: 'La base de datos está experimentando problemas temporales. Por favor, intenta nuevamente en unos minutos.',
          retryAfter: 60000 // 1 minuto
        },
        { status: 503 }
      );
    }
    
    // Detectar error 521 de Cloudflare/Supabase
    if (error instanceof Error && error.message.includes('521')) {
      return NextResponse.json(
        { 
          error: 'Servicio de base de datos no disponible',
          details: 'El servicio de base de datos está temporalmente fuera de línea. Intenta nuevamente en unos minutos.',
          retryAfter: 60000
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
