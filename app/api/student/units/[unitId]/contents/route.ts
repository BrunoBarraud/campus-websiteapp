import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener contenidos/secciones de una unidad para el estudiante autenticado
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const currentUser = await requireRole(["student"]);
    const { unitId } = await params;

    // Verifica que el estudiante esté inscripto en la materia
    const { data: relations, error } = await supabaseAdmin
      .from("student_subjects")
      .select("subject_id")
      .eq("student_id", currentUser.id)
      .eq("subject_id", unitId);

    if (error || !relations || relations.length === 0) {
      return NextResponse.json(
        { error: "No tienes acceso a esta materia" },
        { status: 403 }
      );
    }

    // Busca los contenidos/secciones de la unidad
    const { data: contents, error: contentsError } = await supabaseAdmin
      .from("subject_content")
      .select("*")
      .eq("unit_id", unitId)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (contentsError) {
      return NextResponse.json(
        { error: "Error al obtener contenidos" },
        { status: 500 }
      );
    }

    return NextResponse.json(contents);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
