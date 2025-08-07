import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";
import { v4 as uuidv4 } from "uuid";

// POST - Entregar una tarea
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const user = await requireRole(["student"]);
    const { id: subjectId, assignmentId } = await params;

    // Verifica que el estudiante esté inscripto en la materia
    const { data: studentSubject } = await supabaseAdmin
      .from("student_subjects")
      .select("id")
      .eq("student_id", user.id)
      .eq("subject_id", subjectId)
      .eq("is_active", true)
      .single();

    if (!studentSubject) {
      return NextResponse.json(
        { error: "No estás inscrito en esta materia" },
        { status: 403 }
      );
    }

    // Verifica que la tarea exista y esté activa
    const { data: assignment } = await supabaseAdmin
      .from("assignments")
      .select("id")
      .eq("id", assignmentId)
      .eq("subject_id", subjectId)
      .eq("is_active", true)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Procesar datos del formulario (multipart/form-data)
    const formData = await request.formData();
    const submission_text = formData.get("submission_text") as string | null;
    const file = formData.get("file") as File | null;

    let file_url = null;
    let file_name = null;

    if (file && file.size > 0) {
      // Sube el archivo a Supabase Storage (ajusta el bucket si es necesario)
      const fileExt = file.name.split(".").pop();
      const filePath = `submissions/${user.id}/${uuidv4()}.${fileExt}`;
      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from("submission-files")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        return NextResponse.json(
          { error: "Error al subir el archivo" },
          { status: 500 }
        );
      }

      file_url = supabaseAdmin.storage
        .from("submission-files")
        .getPublicUrl(filePath).data.publicUrl;
      file_name = file.name;
    }

    // Inserta la entrega
    const { data: submission, error: insertError } = await supabaseAdmin
      .from("assignment_submissions")
      .insert([
        {
          assignment_id: assignmentId,
          student_id: user.id,
          submission_text,
          file_url,
          file_name,
          submitted_at: new Date().toISOString(),
          status: "submitted",
        },
      ])
      .select("*")
      .single();

    if (insertError || !submission) {
      return NextResponse.json(
        { error: "Error al guardar la entrega" },
        { status: 500 }
      );
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
