import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// DELETE: Eliminar mensaje
export async function DELETE(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const { messageId } = await context.params;

  // Verificar que el mensaje existe y pertenece al usuario
  const { data: message, error: fetchError } = await supabaseAdmin
    .from("messages")
    .select("id, sender_id, created_at, conversation_id, is_deleted")
    .eq("id", messageId)
    .eq("sender_id", user.id)
    .single();

  if (fetchError || !message) {
    return NextResponse.json({ error: "Mensaje no encontrado o sin permisos" }, { status: 404 });
  }

  if (message.is_deleted) {
    return NextResponse.json({ error: "El mensaje ya está eliminado" }, { status: 400 });
  }

  // Validar tiempo límite para eliminar (15 minutos)
  const messageTime = new Date(message.created_at).getTime();
  const currentTime = new Date().getTime();
  const timeDiff = currentTime - messageTime;
  const fifteenMinutes = 15 * 60 * 1000;

  if (timeDiff > fifteenMinutes) {
    return NextResponse.json({ error: "No se puede eliminar el mensaje después de 15 minutos" }, { status: 403 });
  }

  // Verificar que el usuario es participante de la conversación
  const { data: participant, error: participantError } = await supabaseAdmin
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", message.conversation_id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (participantError || !participant) {
    return NextResponse.json({ error: "No tienes acceso a esta conversación" }, { status: 403 });
  }

  // Marcar el mensaje como eliminado (soft delete)
  const { error } = await supabaseAdmin
    .from("messages")
    .update({ 
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq("id", messageId);

  if (error) {
    return NextResponse.json({ error: "Error al eliminar mensaje", details: error }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, message: "Mensaje eliminado correctamente" });
}
