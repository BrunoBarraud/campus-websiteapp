import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// DELETE: Eliminar mensaje
export async function DELETE(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const { messageId } = await context.params;

  // Opcional: validar permisos y tiempo para eliminar

  const { error } = await supabaseAdmin
    .from("messages")
    .update({ is_deleted: true })
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Error al eliminar mensaje" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
