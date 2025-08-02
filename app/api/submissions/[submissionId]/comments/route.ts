// 💬 API para comentarios en entregas de estudiantes
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener comentarios de una entrega
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { submissionId } = await params;

    // Verificar que el usuario tiene acceso a esta entrega
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("assignment_submissions")
      .select("student_id, assignment_id")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Entrega no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos: estudiante solo ve su entrega, profesores ven todas
    if (
      currentUser.role === "student" &&
      submission.student_id !== currentUser.id
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para ver estos comentarios" },
        { status: 403 }
      );
    }

    // Obtener comentarios con información del autor
    const { data: comments, error } = await supabaseAdmin
      .from("submission_comments")
      .select(
        `
        id,
        submission_id,
        author_id,
        content,
        line_number,
        is_resolved,
        created_at,
        updated_at,
        author:users!submission_comments_author_id_fkey(id, name, role),
        replies:submission_comment_replies(
          id,
          comment_id,
          author_id,
          content,
          created_at,
          author:users!submission_comment_replies_author_id_fkey(id, name, role)
        )
      `
      )
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json(
        { error: "Error al obtener comentarios" },
        { status: 500 }
      );
    }

    return NextResponse.json(comments || []);
  } catch (error) {
    console.error("Error in GET comments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - Crear comentario en una entrega
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { submissionId } = await params;

    const { content, line_number, parent_comment_id } = await request.json();

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "El contenido del comentario es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la entrega existe y el usuario tiene permisos
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("assignment_submissions")
      .select("student_id, assignment_id")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Entrega no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos: estudiante solo puede comentar en su entrega
    if (
      currentUser.role === "student" &&
      submission.student_id !== currentUser.id
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para comentar en esta entrega" },
        { status: 403 }
      );
    }

    let result;

    if (parent_comment_id) {
      // Es una respuesta a un comentario existente
      const { data, error } = await supabaseAdmin
        .from("submission_comment_replies")
        .insert([
          {
            comment_id: parent_comment_id,
            author_id: currentUser.id,
            content: content.trim(),
          },
        ])
        .select(
          `
          id,
          comment_id,
          author_id,
          content,
          created_at,
          author:users!submission_comment_replies_author_id_fkey(id, name, role)
        `
        )
        .single();

      if (error) {
        console.error("Error creating comment reply:", error);
        return NextResponse.json(
          { error: "Error al crear respuesta" },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Es un comentario principal
      const { data, error } = await supabaseAdmin
        .from("submission_comments")
        .insert([
          {
            submission_id: submissionId,
            author_id: currentUser.id,
            content: content.trim(),
            line_number: line_number || null,
          },
        ])
        .select(
          `
          id,
          submission_id,
          author_id,
          content,
          line_number,
          is_resolved,
          created_at,
          author:users!submission_comments_author_id_fkey(id, name, role)
        `
        )
        .single();

      if (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
          { error: "Error al crear comentario" },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in POST comments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT - Actualizar comentario (marcar como resuelto, editar)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { submissionId } = await params;

    const { comment_id, is_resolved, content } = await request.json();

    if (!comment_id) {
      return NextResponse.json(
        { error: "ID del comentario es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el comentario existe y pertenece a esta entrega
    const { data: comment, error: commentError } = await supabaseAdmin
      .from("submission_comments")
      .select("id, author_id, submission_id")
      .eq("id", comment_id)
      .eq("submission_id", submissionId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: "Comentario no encontrado" },
        { status: 404 }
      );
    }

    // Solo el autor del comentario o un profesor/admin puede editarlo
    if (
      comment.author_id !== currentUser.id &&
      !["admin", "teacher"].includes(currentUser.role)
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para editar este comentario" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (typeof is_resolved === "boolean") {
      updateData.is_resolved = is_resolved;
    }
    if (content !== undefined) {
      updateData.content = content.trim();
      updateData.updated_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from("submission_comments")
      .update(updateData)
      .eq("id", comment_id)
      .select(
        `
        id,
        submission_id,
        author_id,
        content,
        line_number,
        is_resolved,
        created_at,
        updated_at,
        author:users!submission_comments_author_id_fkey(id, name, role)
      `
      )
      .single();

    if (error) {
      console.error("Error updating comment:", error);
      return NextResponse.json(
        { error: "Error al actualizar comentario" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT comments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
