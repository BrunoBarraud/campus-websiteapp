import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";

// GET: Obtener todos los mensajes de una conversación
export async function GET(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  // messageId aquí es realmente conversationId
  const { messageId: conversationId } = await context.params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "30");
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST: Enviar mensaje a una conversación
export async function POST(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  // messageId aquí es realmente conversationId
  const { messageId: conversationId } = await context.params;
  const body = await request.json();

  const { content, message_type = "text", file_url, file_name, file_type, file_size, audio_url, emoji, replied_to_id } = body;

  if (!content && !file_url && !audio_url && !emoji) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: conversationId,
      content,
      message_type,
      file_url,
      file_name,
      file_type,
      file_size,
      audio_url,
      emoji,
      replied_to_id,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
