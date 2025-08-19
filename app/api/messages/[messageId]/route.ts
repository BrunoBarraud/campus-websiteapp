import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET: Obtener mensaje por ID
export async function GET(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await context.params;
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();
  if (error) {
    return NextResponse.json({ error: "Error al obtener mensaje" }, { status: 500 });
  }
  return NextResponse.json(data);
}

// PATCH: Editar mensaje (redirige a /edit)
export async function PATCH(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  return NextResponse.json({ error: "Usa /edit para editar mensajes" }, { status: 400 });
}

// DELETE: Eliminar mensaje (redirige a /delete)
export async function DELETE(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  return NextResponse.json({ error: "Usa /delete para eliminar mensajes" }, { status: 400 });
}
