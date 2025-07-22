// 👥 API para actualizar/eliminar usuarios individuales (temporal sin autenticación para testing)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

// PUT - Actualizar usuario (temporal sin restricciones para testing)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔄 PUT: Actualizando usuario con ID: ${id}`);
    
    const {
      name,
      email,
      role,
      year,
      is_active
    } = await request.json();

    console.log('📝 Datos para actualizar:', { name, email, role, year, is_active });

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

    // Actualizar el usuario
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        name,
        email,
        role,
        year: role === 'student' ? (year || 1) : null,
        is_active: is_active !== false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, email, role, year, is_active, created_at, updated_at')
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

// DELETE - Eliminar usuario (temporal sin restricciones para testing)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🗑️ DELETE: Eliminando usuario con ID: ${id}`);
    
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
