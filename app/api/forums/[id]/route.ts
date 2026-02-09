import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener un foro específico
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["teacher", "student", "admin"]);
    const { id } = await context.params;

    const { data: forum, error } = await supabaseAdmin
      .from("forums")
      .select(`
        *,
        subject:subjects(id, name, code, year, division),
        unit:subject_units(id, title, order_index),
        creator:users!forums_created_by_fkey(id, name, email, role)
      `)
      .eq("id", id)
      .single();

    if (error || !forum) {
      return NextResponse.json(
        { error: "Foro no encontrado" },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (currentUser.role === "student") {
      const { data: enrollment } = await supabaseAdmin
        .from("student_subjects")
        .select("id")
        .eq("subject_id", forum.subject_id)
        .eq("student_id", currentUser.id)
        .single();

      if (!enrollment) {
        return NextResponse.json(
          { error: "No tienes acceso a este foro" },
          { status: 403 }
        );
      }
    } else if (currentUser.role === "teacher") {
      const { data: subject } = await supabaseAdmin
        .from("subjects")
        .select("id")
        .eq("id", forum.subject_id)
        .eq("teacher_id", currentUser.id)
        .single();

      if (!subject) {
        return NextResponse.json(
          { error: "No tienes acceso a este foro" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(forum);
  } catch (error: any) {
    console.error("Error in GET /api/forums/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar un foro (solo el creador)
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["teacher", "admin"]);
    const { id } = await context.params;
    const body = await request.json();

    // Verificar que el foro existe y el usuario tiene permisos
    const { data: forum, error: forumError } = await supabaseAdmin
      .from("forums")
      .select("*")
      .eq("id", id)
      .single();

    if (forumError || !forum) {
      return NextResponse.json(
        { error: "Foro no encontrado" },
        { status: 404 }
      );
    }

    if (forum.created_by !== currentUser.id && currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "No tienes permiso para actualizar este foro" },
        { status: 403 }
      );
    }

    // Actualizar solo campos permitidos
    const allowedFields = [
      "title",
      "description",
      "is_active",
      "is_locked",
      "allow_student_answers",
      "require_approval",
    ];

    const updates: any = { updated_at: new Date().toISOString() };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data: updatedForum, error: updateError } = await supabaseAdmin
      .from("forums")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        subject:subjects(id, name, code, year),
        unit:subject_units(id, title, order_index),
        creator:users!forums_created_by_fkey(id, name, email, role)
      `)
      .single();

    if (updateError) {
      console.error("Error updating forum:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar el foro" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedForum);
  } catch (error: any) {
    console.error("Error in PATCH /api/forums/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un foro (solo el creador o admin)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["teacher", "admin"]);
    const { id } = await context.params;

    // Verificar que el foro existe y el usuario tiene permisos
    const { data: forum, error: forumError } = await supabaseAdmin
      .from("forums")
      .select("*")
      .eq("id", id)
      .single();

    if (forumError || !forum) {
      return NextResponse.json(
        { error: "Foro no encontrado" },
        { status: 404 }
      );
    }

    if (forum.created_by !== currentUser.id && currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar este foro" },
        { status: 403 }
      );
    }

    // Eliminar el foro (cascade eliminará preguntas y respuestas)
    const { error: deleteError } = await supabaseAdmin
      .from("forums")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting forum:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar el foro" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Foro eliminado exitosamente" });
  } catch (error: any) {
    console.error("Error in DELETE /api/forums/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
