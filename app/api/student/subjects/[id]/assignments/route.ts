import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["student"]);
    const { id: subjectId } = await params;

    // Verificar que el estudiante está inscrito en la materia
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

    // Obtener todas las tareas activas de la materia con las entregas del estudiante (si existen)
    const { data: assignments, error } = await supabaseAdmin
      .from("assignments")
      .select(
        `
        *,
        unit:subject_units (
          id,
          title
        ),
        submissions:assignment_submissions!left (
          id,
          submission_text,
          submitted_at,
          score,
          feedback,
          status,
          student_id,
          file_url,
          file_name
        )
      `
      )
      .eq("subject_id", subjectId)
      .eq("is_active", true)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching assignments:", error);
      return NextResponse.json(
        { error: "Error al obtener las tareas" },
        { status: 500 }
      );
    }

    // Procesar los datos para que cada tarea tenga la entrega del estudiante (si existe)
    const processedAssignments = (assignments ?? []).map((assignment) => ({
      ...assignment,
      submission:
        ((assignment.submissions ?? []) as any[])
          .filter((s) => s && typeof s === "object" && "student_id" in s)
          .find((s) => s.student_id === user.id) || null,
      submissions: undefined,
    }));

    return NextResponse.json(processedAssignments);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
