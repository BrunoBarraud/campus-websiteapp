import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// POST: Mensaje de sistema (evento)
export async function POST(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const { messageId } = await context.params;
  const body = await request.json();
  const { event_type, event_data } = body;

  const { data, error } = await supabaseAdmin
    .from("system_messages")
    .insert({
      conversation_id: body.conversation_id,
      event_type,
      event_data,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Error al crear mensaje de sistema" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
