import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener info de la materia para el estudiante autenticado
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["student"]);
    const { id: subjectId } = await params;

    // Verifica que el estudiante esté inscripto en la materia
    const { data: relation, error: relError } = await supabaseAdmin
      .from("student_subjects")
      .select("subject_id")
      .eq("student_id", currentUser.id)
      .eq("subject_id", subjectId)
      .single();

    if (relError || !relation) {
      return NextResponse.json(
        { error: "No tienes acceso a esta materia" },
        { status: 403 }
      );
    }

    // Trae la info de la materia
    const { data: subject, error } = await supabaseAdmin
      .from("subjects")
      .select(
        "id, name, code, description, year, division, image_url, is_active, created_at, updated_at"
      )
      .eq("id", subjectId)
      .eq("is_active", true)
      .single();

    if (error || !subject) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(subject);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
