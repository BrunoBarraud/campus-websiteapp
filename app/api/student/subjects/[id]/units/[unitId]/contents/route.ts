import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";
import { getUnitSections } from "@/app/lib/subjects/unitSections";

// GET - Obtener el contenido de una unidad específica para el estudiante autenticado
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const currentUser = await requireRole(["student"]);
    const { id: subjectId, unitId } = await params;

    // Verifica que el estudiante esté inscripto en la materia
    const { data: relations, error } = await supabaseAdmin
      .from("student_subjects")
      .select("subject_id")
      .eq("student_id", currentUser.id)
      .eq("subject_id", subjectId);

    if (error || !relations || relations.length === 0) {
      return NextResponse.json(
        { error: "No tienes acceso a esta materia" },
        { status: 403 }
      );
    }

    // Busca la unidad específica
    const { data: unit, error: unitError } = await supabaseAdmin
      .from("subject_units")
      .select("*")
      .eq("id", unitId)
      .eq("subject_id", subjectId)
      .eq("is_active", true)
      .single();

    if (unitError || !unit) {
      return NextResponse.json(
        { error: "Error al obtener la unidad" },
        { status: 500 }
      );
    }

    const sectionsWithAssignmentInfo = await getUnitSections(unitId, {
      contentActiveOnly: true,
    });

    return NextResponse.json({
      ...unit,
      sections: sectionsWithAssignmentInfo,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
