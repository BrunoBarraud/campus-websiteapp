import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["student"]);
    const { id: subjectId } = await params;

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

    // Trae las unidades
    const { data: units, error: unitsError } = await supabaseAdmin
      .from("subject_units")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (unitsError) {
      return NextResponse.json(
        { error: unitsError.message || "Error al obtener unidades" },
        { status: 500 }
      );
    }

    // Para cada unidad, busca sus contenidos
    const unitsWithContents = await Promise.all(
      (units || []).map(async (unit) => {
        const { data: contents } = await supabaseAdmin
          .from("subject_content")
          .select("*")
          .eq("unit_id", unit.id)
          .order("created_at", { ascending: true });

        return { ...unit, contents: contents || [] };
      })
    );

    return NextResponse.json(unitsWithContents);
  } catch (error: any) {
    console.error("API ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
