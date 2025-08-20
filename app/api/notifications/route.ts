import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

/**
 * GET - Obtener notificaciones del usuario actual
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('notifications')
      .select(`
        *,
        sender:sender_id(id, name, email)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Error al obtener notificaciones:', error);
      return NextResponse.json(
        { error: 'Error al obtener notificaciones' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error inesperado en API de notificaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crear nueva notificación
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      user_id, 
      title, 
      message, 
      type = 'info', 
      action_url,
      metadata 
    } = body;

    // Validar campos requeridos
    if (!user_id || !title || !message) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: user_id, title, message' },
        { status: 400 }
      );
    }

    // Verificar permisos (solo admin o el propio usuario puede crear notificaciones)
    if (session.user.role !== 'admin' && session.user.id !== user_id) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear notificaciones para este usuario' },
        { status: 403 }
      );
    }

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        sender_id: session.user.id,
        title,
        message,
        type,
        action_url,
        metadata,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear notificación:', error);
      return NextResponse.json(
        { error: 'Error al crear notificación' },
        { status: 500 }
      );
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error inesperado al crear notificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Marcar todas las notificaciones como leídas
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
      return NextResponse.json(
        { error: 'Error al marcar notificaciones como leídas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error inesperado al marcar notificaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
