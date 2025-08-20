import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET: Obtener contadores de mensajes no leídos por conversación
export async function GET(request: NextRequest) {
  const user = await requireRole(["teacher", "student", "admin"]);

  try {
    // Obtener todas las conversaciones del usuario con su último mensaje leído
    const { data: participations, error: partError } = await supabaseAdmin
      .from("conversation_participants")
      .select(`
        conversation_id,
        last_read_at
      `)
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (partError) {
      console.error("Error fetching participations:", partError);
      return NextResponse.json({ error: "Error al obtener participaciones" }, { status: 500 });
    }

    const unreadCounts = [];

    for (const participation of participations || []) {
      const conversationId = participation.conversation_id;
      const lastReadAt = participation.last_read_at;

      // Contar mensajes no leídos en esta conversación
      let query = supabaseAdmin
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id); // Excluir mensajes del propio usuario

      if (lastReadAt) {
        query = query.gt("created_at", lastReadAt);
      }

      const { count, error: countError } = await query;

      if (countError) {
        console.error("Error counting unread messages:", countError);
        continue;
      }

      if (count && count > 0) {
        unreadCounts.push({
          conversation_id: conversationId,
          unread_count: count
        });
      }
    }

    return NextResponse.json(unreadCounts);
  } catch (error) {
    console.error("Error in unread messages endpoint:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}