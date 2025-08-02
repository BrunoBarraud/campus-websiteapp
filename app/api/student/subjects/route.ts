// 🎓 API para materias del estudiante autenticado
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener materias del estudiante autenticado
export async function GET(request: Request) {
  try {
    const currentUser = await requireRole(["student"]);

    console.log(
      "Student API: User accessing subjects:",
      currentUser.email,
      "Year:",
      currentUser.year
    );

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    // Los estudiantes ven todas las materias de su año lectivo
    const studentYear = year ? parseInt(year) : currentUser.year;

    if (!studentYear) {
      return NextResponse.json(
        { error: "No se pudo determinar el año del estudiante" },
        { status: 400 }
      );
    }

    console.log("Student API: Fetching subjects for year:", studentYear);

    const { data: subjects, error } = await supabaseAdmin
      .from("subjects")
      .select(
        `
        id,
        name,
        code,
        description,
        year,
        semester,
        division,
        credits,
        teacher_id,
        image_url,
        is_active,
        created_at,
        updated_at,
        teacher:users!subjects_teacher_id_fkey(id, name, email)
      `
      )
      .eq("year", studentYear)
      .eq("is_active", true)
      .order("semester")
      .order("name");

    if (error) {
      console.error("Student API: Error fetching subjects:", error);
      return NextResponse.json(
        { error: "Error al obtener las materias" },
        { status: 500 }
      );
    }

    console.log("Student API: Found subjects:", subjects?.length || 0);

    // Enriquecer con información adicional para cada materia
    const enrichedSubjects = await Promise.all(
      (subjects || []).map(async (subject) => {
        try {
          // Contar unidades
          const { count: unitsCount } = await supabaseAdmin
            .from("subject_units")
            .select("*", { count: "exact", head: true })
            .eq("subject_id", subject.id)
            .eq("is_active", true);

          // Contar contenidos
          const { count: contentsCount } = await supabaseAdmin
            .from("subject_content")
            .select("*", { count: "exact", head: true })
            .eq("subject_id", subject.id)
            .eq("is_active", true);

          // Contar documentos públicos
          const { count: documentsCount } = await supabaseAdmin
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("subject_id", subject.id)
            .eq("is_public", true)
            .eq("is_active", true);

          return {
            ...subject,
            stats: {
              units_count: unitsCount || 0,
              contents_count: contentsCount || 0,
              documents_count: documentsCount || 0,
            },
          };
        } catch (enrichError) {
          console.error("Error enriching subject:", subject.id, enrichError);
          return {
            ...subject,
            stats: {
              units_count: 0,
              contents_count: 0,
              documents_count: 0,
            },
          };
        }
      })
    );

    console.log(
      "Student API: Returning enriched subjects:",
      enrichedSubjects.length
    );

    return NextResponse.json({
      success: true,
      data: enrichedSubjects,
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/student/subjects:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
