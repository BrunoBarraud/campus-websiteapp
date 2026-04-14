import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";
import { requireApprovedStudent } from "@/app/lib/auth/checkApproval";
import { v4 as uuidv4 } from "uuid";

// POST - Entregar una tarea
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    // Verificar que el estudiante esté aprobado
    const approvalCheck = await requireApprovedStudent();
    if ('error' in approvalCheck) {
      return NextResponse.json({ error: approvalCheck.error }, { status: approvalCheck.status });
    }
    
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

    // Verifica que la tarea exista, esté activa y no esté vencida
    const { data: assignment } = await supabaseAdmin
      .from("assignments")
      .select("id")
      .eq("id", assignmentId)
      .eq("subject_id", subjectId)
      .eq("is_active", true)
      .gte("due_date", new Date().toISOString()) // Solo tareas no vencidas
      .single();
    if (!assignment) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let submission_text: string | null = null;
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      submission_text =
        (formData.get("submission_text") as string | null) ??
        (formData.get("content") as string | null);
      file = formData.get("file") as File | null;
    } else {
      const body = await request.json().catch(() => ({}));
      submission_text =
        typeof body?.submission_text === "string"
          ? body.submission_text
          : typeof body?.content === "string"
            ? body.content
            : null;
    }

    if ((!submission_text || submission_text.trim() === "") && (!file || file.size === 0)) {
      return NextResponse.json(
        { error: "Debes escribir una respuesta o adjuntar un archivo" },
        { status: 400 }
      );
    }

    let file_url = null;
    let file_name = null;

    if (file && file.size > 0) {
      // Sube el archivo a Supabase Storage (ajusta el bucket si es necesario)
      const fileExt = file.name.split(".").pop();
      const filePath = `submissions/${user.id}/${uuidv4()}.${fileExt}`;
      const { error: uploadError } = await supabaseAdmin.storage
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

    const payload = {
      assignment_id: assignmentId,
      student_id: user.id,
      submission_text: submission_text?.trim() || null,
      file_url,
      file_name,
      submitted_at: new Date().toISOString(),
      status: "submitted",
    };

    const { data: existingSubmission, error: existingSubmissionError } = await supabaseAdmin
      .from("assignment_submissions")
      .select("id, file_url, file_name")
      .eq("assignment_id", assignmentId)
      .eq("student_id", user.id)
      .single();

    if (existingSubmissionError && existingSubmissionError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Error al verificar la entrega existente" },
        { status: 500 }
      );
    }

    const finalPayload = {
      ...payload,
      file_url: file_url ?? existingSubmission?.file_url ?? null,
      file_name: file_name ?? existingSubmission?.file_name ?? null,
    };

    const operation = existingSubmission
      ? supabaseAdmin
          .from("assignment_submissions")
          .update(finalPayload)
          .eq("id", existingSubmission.id)
          .select("*")
          .single()
      : supabaseAdmin
          .from("assignment_submissions")
          .insert([finalPayload])
          .select("*")
          .single();

    const { data: submission, error: submitError } = await operation;

    if (submitError || !submission) {
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
