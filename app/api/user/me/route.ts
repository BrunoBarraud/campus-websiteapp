// 👤 API para obtener información del usuario actual
import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { getUserPermissions } from '@/lib/types';
import { supabase } from '@/app/lib/supabaseClient';

// GET - Obtener usuario actual con sus permisos
export async function GET() {
  try {
    const currentUser = await requireAuth();
    
    console.log('User authenticated:', currentUser.email);

    const permissions = getUserPermissions(currentUser.role);

    // Devolver directamente los datos del usuario para facilitar el acceso en el frontend
    return NextResponse.json({
      ...currentUser,
      permissions
    });

  } catch (error: unknown) {
    console.error('Error getting current user:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Usuario no autenticado' ? 401 : 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener usuario actual' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar perfil del usuario actual
export async function PUT(request: Request) {
  try {
    const currentUser = await requireAuth();
    const { name, phone, bio } = await request.json();

    console.log('Updating user profile:', currentUser.email);

    // Actualizar solo los campos permitidos
    const { data, error } = await supabase
      .from('users')
      .update({
        name: name || currentUser.name,
        phone: phone || null,
        bio: bio || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Error al actualizar perfil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: data
    });

  } catch (error: unknown) {
    console.error('Error updating user profile:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Usuario no autenticado' ? 401 : 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
