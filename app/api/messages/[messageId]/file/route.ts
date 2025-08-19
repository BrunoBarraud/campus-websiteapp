import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// POST: Adjuntar archivo a mensaje
export async function POST(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  const user = await requireRole(["teacher", "student", "admin"]);
  const { messageId } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "Archivo no recibido" }, { status: 400 });
  }

  // Subir archivo a Supabase Storage (o tu sistema de archivos)
  const filePath = `chat_files/${messageId}-${file.name}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("chat-files")
    .upload(filePath, file);

  if (uploadError) {
    return NextResponse.json({ error: "Error al subir archivo", detalle: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("chat-files")
    .getPublicUrl(filePath);

  // Actualizar mensaje con la URL del archivo
  const { error: updateError } = await supabaseAdmin
    .from("messages")
    .update({ file_url: publicUrlData.publicUrl, file_name: file.name })
    .eq("id", messageId);

  if (updateError) {
    return NextResponse.json({ error: "Error al actualizar mensaje" }, { status: 500 });
  }

  return NextResponse.json({ success: true, file_url: publicUrlData.publicUrl });
}
