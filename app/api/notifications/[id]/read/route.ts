import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

/**
 * Endpoint para marcar una notificación como leída
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar autenticación
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: notificationId } = await params;
    
    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID de notificación no proporcionado' },
        { status: 400 }
      );
    }
    
    // Verificar que la notificación pertenece al usuario
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .single();
    
    if (fetchError || !notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }
    
    if (notification.user_id !== userId) {
      return NextResponse.json(
        { error: 'No autorizado para esta notificación' },
        { status: 403 }
      );
    }
    
    // Marcar como leída
    const { error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (updateError) {
      console.error('Error al actualizar notificación:', updateError);
      return NextResponse.json(
        { error: 'Error al marcar como leída' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error inesperado en API de notificaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}