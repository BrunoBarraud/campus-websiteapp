import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener documentos de una materia para el estudiante autenticado
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } | any }
) {
  try {
    const currentUser = await requireRole(["student"]);
    const subjectId = params.id;

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

    // Busca los documentos de la materia
    const { data: documents, error: documentsError } = await supabaseAdmin
      .from("subject_documents")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("is_active", true);

    if (documentsError) {
      return NextResponse.json(
        { error: "Error al obtener documentos" },
        { status: 500 }
      );
    }

    return NextResponse.json(documents);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
