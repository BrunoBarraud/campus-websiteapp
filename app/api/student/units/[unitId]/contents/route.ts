import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener contenidos y tareas de una unidad y materia específica
export async function GET(
  request: Request,
  context: { params: { unitId: string } }
) {
  try {
    await requireRole(["student"]);
    const { unitId } = context.params;
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    // Obtener contenidos de la unidad y materia
    const { data: contents, error: contentError } = await supabaseAdmin
      .from("subject_content")
      .select(
        `
        id,
        title,
        content_type,
        content,
        is_pinned,
        created_at,
        created_by
      `
      )
      .eq("unit_id", unitId)
      .eq("subject_id", subjectId)
      .eq("is_active", true);

    // Obtener tareas de la unidad y materia
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from("assignments")
      .select(
        `
        id,
        title,
        description,
        due_date,
        created_at,
        creator_id
      `
      )
      .eq("unit_id", unitId)
      .eq("subject_id", subjectId)
      .eq("is_active", true);

    if (contentError || assignmentsError) {
      console.error(
        "Error fetching unit data:",
        contentError,
        assignmentsError
      );
      return NextResponse.json(
        { error: "Error al obtener los datos de la unidad" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      contents: contents || [],
      assignments: assignments || [],
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Unhandled error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
