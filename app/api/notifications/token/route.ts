import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// POST: Registrar token de notificación web push
export async function POST(request: NextRequest) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const body = await request.json();
  const { token, device_info } = body;

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("notification_tokens")
    .insert({
      user_id: user.id,
      token,
      device_info,
      created_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: "Error al registrar token" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
