import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// PATCH: Editar mensaje
export async function PATCH(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const { messageId } = await context.params;
  const body = await request.json();
  const { content } = body;

  // Opcional: validar tiempo y permisos para editar

  const { error } = await supabaseAdmin
    .from("messages")
    .update({ content, is_edited: true, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Error al editar mensaje" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
