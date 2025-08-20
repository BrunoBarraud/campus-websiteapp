// 📤 API para entregas de tareas de estudiantes (versión simplificada sin archivos)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener entregas de una tarea (para profesores) o la entrega del estudiante
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { assignmentId } = await params;

    if (currentUser.role === "student") {
      // Estudiantes solo pueden ver su propia entrega
      const { data: submission, error } = await supabaseAdmin
        .from("assignment_submissions")
        .select(
          `
          id,
          assignment_id,
          student_id,
          content,
          file_url,
          file_name
        `
        )
        .eq("assignment_id", assignmentId)
        .eq("student_id", currentUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching student submission:", error);
        return NextResponse.json(
          { error: "Error al obtener la entrega" },
          { status: 500 }
        );
      }

      return NextResponse.json(submission || null);
    } else {
      // Profesores y admin pueden ver todas las entregas
      const { data: submissions, error } = await supabaseAdmin
        .from("assignment_submissions")
        .select(
          `
          id,
          assignment_id,
          student_id,
          content,
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
        console.error("Error fetching submissions:", error);
        return NextResponse.json(
          { error: "Error al obtener las entregas" },
          { status: 500 }
        );
      }

      return NextResponse.json(submissions || []);
    }
  } catch (error) {
    console.error("Error in GET submissions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - Crear entrega de estudiante
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const currentUser = await requireRole(["student"]);
    const { assignmentId } = await params;

    // Verificar que la tarea existe y está activa
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("assignments")
      .select("id, due_date, is_active, max_score")
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment || !assignment.is_active) {
      return NextResponse.json(
        { error: "Tarea no encontrada o inactiva" },
        { status: 404 }
      );
    }

    // Verificar si ya existe una entrega
    const { data: existingSubmission } = await supabaseAdmin
      .from("assignment_submissions")
      .select("id")
      .eq("assignment_id", assignmentId)
      .eq("student_id", currentUser.id)
      .single();

    // Determinar el tipo de contenido y manejarlo apropiadamente
    const contentType = request.headers.get("content-type");
    let content: string | null = null;
    let file: File | null = null;

    if (contentType?.includes("multipart/form-data")) {
      // Manejar FormData con archivos
      console.log("🔧 Processing FormData request");
      const formData = await request.formData();
      content = formData.get("content") as string;
      file = formData.get("file") as File;

      console.log("📄 Content from FormData:", content);
      console.log(
        "📎 File from FormData:",
        file ? `${file.name} (${file.size} bytes)` : "No file"
      );
    } else {
      // Manejar JSON (solo texto)
      console.log("📝 Processing JSON request");
      const body = await request.json();
      content = body.content;
      console.log("📄 Content from JSON:", content);
    }

    // Validar que hay contenido de texto O un archivo válido
    if ((!content || content.trim() === "") && (!file || file.size === 0)) {
      return NextResponse.json(
        { error: "Debes proporcionar contenido de texto o un archivo" },
        { status: 400 }
      );
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    // Subir archivo a Supabase Storage si existe
    if (file && file.size > 0) {
      try {
        const fileExtension = file.name.split(".").pop();
        const uniqueFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExtension}`;
        const filePath = `submissions/${assignmentId}/${currentUser.id}/${uniqueFileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from("submission-files")
            .upload(filePath, buffer, {
              contentType: file.type,
              upsert: false,
            });

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
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
      } catch (uploadError) {
        console.error("Error processing file:", uploadError);
        return NextResponse.json(
          { error: "Error al procesar el archivo" },
          { status: 500 }
        );
      }
    }

    const submissionData = {
      assignment_id: assignmentId,
      student_id: currentUser.id,
      content: content || "",
      file_url: fileUrl,
      file_name: fileName,
    };
    let result;

    if (existingSubmission) {
      // Actualizar entrega existente
      const { data, error } = await supabaseAdmin
        .from("assignment_submissions")
        .update(submissionData)
        .eq("id", existingSubmission.id)
        .select("*")
        .single();

      if (error) {
        console.error("Error updating submission:", error);
        return NextResponse.json(
          { error: "Error al actualizar la entrega" },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Crear nueva entrega
      const { data, error } = await supabaseAdmin
        .from("assignment_submissions")
        .insert([submissionData])
        .select("*")
        .single();

      if (error) {
        console.error("Error creating submission:", error);
        return NextResponse.json(
          { error: "Error al crear la entrega" },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in POST submissions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT - Calificar entrega (solo profesores y admin)
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

    // Obtener información de la tarea para validación
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

    // Verificar que la entrega existe
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

    // Validar calificación
    const maxScore = assignmentInfo.max_score;
    if (score !== null && maxScore && (score < 0 || score > maxScore)) {
      return NextResponse.json(
        { error: `La calificación debe estar entre 0 y ${maxScore}` },
        { status: 400 }
      );
    }

    // Actualizar calificación
    const { data, error } = await supabaseAdmin
      .from("assignment_submissions")
      .update({
        score: score,
        feedback: feedback || null,
      })
      .eq("id", submission_id)
      .select(
        `
        id,
        assignment_id,
        student_id,
        content,
        submitted_at,
        score,
        feedback,
        student:users!assignment_submissions_student_id_fkey(id, name, email)
      `
      )
      .single();

    if (error) {
      console.error("Error grading submission:", error);
      return NextResponse.json(
        { error: "Error al calificar la entrega" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT submissions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
