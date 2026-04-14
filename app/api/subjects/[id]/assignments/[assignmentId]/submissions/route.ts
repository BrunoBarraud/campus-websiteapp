import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

const normalizeSubmission = (submission: any) => {
  if (!submission) return submission;
  return {
    ...submission,
    content: submission.submission_text ?? "",
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { assignmentId } = await params;

    if (currentUser.role === "student") {
      const { data: submission, error } = await supabaseAdmin
        .from("assignment_submissions")
        .select(
          `
          id,
          assignment_id,
          student_id,
          submission_text,
          file_url,
          file_name,
          submitted_at,
          score,
          feedback,
          status
        `
        )
        .eq("assignment_id", assignmentId)
        .eq("student_id", currentUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        return NextResponse.json(
          { error: "Error al obtener la entrega" },
          { status: 500 }
        );
      }

      return NextResponse.json(normalizeSubmission(submission || null));
    }

    const { data: submissions, error } = await supabaseAdmin
      .from("assignment_submissions")
      .select(
        `
        id,
        assignment_id,
        student_id,
        submission_text,
        file_url,
        file_name,
        submitted_at,
        score,
        feedback,
        status,
        student:users!assignment_submissions_student_id_fkey(id, name, email, avatar_url)
      `
      )
      .eq("assignment_id", assignmentId);

    if (error) {
      return NextResponse.json(
        { error: "Error al obtener las entregas" },
        { status: 500 }
      );
    }

    return NextResponse.json((submissions || []).map(normalizeSubmission));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const currentUser = await requireRole(["student"]);
    const { assignmentId } = await params;

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("assignments")
      .select("id, due_date, is_active")
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment || !assignment.is_active) {
      return NextResponse.json(
        { error: "Tarea no encontrada o inactiva" },
        { status: 404 }
      );
    }

    const { data: existingSubmission, error: existingSubmissionError } =
      await supabaseAdmin
        .from("assignment_submissions")
        .select("id, file_url, file_name")
        .eq("assignment_id", assignmentId)
        .eq("student_id", currentUser.id)
        .single();

    if (existingSubmissionError && existingSubmissionError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Error al verificar la entrega existente" },
        { status: 500 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let submissionText: string | null = null;
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      submissionText =
        (formData.get("submission_text") as string | null) ??
        (formData.get("content") as string | null);
      file = formData.get("file") as File | null;
    } else {
      const body = await request.json().catch(() => ({}));
      submissionText =
        typeof body?.submission_text === "string"
          ? body.submission_text
          : typeof body?.content === "string"
            ? body.content
            : null;
    }

    if ((!submissionText || submissionText.trim() === "") && (!file || file.size === 0)) {
      return NextResponse.json(
        { error: "Debes proporcionar contenido de texto o un archivo" },
        { status: 400 }
      );
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file && file.size > 0) {
      try {
        const fileExtension = file.name.split(".").pop();
        const uniqueFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExtension}`;
        const filePath = `submissions/${assignmentId}/${currentUser.id}/${uniqueFileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from("submission-files")
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          return NextResponse.json(
            { error: "Error al subir el archivo" },
            { status: 500 }
          );
        }

        const { data: urlData } = supabaseAdmin.storage
          .from("submission-files")
          .getPublicUrl(uploadData.path);

        fileUrl = urlData.publicUrl;
        fileName = file.name;
      } catch {
        return NextResponse.json(
          { error: "Error al procesar el archivo" },
          { status: 500 }
        );
      }
    }

    const submissionData = {
      assignment_id: assignmentId,
      student_id: currentUser.id,
      submission_text: submissionText?.trim() || "",
      file_url: fileUrl ?? existingSubmission?.file_url ?? null,
      file_name: fileName ?? existingSubmission?.file_name ?? null,
      submitted_at: new Date().toISOString(),
      status: "submitted",
    };

    const operation = existingSubmission
      ? supabaseAdmin
          .from("assignment_submissions")
          .update(submissionData)
          .eq("id", existingSubmission.id)
          .select("*")
          .single()
      : supabaseAdmin
          .from("assignment_submissions")
          .insert([submissionData])
          .select("*")
          .single();

    const { data, error } = await operation;

    if (error || !data) {
      return NextResponse.json(
        { error: "Error al guardar la entrega" },
        { status: 500 }
      );
    }

    return NextResponse.json(normalizeSubmission(data), { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    await requireRole(["admin", "teacher"]);
    const { assignmentId } = await params;
    const { submission_id, score, feedback } = await request.json();

    if (!submission_id) {
      return NextResponse.json(
        { error: "ID de entrega es requerido" },
        { status: 400 }
      );
    }

    const { data: assignmentInfo, error: assignmentInfoError } =
      await supabaseAdmin
        .from("assignments")
        .select("max_score")
        .eq("id", assignmentId)
        .single();

    if (assignmentInfoError || !assignmentInfo) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("assignment_submissions")
      .select("id, assignment_id")
      .eq("id", submission_id)
      .eq("assignment_id", assignmentId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Entrega no encontrada" },
        { status: 404 }
      );
    }

    const maxScore = assignmentInfo.max_score;
    if (score !== null && maxScore && (score < 0 || score > maxScore)) {
      return NextResponse.json(
        { error: `La calificaciÃ³n debe estar entre 0 y ${maxScore}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("assignment_submissions")
      .update({
        score,
        feedback: feedback || null,
      })
      .eq("id", submission_id)
      .select(
        `
        id,
        assignment_id,
        student_id,
        submission_text,
        submitted_at,
        score,
        feedback,
        student:users!assignment_submissions_student_id_fkey(id, name, email)
      `
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Error al calificar la entrega" },
        { status: 500 }
      );
    }

    return NextResponse.json(normalizeSubmission(data));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
