// 💬 API para mensajes específicos de una conversación
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener mensajes de una conversación
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "50");
    const beforeId = searchParams.get("before"); // Para paginación por cursor

    // Verificar que el usuario pertenece a esta conversación
    const { data: participation, error: participationError } =
      await supabaseAdmin
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUser.id)
        .eq("is_active", true)
        .single();

    if (participationError || !participation) {
      return NextResponse.json(
        { error: "No tienes acceso a esta conversación" },
        { status: 403 }
      );
    }

    // Construir query de mensajes
    let query = supabaseAdmin
      .from("messages")
      .select(
        `
        id,
        content,
        type,
        file_url,
        file_name,
        file_size,
        reply_to_id,
        is_edited,
        edited_at,
        created_at,
        sender:users!messages_sender_id_fkey(
          id,
          name,
          email,
          role
        ),
        reply_to:messages!messages_reply_to_id_fkey(
          id,
          content,
          sender:users!messages_sender_id_fkey(name)
        )
      `
      )
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Paginación por cursor (más eficiente para chat)
    if (beforeId) {
      const { data: beforeMessage } = await supabaseAdmin
        .from("messages")
        .select("created_at")
        .eq("id", beforeId)
        .single();

      if (beforeMessage) {
        query = query.lt("created_at", beforeMessage.created_at);
      }
    }

    query = query.limit(limit);

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Error al obtener mensajes" },
        { status: 500 }
      );
    }

    // Marcar mensajes como leídos
    if (messages && messages.length > 0) {
      await supabaseAdmin.rpc("mark_messages_as_read", {
        target_conversation_id: conversationId,
        target_user_id: currentUser.id,
      });
    }

    // Invertir orden para mostrar del más antiguo al más nuevo
    const orderedMessages = messages?.reverse() || [];

    return NextResponse.json({
      messages: orderedMessages,
      hasMore: messages?.length === limit,
    });
  } catch (error) {
    console.error("Error in messages GET:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// POST - Enviar nuevo mensaje
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { id: conversationId } = await params;

    // Determinar tipo de contenido
    const contentType = request.headers.get("content-type");
    let content: string;
    let file: File | null = null;
    let replyToId: string | null = null;

    if (contentType?.includes("multipart/form-data")) {
      // Manejar FormData con posible archivo
      const formData = await request.formData();
      content = formData.get("content") as string;
      file = formData.get("file") as File;
      replyToId = formData.get("reply_to_id") as string;
    } else {
      // Manejar JSON
      const body = await request.json();
      content = body.content;
      replyToId = body.reply_to_id;
    }

    // Validaciones
    if (!content?.trim() && (!file || file.size === 0)) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío" },
        { status: 400 }
      );
    }

    // Verificar que el usuario pertenece a esta conversación
    const { data: participation, error: participationError } =
      await supabaseAdmin
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUser.id)
        .eq("is_active", true)
        .single();

    if (participationError || !participation) {
      return NextResponse.json(
        { error: "No tienes acceso a esta conversación" },
        { status: 403 }
      );
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let messageType: string = "text";

    // Procesar archivo si existe
    if (file && file.size > 0) {
      try {
        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: "El archivo es demasiado grande (máximo 10MB)" },
            { status: 400 }
          );
        }

        const fileExtension = file.name.split(".").pop();
        const uniqueFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExtension}`;
        const filePath = `conversations/${conversationId}/${currentUser.id}/${uniqueFileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from("message-files")
            .upload(filePath, buffer, {
              contentType: file.type,
              upsert: false,
            });

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          return NextResponse.json(
            { error: "Error al subir archivo" },
            { status: 500 }
          );
        }

        const { data: urlData } = supabaseAdmin.storage
          .from("message-files")
          .getPublicUrl(uploadData.path);

        fileUrl = urlData.publicUrl;
        fileName = file.name;
        fileSize = file.size;

        // Determinar tipo de mensaje basado en el archivo
        if (file.type.startsWith("image/")) {
          messageType = "image";
        } else {
          messageType = "file";
        }
      } catch (uploadError) {
        console.error("Error processing file:", uploadError);
        return NextResponse.json(
          { error: "Error al procesar archivo" },
          { status: 500 }
        );
      }
    }

    // Crear mensaje
    const messageData = {
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: content?.trim() || "",
      type: messageType,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      reply_to_id: replyToId || null,
    };

    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .insert([messageData])
      .select(
        `
        id,
        content,
        type,
        file_url,
        file_name,
        file_size,
        reply_to_id,
        is_edited,
        edited_at,
        created_at,
        sender:users!messages_sender_id_fkey(
          id,
          name,
          email,
          role
        ),
        reply_to:messages!messages_reply_to_id_fkey(
          id,
          content,
          sender:users!messages_sender_id_fkey(name)
        )
      `
      )
      .single();

    if (messageError) {
      console.error("Error creating message:", messageError);
      return NextResponse.json(
        { error: "Error al enviar mensaje" },
        { status: 500 }
      );
    }

    // Crear notificaciones para otros participantes
    const { data: otherParticipants } = await supabaseAdmin
      .from("conversation_participants")
      .select("user_id, user:users(name)")
      .eq("conversation_id", conversationId)
      .eq("is_active", true)
      .neq("user_id", currentUser.id);

    if (otherParticipants && otherParticipants.length > 0) {
      const notifications = otherParticipants.map((participant) => ({
        user_id: participant.user_id,
        title: "Nuevo mensaje",
        message: `${currentUser.name}: ${
          content || (file ? `📎 ${fileName}` : "Mensaje")
        }`,
        type: "message",
        priority: "normal",
        data: {
          conversation_id: conversationId,
          message_id: message.id,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
        },
      }));

      await supabaseAdmin.from("notifications").insert(notifications);
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error in messages POST:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// PUT - Editar mensaje
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { id: conversationId } = await params;
    const { message_id, content } = await request.json();

    if (!message_id || !content?.trim()) {
      return NextResponse.json(
        { error: "ID de mensaje y contenido son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es el propietario del mensaje
    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .select("id, sender_id, created_at")
      .eq("id", message_id)
      .eq("conversation_id", conversationId)
      .eq("sender_id", currentUser.id)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: "Mensaje no encontrado o sin permisos" },
        { status: 404 }
      );
    }

    // No permitir editar mensajes muy antiguos (más de 24 horas)
    const messageAge =
      new Date().getTime() - new Date(message.created_at).getTime();
    if (messageAge > 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "No se pueden editar mensajes de más de 24 horas" },
        { status: 400 }
      );
    }

    // Actualizar mensaje
    const { data: updatedMessage, error: updateError } = await supabaseAdmin
      .from("messages")
      .update({
        content: content.trim(),
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq("id", message_id)
      .select(
        `
        id,
        content,
        type,
        file_url,
        file_name,
        file_size,
        reply_to_id,
        is_edited,
        edited_at,
        created_at,
        sender:users!messages_sender_id_fkey(
          id,
          name,
          email,
          role
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating message:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar mensaje" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error in messages PUT:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// DELETE - Eliminar mensaje
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("message_id");

    if (!messageId) {
      return NextResponse.json(
        { error: "ID de mensaje es requerido" },
        { status: 400 }
      );
    }

    // Verificar permisos (propietario del mensaje o admin)
    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .select("id, sender_id, file_url")
      .eq("id", messageId)
      .eq("conversation_id", conversationId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: "Mensaje no encontrado" },
        { status: 404 }
      );
    }

    if (message.sender_id !== currentUser.id && currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Sin permisos para eliminar este mensaje" },
        { status: 403 }
      );
    }

    // Eliminar archivo si existe
    if (message.file_url) {
      try {
        const url = new URL(message.file_url);
        const pathParts = url.pathname.split("/");
        const filePath = pathParts.slice(-4).join("/"); // conversations/id/user/filename

        await supabaseAdmin.storage.from("message-files").remove([filePath]);
      } catch (fileError) {
        console.error("Error deleting message file:", fileError);
      }
    }

    // Marcar mensaje como eliminado (soft delete)
    const { error: deleteError } = await supabaseAdmin
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId);

    if (deleteError) {
      console.error("Error deleting message:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar mensaje" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in messages DELETE:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
