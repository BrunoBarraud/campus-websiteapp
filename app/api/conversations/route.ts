// 💬 API para gestión de conversaciones
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener conversaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Obtener conversaciones usando la función SQL
    const { data: conversations, error } = await supabaseAdmin
      .rpc('get_user_conversations', { target_user_id: currentUser.id });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        { error: 'Error al obtener conversaciones' },
        { status: 500 }
      );
    }

    // Aplicar paginación
    const paginatedConversations = conversations?.slice(offset, offset + limit) || [];

    return NextResponse.json({
      conversations: paginatedConversations,
      total: conversations?.length || 0
    });

  } catch (error) {
    console.error('Error in conversations GET:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva conversación
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const body = await request.json();

    const { type, title, description, participants } = body;

    // Validaciones
    if (!type || !participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        { error: 'Tipo y participantes son requeridos' },
        { status: 400 }
      );
    }

    // Para conversaciones directas, usar función especializada
    if (type === 'direct') {
      if (participants.length !== 1) {
        return NextResponse.json(
          { error: 'Las conversaciones directas requieren exactamente un participante' },
          { status: 400 }
        );
      }

      const otherUserId = participants[0];
      
      // Verificar que el otro usuario existe
      const { data: otherUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, name, role')
        .eq('id', otherUserId)
        .single();

      if (userError || !otherUser) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // Verificar permisos: estudiantes solo pueden hablar con profesores/admin
      if (currentUser.role === 'student' && otherUser.role === 'student') {
        return NextResponse.json(
          { error: 'Los estudiantes no pueden iniciar conversaciones entre ellos' },
          { status: 403 }
        );
      }

      // Crear o obtener conversación directa existente
      const { data: conversationId, error: createError } = await supabaseAdmin
        .rpc('create_direct_conversation', {
          user1_id: currentUser.id,
          user2_id: otherUserId
        });

      if (createError) {
        console.error('Error creating direct conversation:', createError);
        return NextResponse.json(
          { error: 'Error al crear conversación' },
          { status: 500 }
        );
      }

      // Obtener la conversación creada
      const { data: conversation, error: fetchError } = await supabaseAdmin
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            joined_at,
            is_active,
            user:users(id, name, email, role)
          )
        `)
        .eq('id', conversationId)
        .single();

      if (fetchError) {
        console.error('Error fetching created conversation:', fetchError);
        return NextResponse.json(
          { error: 'Error al obtener conversación creada' },
          { status: 500 }
        );
      }

      return NextResponse.json(conversation);
    }

    // Para conversaciones grupales (solo admin puede crear)
    if (type === 'group') {
      if (currentUser.role !== 'admin') {
        return NextResponse.json(
          { error: 'Solo los administradores pueden crear grupos' },
          { status: 403 }
        );
      }

      if (!title) {
        return NextResponse.json(
          { error: 'El título es requerido para grupos' },
          { status: 400 }
        );
      }

      // Crear conversación grupal
      const { data: conversation, error: conversationError } = await supabaseAdmin
        .from('conversations')
        .insert({
          type: 'group',
          title,
          description: description || null,
          created_by: currentUser.id
        })
        .select()
        .single();

      if (conversationError) {
        console.error('Error creating group conversation:', conversationError);
        return NextResponse.json(
          { error: 'Error al crear grupo' },
          { status: 500 }
        );
      }

      // Agregar creador como admin del grupo
      const participantsList = [
        { conversation_id: conversation.id, user_id: currentUser.id, role: 'admin' },
        ...participants.map((userId: string) => ({
          conversation_id: conversation.id,
          user_id: userId,
          role: 'member'
        }))
      ];

      const { error: participantsError } = await supabaseAdmin
        .from('conversation_participants')
        .insert(participantsList);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        return NextResponse.json(
          { error: 'Error al agregar participantes' },
          { status: 500 }
        );
      }

      // Obtener conversación con participantes
      const { data: fullConversation, error: fetchError } = await supabaseAdmin
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            joined_at,
            is_active,
            role,
            user:users(id, name, email, role)
          )
        `)
        .eq('id', conversation.id)
        .single();

      if (fetchError) {
        console.error('Error fetching group conversation:', fetchError);
        return NextResponse.json(
          { error: 'Error al obtener grupo creado' },
          { status: 500 }
        );
      }

      return NextResponse.json(fullConversation);
    }

    return NextResponse.json(
      { error: 'Tipo de conversación no válido' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in conversations POST:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}
