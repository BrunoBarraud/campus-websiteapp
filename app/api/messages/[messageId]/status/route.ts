import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// PATCH: Marcar mensaje como leído/entregado
export async function PATCH(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const { messageId } = await context.params;
  const body = await request.json();
  const { status } = body; // 'delivered' | 'read'

  let updateFields: any = {};
  if (status === "delivered") updateFields.delivered_at = new Date().toISOString();
  if (status === "read") updateFields.read_at = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("messages")
    .update(updateFields)
    .eq("id", messageId);

  if (error) {
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
