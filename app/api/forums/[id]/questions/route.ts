import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener preguntas de un foro
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["teacher", "student", "admin"]);
    const { id: forumId } = await context.params;

    // Verificar acceso al foro
    const { data: forum, error: forumError } = await supabaseAdmin
      .from("forums")
      .select("subject_id, created_by")
      .eq("id", forumId)
      .single();

    if (forumError || !forum) {
      return NextResponse.json(
        { error: "Foro no encontrado" },
        { status: 404 }
      );
    }

    // Verificar permisos según rol
    let hasAccess = false;

    if (currentUser.role === "admin") {
      hasAccess = true;
    } else if (currentUser.role === "teacher") {
      const { data: subject } = await supabaseAdmin
        .from("subjects")
        .select("id")
        .eq("id", forum.subject_id)
        .eq("teacher_id", currentUser.id)
        .single();
      hasAccess = !!subject;
    } else if (currentUser.role === "student") {
      const { data: enrollment } = await supabaseAdmin
        .from("student_subjects")
        .select("id")
        .eq("subject_id", forum.subject_id)
        .eq("student_id", currentUser.id)
        .single();
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "No tienes acceso a este foro" },
        { status: 403 }
      );
    }

    // Obtener preguntas
    let query = supabaseAdmin
      .from("forum_questions")
      .select(`
        *,
        author:users!forum_questions_author_id_fkey(id, name, email, role),
        answers:forum_answers(count)
      `)
      .eq("forum_id", forumId);

    // Los estudiantes solo ven preguntas aprobadas (excepto las propias)
    if (currentUser.role === "student") {
      query = query.or(`is_approved.eq.true,author_id.eq.${currentUser.id}`);
    }

    query = query.order("is_pinned", { ascending: false })
      .order("last_activity_at", { ascending: false });

    const { data: questions, error } = await query;

    if (error) {
      console.error("Error fetching questions:", error);
      return NextResponse.json(
        { error: "Error al obtener las preguntas" },
        { status: 500 }
      );
    }

    return NextResponse.json(questions || []);
  } catch (error: any) {
    console.error("Error in GET /api/forums/[id]/questions:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear una pregunta en el foro
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["student", "teacher", "admin"]);
    const { id: forumId } = await context.params;
    const body = await request.json();
    const { title, content } = body;

    // Validaciones
    if (!title || !content) {
      return NextResponse.json(
        { error: "title y content son requeridos" },
        { status: 400 }
      );
    }

    if (title.length < 5) {
      return NextResponse.json(
        { error: "El título debe tener al menos 5 caracteres" },
        { status: 400 }
      );
    }

    if (content.length < 10) {
      return NextResponse.json(
        { error: "El contenido debe tener al menos 10 caracteres" },
        { status: 400 }
      );
    }

    // Verificar que el foro existe y está activo
    const { data: forum, error: forumError } = await supabaseAdmin
      .from("forums")
      .select("*")
      .eq("id", forumId)
      .single();

    if (forumError || !forum) {
      return NextResponse.json(
        { error: "Foro no encontrado" },
        { status: 404 }
      );
    }

    if (!forum.is_active || forum.is_locked) {
      return NextResponse.json(
        { error: "Este foro no acepta nuevas preguntas" },
        { status: 403 }
      );
    }

    // Verificar que el usuario tiene acceso al foro
    if (currentUser.role === "student") {
      const { data: enrollment } = await supabaseAdmin
        .from("student_subjects")
        .select("id")
        .eq("subject_id", forum.subject_id)
        .eq("student_id", currentUser.id)
        .single();

      if (!enrollment) {
        return NextResponse.json(
          { error: "No estás inscrito en esta materia" },
          { status: 403 }
        );
      }
    }

    // Crear la pregunta
    const { data: question, error: insertError } = await supabaseAdmin
      .from("forum_questions")
      .insert({
        forum_id: forumId,
        title,
        content,
        author_id: currentUser.id,
        is_approved: !forum.require_approval || currentUser.role !== "student",
      })
      .select(`
        *,
        author:users!forum_questions_author_id_fkey(id, name, email, role)
      `)
      .single();

    if (insertError) {
      console.error("Error creating question:", insertError);
      return NextResponse.json(
        { error: "Error al crear la pregunta" },
        { status: 500 }
      );
    }

    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/forums/[id]/questions:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
