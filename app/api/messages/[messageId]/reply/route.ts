import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// POST: Responder a mensaje (cita)
export async function POST(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const { messageId } = await context.params;
  const body = await request.json();
  const { content } = body;

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      replied_to_id: messageId,
      sender_id: user.id,
      content,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Error al responder mensaje" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
