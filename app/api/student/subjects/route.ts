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

    // Obtener las materias en las que está inscrito el estudiante
    // Solo materias de su misma división
    const query = supabaseAdmin
      .from("student_subjects")
      .select(
        `
        id,
        student_id,
        subject_id,
        enrolled_at,
        is_active,
        subjects!inner (
          id,
          name,
          code,
          description,
          year,
          semester,
          credits,
          division,
          teacher_id,
          image_url,
          is_active,
          teacher:users!subjects_teacher_id_fkey(id, name, email)
        )
      `
      )
      .eq("student_id", currentUser.id)
      .eq("is_active", true)
      .eq("subjects.division", currentUser.division || "A"); // Filtrar por división del estudiante

    console.log(
      "Student API: Executing query for student_id:",
      currentUser.id,
      "division:",
      currentUser.division
    );

    const { data: enrollments, error } = await query;

    if (error) {
      console.error("Student API: Error fetching enrollments:", error);
      return NextResponse.json(
        { error: "Error al obtener las materias" },
        { status: 500 }
      );
    }

    console.log(
      "Student API: Raw enrollments data:",
      JSON.stringify(enrollments, null, 2)
    );

    // Extraer las materias y filtrar por año si se especifica
    let subjects = (enrollments || [])
      .map((enrollment) => enrollment.subjects)
      .flat() // Aplanar el array de arrays
      .filter((subject) => subject && subject.is_active);

    console.log("Student API: Subjects after extraction:", subjects.length);

    if (year) {
      subjects = subjects.filter(
        (subject) => subject && subject.year === parseInt(year)
      );
      console.log(
        "Student API: Subjects after year filter:",
        subjects.length,
        "for year:",
        year
      );
    }

    // Enriquecer con información adicional para cada materia
    const enrichedSubjects = await Promise.all(
      subjects.map(async (subject) => {
        if (!subject) return null;

        // Contar unidades públicas
        const { count: unitsCount } = await supabaseAdmin
          .from("subject_units")
          .select("*", { count: "exact", head: true })
          .eq("subject_id", subject.id)
          .eq("is_active", true);

        // Contar contenidos públicos
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
      })
    );

    // Filtrar elementos nulos
    const validSubjects = enrichedSubjects.filter(
      (subject) => subject !== null
    );

    return NextResponse.json(validSubjects);
  } catch (error: unknown) {
    console.error("Error in GET /api/student/subjects:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
