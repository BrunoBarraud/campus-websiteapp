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
      .select("*")
      .eq("unit_id", unitId)
      .order("created_at", { ascending: true });

    if (sectionsError) {
      return NextResponse.json(
        { error: sectionsError.message || "Error al obtener contenidos" },
        { status: 500 }
      );
    }

    // Obtener los IDs únicos de creadores
    const creatorIds = [
      ...new Set((sections || []).map((s) => s.created_by).filter(Boolean)),
    ];

    // Traer los nombres de los creadores
    let creatorsMap: Record<string, string> = {};
    if (creatorIds.length > 0) {
      const { data: creators } = await supabaseAdmin
        .from("users")
        .select("id, name")
        .in("id", creatorIds);

      creatorsMap = (creators || []).reduce(
        (acc, user) => ({ ...acc, [user.id]: user.name }),
        {}
      );
    }

    // Agregar el nombre del creador y asegurar file_url/file_name en cada sección
    const sectionsWithCreator = (sections || []).map((section) => ({
      ...section,
      creator_name: creatorsMap[section.created_by] || "Desconocido",
      file_url: section.file_url ?? null,
      file_name: section.file_name ?? null,
    }));

    return NextResponse.json({
      ...unit,
      sections: sectionsWithCreator,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
