import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener materias del estudiante autenticado
export async function GET(_request: NextRequest) {
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

    if (!subjectIds.length) {
      return NextResponse.json([]);
    }

    // Ahora busca los datos de las materias
    const { data: subjects, error: subjectsError } = await supabaseAdmin
      .from("subjects")
      .select(`
        id,
        name,
        code,
        description,
        year,
        division,
        teacher_id,
        image_url,
        is_active,
        created_at,
        updated_at,
        teacher:users!teacher_id(
          id,
          name,
          email
        )
      `)
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
