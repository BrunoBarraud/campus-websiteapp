import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener materias del estudiante autenticado
export async function GET(request: Request) {
  try {
    const currentUser = await requireRole(["student"]);
    // Busca las materias a las que está inscripto el estudiante
    const { data: relations, error } = await supabaseAdmin
      .from("student_subjects")
      .select("subject_id")
      .eq("student_id", currentUser.id);

    if (error) {
      return NextResponse.json(
        { error: "Error al obtener materias" },
        { status: 500 }
      );
    }

    const subjectIds = relations.map((r: any) => r.subject_id);

    // Ahora busca los datos de las materias
    const { data: subjects, error: subjectsError } = await supabaseAdmin
      .from("subjects")
      .select("*")
      .in("id", subjectIds)
      .eq("is_active", true);

    if (subjectsError) {
      return NextResponse.json(
        { error: "Error al obtener materias" },
        { status: 500 }
      );
    }

    return NextResponse.json(subjects);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
