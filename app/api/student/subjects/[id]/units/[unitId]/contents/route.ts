import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

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

    // Trae los contenidos de la unidad
    const { data: sections, error: sectionsError } = await supabaseAdmin
      .from("subject_content")
      .select(`
        *,
        creator:users ( name )
      `)
      .eq("unit_id", unitId)
      .order("created_at", { ascending: true });

    if (sectionsError) {
      return NextResponse.json(
        { error: sectionsError.message || "Error al obtener contenidos" },
        { status: 500 }
      );
    }

    // Agregar assignment_id, due_date, is_active si es tarea (igual que en el otro endpoint)
    const sectionsWithAssignmentInfo = await Promise.all(
      (sections || []).map(async (section) => {
        const { creator, ...rest } = section;
        let assignment_id = null;
        let due_date = null;
        let is_active = null;
        
        if (section.content_type === "assignment") {
          const { data: assignment } = await supabaseAdmin
            .from("assignments")
            .select("id, due_date, is_active")
            .eq("subject_content_id", section.id)
            .single();
          assignment_id = assignment?.id || null;
          due_date = assignment?.due_date || null;
          is_active = assignment?.is_active ?? null;
        }
        
        return {
          ...rest,
          creator_name: creator ? creator.name : "Desconocido",
          assignment_id,
          due_date,
          is_active,
          file_url: section.file_url ?? null,
          file_name: section.file_name ?? null,
        };
      })
    );

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
