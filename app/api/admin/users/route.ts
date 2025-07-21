// 👥 API para gestión de usuarios con roles
import { NextResponse } from 'next/server';
import { userService } from '@/app/lib/services';
import { CreateUserForm } from '@/app/lib/types';

// GET - Obtener todos los usuarios (solo admins)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    const isActive = searchParams.get('is_active');

    const filter = {
      role: role as any,
      year: year ? parseInt(year) : undefined,
      search: search || undefined,
      is_active: isActive ? isActive === 'true' : undefined
    };

    const users = await userService.getAllUsers(filter);

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error: any) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al obtener usuarios' 
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo usuario (solo admins)
export async function POST(request: Request) {
  try {
    const userData: CreateUserForm = await request.json();

    // Validar datos requeridos
    if (!userData.name || !userData.email || !userData.password || !userData.role) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan campos requeridos: name, email, password, role' 
        },
        { status: 400 }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar que estudiantes tengan año
    if (userData.role === 'student' && !userData.year) {
      return NextResponse.json(
        { success: false, error: 'Los estudiantes deben tener un año asignado' },
        { status: 400 }
      );
    }

    // Validar que los profesores no tengan año
    if (userData.role === 'teacher' && userData.year) {
      userData.year = undefined; // Limpiar año para profesores
    }

    const newUser = await userService.createUser(userData);

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: newUser
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.message.includes('already_exists') || error.message.includes('email_taken')) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un usuario con este email' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al crear usuario' 
      },
      { status: 500 }
    );
  }
}
