// 📋 API para gestión individual de tareas
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener una tarea específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    console.log("🔍 GET assignment - Starting request");

    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { id: subjectId, assignmentId } = await params;

    console.log("👤 User role:", currentUser.role);
    console.log("📚 Subject ID:", subjectId);
    console.log("📝 Assignment ID:", assignmentId);

    // Verificar que la materia existe
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from("subjects")
      .select("id, name, teacher_id")
      .eq("id", subjectId)
      .single();

    if (subjectError) {
      console.error("❌ Subject query error:", subjectError);
      return NextResponse.json(
        { error: "Error al consultar la materia" },
        { status: 500 }
      );
    }

    if (!subject) {
      console.log("❌ Subject not found");
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    console.log("✅ Subject found:", subject.name);

    // Si es profesor, verificar que es su materia
    if (
      currentUser.role === "teacher" &&
      subject.teacher_id !== currentUser.id
    ) {
      console.log("❌ Teacher permission denied");
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta materia" },
        { status: 403 }
      );
    }

    // Obtener la tarea
    let query = supabaseAdmin
      .from("assignments")
      .select(
        `
        id,
        title,
        description,
        instructions,
        due_date,
        max_score,
        is_active,
        unit_id,
        created_at,
        updated_at
      `
      )
      .eq("id", assignmentId);

    // Para estudiantes, solo pueden ver tareas activas
    if (currentUser.role === "student") {
      query = query.eq("is_active", true);
      console.log("🎓 Student query - only active assignments");
    }

    const { data: assignment, error } = await query.single();

    if (error) {
      console.error("❌ Assignment query error:", error);
      return NextResponse.json(
        { error: "Error al consultar la tarea" },
        { status: 500 }
      );
    }

    if (!assignment) {
      console.log("❌ Assignment not found");
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    console.log("✅ Assignment found:", assignment.title);

    // Verificar que la tarea pertenece a la materia correcta
    const { data: unit, error: unitError } = await supabaseAdmin
      .from("subject_units")
      .select("subject_id")
      .eq("id", assignment.unit_id)
      .single();

    if (unitError) {
      console.error("❌ Unit query error:", unitError);
      return NextResponse.json(
        { error: "Error al verificar la unidad" },
        { status: 500 }
      );
    }

    if (!unit || unit.subject_id !== subjectId) {
      console.log("❌ Assignment does not belong to subject");
      return NextResponse.json(
        { error: "Tarea no encontrada en esta materia" },
        { status: 404 }
      );
    }

    console.log("✅ Assignment validation successful");
    return NextResponse.json(assignment);
  } catch (error: any) {
    console.error("💥 Unexpected error in GET assignment:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una tarea específica
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher"]);
    const { id: subjectId, assignmentId } = await params;

    const {
      title,
      description,
      instructions,
      due_date,
      max_score,
      is_active,
      unit_id,
    } = await request.json();

    // Verificar que la materia existe y el usuario tiene permisos
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from("subjects")
      .select("id, teacher_id")
      .eq("id", subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    if (
      currentUser.role === "teacher" &&
      subject.teacher_id !== currentUser.id
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar esta materia" },
        { status: 403 }
      );
    }

    // Verificar que la tarea existe
    const { data: existingAssignment, error: assignmentError } =
      await supabaseAdmin
        .from("assignments")
        .select("id")
        .eq("id", assignmentId)
        .eq("subject_id", subjectId)
        .single();

    if (assignmentError || !existingAssignment) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar la tarea
    const { data: updatedAssignment, error: updateError } = await supabaseAdmin
      .from("assignments")
      .update({
        title,
        description,
        instructions,
        due_date,
        max_score,
        is_active,
        unit_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating assignment:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar la tarea" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error(
      "Error en PUT /api/subjects/[id]/assignments/[assignmentId]:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una tarea específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher"]);
    const { id: subjectId, assignmentId } = await params;

    // Verificar que la materia existe y el usuario tiene permisos
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from("subjects")
      .select("id, teacher_id")
      .eq("id", subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    if (
      currentUser.role === "teacher" &&
      subject.teacher_id !== currentUser.id
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar esta materia" },
        { status: 403 }
      );
    }

    // Verificar que la tarea existe
    const { data: existingAssignment, error: assignmentError } =
      await supabaseAdmin
        .from("assignments")
        .select("id")
        .eq("id", assignmentId)
        .eq("subject_id", subjectId)
        .single();

    if (assignmentError || !existingAssignment) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar las entregas relacionadas primero
    await supabaseAdmin
      .from("submissions")
      .delete()
      .eq("assignment_id", assignmentId);

    // Eliminar la tarea
    const { error: deleteError } = await supabaseAdmin
      .from("assignments")
      .delete()
      .eq("id", assignmentId);

    if (deleteError) {
      console.error("Error deleting assignment:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar la tarea" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Tarea eliminada exitosamente" });
  } catch (error) {
    console.error(
      "Error en DELETE /api/subjects/[id]/assignments/[assignmentId]:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
