// 👥 API para gestión individual de usuarios
import { NextResponse } from 'next/server';
import { userService } from '@/app/lib/services';

// PUT - Actualizar usuario
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const userId = id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    const updatedUser = await userService.updateUser(userId, updates);

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al actualizar usuario' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar (desactivar) usuario
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    const success = await userService.deleteUser(userId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'No se pudo eliminar el usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al eliminar usuario' 
      },
      { status: 500 }
    );
  }
}
