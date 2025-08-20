import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// POST: Marcar mensajes como leídos
export async function POST(request: NextRequest) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const body = await request.json();
  const { conversation_id } = body;

  if (!conversation_id) {
    return NextResponse.json({ error: "conversation_id es requerido" }, { status: 400 });
  }

  try {
    // Verificar que el usuario participa en la conversación
    const { data: participation, error: partError } = await supabaseAdmin
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversation_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (partError || !participation) {
      return NextResponse.json({ error: "No tienes acceso a esta conversación" }, { status: 403 });
    }

    // Actualizar last_read_at a la fecha actual
    const { error: updateError } = await supabaseAdmin
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversation_id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating last_read_at:", updateError);
      return NextResponse.json({ error: "Error al marcar como leído" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in mark-read endpoint:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}