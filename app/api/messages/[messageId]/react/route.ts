import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// PATCH: Agregar reacción/emoji a mensaje
export async function PATCH(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const { messageId } = await context.params;
  const body = await request.json();
  const { emoji } = body;

  // Opcional: tabla reactions si quieres múltiples reacciones por usuario
  const { error } = await supabaseAdmin
    .from("messages")
    .update({ emoji })
    .eq("id", messageId);

  if (error) {
    return NextResponse.json({ error: "Error al agregar reacción" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
