import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// POST: Enviar notificación web push
export async function POST(request: NextRequest) {
  const user = await requireRole(["admin", "teacher"]);
  const body = await request.json();
  const { user_id, title, body: messageBody, url } = body;

  // Obtener tokens del usuario
  const { data: tokens, error } = await supabaseAdmin
    .from("notification_tokens")
    .select("token")
    .eq("user_id", user_id);

  if (error || !tokens || tokens.length === 0) {
    return NextResponse.json({ error: "No se encontraron tokens" }, { status: 404 });
  }

  // Aquí deberías integrar con un servicio de push (OneSignal, Firebase, etc.)
  // Ejemplo: enviar notificación usando Web Push API (requiere backend adicional)

  // Por ahora, solo simula la respuesta
  return NextResponse.json({ success: true, tokens });
}
