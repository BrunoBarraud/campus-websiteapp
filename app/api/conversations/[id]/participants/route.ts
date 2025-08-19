import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET: Listar participantes de una conversación
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const { id } = await context.params;
  const { data, error } = await supabaseAdmin
    .from("conversation_participants")
    .select(`user_id, joined_at, left_at, is_active, is_muted, last_read_at, role, user:users (id, name, email, avatar_url, role)`)
    .eq("conversation_id", id)
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: "Error al obtener participantes" }, { status: 500 });
  }
  return NextResponse.json(data);
}
