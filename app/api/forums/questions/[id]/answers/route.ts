import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// POST - Crear una respuesta
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["teacher", "student", "admin"]);
    const { id: questionId } = await context.params;
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "El contenido es requerido" },
        { status: 400 }
      );
    }

    const { data: question, error: questionError } = await supabaseAdmin
      .from("forum_questions")
      .select("*, forum:forums(subject_id, allow_student_answers)")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    if (question.is_locked) {
      return NextResponse.json(
        { error: "Esta pregunta no acepta más respuestas" },
        { status: 403 }
      );
    }

    let canAnswer = false;
    let isTeacherAnswer = false;

    if (currentUser.role === "admin") {
      canAnswer = true;
      isTeacherAnswer = true;
    } else if (currentUser.role === "teacher") {
      const { data: subject } = await supabaseAdmin
        .from("subjects")
        .select("id")
        .eq("id", question.forum.subject_id)
        .eq("teacher_id", currentUser.id)
        .single();
      canAnswer = !!subject;
      isTeacherAnswer = canAnswer;
    } else if (currentUser.role === "student") {
      if (!question.forum.allow_student_answers) {
        return NextResponse.json(
          { error: "Solo el profesor puede responder en este foro" },
          { status: 403 }
        );
      }

      const { data: enrollment } = await supabaseAdmin
        .from("student_subjects")
        .select("id")
        .eq("subject_id", question.forum.subject_id)
        .eq("student_id", currentUser.id)
        .single();

      canAnswer = !!enrollment;
    }

    if (!canAnswer) {
      return NextResponse.json(
        { error: "No tienes permiso para responder" },
        { status: 403 }
      );
    }

    const { data: answer, error: insertError } = await supabaseAdmin
      .from("forum_answers")
      .insert({
        question_id: questionId,
        content,
        author_id: currentUser.id,
        is_teacher_answer: isTeacherAnswer,
      })
      .select(`
        *,
        author:users!forum_answers_author_id_fkey(id, name, email, role)
      `)
      .single();

    if (insertError) {
      console.error("Error creating answer:", insertError);
      return NextResponse.json(
        { error: "Error al crear la respuesta" },
        { status: 500 }
      );
    }

    return NextResponse.json(answer, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/forums/questions/[id]/answers:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
