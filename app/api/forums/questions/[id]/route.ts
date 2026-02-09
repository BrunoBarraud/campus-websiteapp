import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener una pregunta específica con sus respuestas
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["teacher", "student", "admin"]);
    const { id } = await context.params;

    const { data: question, error } = await supabaseAdmin
      .from("forum_questions")
      .select(`
        *,
        author:users!forum_questions_author_id_fkey(id, name, email, role),
        forum:forums(id, title, subject_id, allow_student_answers),
        answers:forum_answers(
          *,
          author:users!forum_answers_author_id_fkey(id, name, email, role),
          likes:forum_answer_likes(count)
        )
      `)
      .eq("id", id)
      .single();

    if (error || !question) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (currentUser.role === "student") {
      const { data: enrollment } = await supabaseAdmin
        .from("student_subjects")
        .select("id")
        .eq("subject_id", question.forum.subject_id)
        .eq("student_id", currentUser.id)
        .single();

      if (!enrollment && question.author_id !== currentUser.id) {
        return NextResponse.json(
          { error: "No tienes acceso a esta pregunta" },
          { status: 403 }
        );
      }
    }

    // Incrementar contador de vistas
    await supabaseAdmin
      .from("forum_questions")
      .update({ views_count: (question.views_count || 0) + 1 })
      .eq("id", id);

    return NextResponse.json(question);
  } catch (error: any) {
    console.error("Error in GET /api/forums/questions/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar una pregunta
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["teacher", "student", "admin"]);
    const { id } = await context.params;
    const body = await request.json();

    const { data: question, error: questionError } = await supabaseAdmin
      .from("forum_questions")
      .select("*, forum:forums(subject_id)")
      .eq("id", id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos
    let canUpdate = false;

    if (currentUser.role === "admin") {
      canUpdate = true;
    } else if (currentUser.role === "teacher") {
      const { data: subject } = await supabaseAdmin
        .from("subjects")
        .select("id")
        .eq("id", question.forum.subject_id)
        .eq("teacher_id", currentUser.id)
        .single();
      canUpdate = !!subject;
    } else if (question.author_id === currentUser.id) {
      canUpdate = true;
    }

    if (!canUpdate) {
      return NextResponse.json(
        { error: "No tienes permiso para actualizar esta pregunta" },
        { status: 403 }
      );
    }

    // Campos que puede actualizar el autor
    const authorFields = ["title", "content"];
    // Campos adicionales que puede actualizar el profesor
    const teacherFields = ["is_approved", "is_pinned", "is_locked", "is_answered"];

    const updates: any = { updated_at: new Date().toISOString() };

    for (const field of authorFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (currentUser.role === "teacher" || currentUser.role === "admin") {
      for (const field of teacherFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      }
    }

    const { data: updatedQuestion, error: updateError } = await supabaseAdmin
      .from("forum_questions")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        author:users!forum_questions_author_id_fkey(id, name, email, role)
      `)
      .single();

    if (updateError) {
      console.error("Error updating question:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar la pregunta" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedQuestion);
  } catch (error: any) {
    console.error("Error in PATCH /api/forums/questions/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una pregunta
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["teacher", "student", "admin"]);
    const { id } = await context.params;

    const { data: question, error: questionError } = await supabaseAdmin
      .from("forum_questions")
      .select("*, forum:forums(subject_id)")
      .eq("id", id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos
    let canDelete = false;

    if (currentUser.role === "admin") {
      canDelete = true;
    } else if (currentUser.role === "teacher") {
      const { data: subject } = await supabaseAdmin
        .from("subjects")
        .select("id")
        .eq("id", question.forum.subject_id)
        .eq("teacher_id", currentUser.id)
        .single();
      canDelete = !!subject;
    } else if (question.author_id === currentUser.id) {
      canDelete = true;
    }

    if (!canDelete) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta pregunta" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("forum_questions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting question:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar la pregunta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Pregunta eliminada exitosamente" });
  } catch (error: any) {
    console.error("Error in DELETE /api/forums/questions/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
