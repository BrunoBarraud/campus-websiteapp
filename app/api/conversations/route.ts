import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET: Listar conversaciones del usuario
export async function GET(request: NextRequest) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const { data, error } = await supabaseAdmin
    .from("conversation_participants")
    .select(`conversation_id, conversation:conversations (*), last_read_at, is_active, role`)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("last_read_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Error al obtener conversaciones" }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST: Crear nueva conversación
export async function POST(request: NextRequest) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const body = await request.json();
  const { type = "individual", title, description, participant_ids = [] } = body;

  const { data: conv, error: convError } = await supabaseAdmin
    .from("conversations")
    .insert({
      type,
      title,
      description,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    })
    .select()
    .single();

  if (convError || !conv) {
    return NextResponse.json({ error: "Error al crear conversación", details: convError }, { status: 500 });
  }

  // Agregar participantes
  const participants = [user.id, ...participant_ids].map((uid) => ({
    conversation_id: conv.id,
    user_id: uid,
    joined_at: new Date().toISOString(),
    is_active: true,
    role: uid === user.id ? "admin" : "member",
  }));

  const { error: partError } = await supabaseAdmin
    .from("conversation_participants")
    .insert(participants);

  if (partError) {
    return NextResponse.json({ error: "Error al agregar participantes", details: partError }, { status: 500 });
  }

  return NextResponse.json(conv, { status: 201 });
}
