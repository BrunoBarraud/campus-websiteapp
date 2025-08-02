// 🔔 API para marcar todas las notificaciones como leídas
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// PUT - Marcar todas las notificaciones como leídas
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await requireRole(['admin', 'teacher', 'student']);
    const { user_id } = await request.json();

    // Determinar qué usuario usar
    const targetUserId = user_id || currentUser.id;

    // Solo admins pueden marcar notificaciones de otros usuarios
    if (targetUserId !== currentUser.id && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', targetUserId)
      .eq('is_read', false)
      .select('id');

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return NextResponse.json(
        { error: 'Error al marcar todas como leídas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Todas las notificaciones marcadas como leídas',
      count: data.length
    });

  } catch (error: unknown) {
    console.error('Error in PUT /api/notifications/mark-all-read:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
