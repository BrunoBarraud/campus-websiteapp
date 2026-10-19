// 👥 API para gestión individual de usuarios
import { NextResponse } from 'next/server';
import { userService } from '@/app/lib/services';
import { checkAdminAccess } from '@/app/lib/auth/adminCheck';
import { User } from '@/app/lib/types';

// Campos que se pueden editar desde este endpoint. Cualquier otro (password, id,
// approved_by, two_factor_secret, created_at, etc.) se descarta.
const EDITABLE_FIELDS = [
  'name',
  'email',
  'role',
  'year',
  'division',
  'phone',
  'bio',
  'avatar_url',
  'is_active',
  'approval_status',
  'school_id',
] as const satisfies readonly (keyof User)[];

const VALID_ROLES = ['admin', 'admin_director', 'teacher', 'student'];

function pickEditableFields(body: unknown): Partial<User> {
  const updates: Record<string, unknown> = {};
  if (!body || typeof body !== 'object') return updates;

  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      updates[field] = (body as Record<string, unknown>)[field];
    }
  }
  return updates as Partial<User>;
}

// PUT - Actualizar usuario
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.hasAccess) {
      return adminCheck.response;
    }

    const { id } = await params;
    const updates = pickEditableFields(await request.json());
    const userId = id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos válidos para actualizar' },
        { status: 400 }
      );
    }

    if (updates.role !== undefined && !VALID_ROLES.includes(updates.role)) {
      return NextResponse.json(
        { success: false, error: 'Rol inválido' },
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
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.hasAccess) {
      return adminCheck.response;
    }

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
