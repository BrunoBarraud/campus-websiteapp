import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET: Obtener mensajes de una conversación
export async function GET(request: NextRequest) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversation_id");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!conversationId) {
    return NextResponse.json({ error: "conversation_id es requerido" }, { status: 400 });
  }

  // Verificar que el usuario es participante de la conversación
  const { data: participant, error: participantError } = await supabaseAdmin
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (participantError || !participant) {
    return NextResponse.json({ error: "No tienes acceso a esta conversación" }, { status: 403 });
  }

  // Obtener mensajes de la conversación
  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("messages")
    .select(`
      *
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (messagesError) {
    return NextResponse.json({ error: "Error al obtener mensajes", details: messagesError }, { status: 500 });
  }

  // Si no hay mensajes, devolver array vacío
  if (!messages || messages.length === 0) {
    return NextResponse.json([]);
  }

  // Obtener información de los remitentes por separado
  const senderIds = [...new Set(messages.map(m => m.sender_id))];
  const { data: senders } = await supabaseAdmin
    .from("users")
    .select("id, name, email, avatar_url")
    .in("id", senderIds);

  // Agregar información del remitente a cada mensaje
  const messagesWithSenders = messages.map(message => ({
    ...message,
    sender: senders?.find(s => s.id === message.sender_id) || null
  }));

  return NextResponse.json(messagesWithSenders);
}

// POST: Crear nuevo mensaje
export async function POST(request: NextRequest) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const body = await request.json();
  const { conversation_id, content, type = "text", reply_to_id = null, file_url = null, file_name = null, file_size = null } = body;

  if (!conversation_id || !content) {
    return NextResponse.json({ error: "conversation_id y content son requeridos" }, { status: 400 });
  }

  // Verificar que el usuario es participante de la conversación
  const { data: participant, error: participantError } = await supabaseAdmin
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversation_id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (participantError || !participant) {
    return NextResponse.json({ error: "No tienes acceso a esta conversación" }, { status: 403 });
  }

  // Crear el mensaje
  const { data: message, error: messageError } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id,
      sender_id: user.id,
      content,
      type,
      reply_to_id,
      created_at: new Date().toISOString(),
      is_edited: false
    })
    .select(`
      *,
      sender:users!sender_id(id, name, email, avatar_url)
    `)
    .single();

  if (messageError) {
    return NextResponse.json({ error: "Error al crear mensaje", details: messageError }, { status: 500 });
  }

  // Si hay archivo adjunto, crear registro en message_files
  if (file_url && file_name) {
    const { error: fileError } = await supabaseAdmin
      .from("message_files")
      .insert({
        message_id: message.id,
        file_url,
        file_name,
        file_size: file_size || 0,
        uploaded_at: new Date().toISOString()
      });

    if (fileError) {
      console.error("Error al guardar archivo:", fileError);
      // No fallar el mensaje por error de archivo
    }
  }

  // Actualizar la conversación con el último mensaje
  await supabaseAdmin
    .from("conversations")
    .update({
      last_message_id: message.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", conversation_id);

  return NextResponse.json(message, { status: 201 });
}