import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener materias del profesor autenticado
export async function GET(request: Request) {
  try {
    const currentUser = await requireRole(["teacher"]);
    console.log("Teacher accessing their subjects:", currentUser.email);

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    let query = supabaseAdmin
      .from("subjects")
      .select(
        `
        id,
        name,
        code,
        description,
        year,
        teacher_id,
        image_url,
        is_active,
        created_at,
        updated_at
      `
      )
      .eq("teacher_id", currentUser.id)
      .eq("is_active", true)
      .order("year")
      .order("name");

    if (year) {
      query = query.eq("year", parseInt(year));
    }

    const { data: subjects, error } = await query;

    if (error) {
      console.error("Error fetching teacher subjects:", error);
      return NextResponse.json(
        { error: "Error al obtener las materias" },
        { status: 500 }
      );
    }

    const enrichedSubjects = await Promise.all(
      (subjects || []).map(async (subject) => {
        const { count: unitsCount } = await supabaseAdmin
          .from("subject_units")
          .select("*", { count: "exact", head: true })
          .eq("subject_id", subject.id)
          .eq("is_active", true);

        const { count: contentsCount } = await supabaseAdmin
          .from("subject_content")
          .select("*", { count: "exact", head: true })
          .eq("subject_id", subject.id)
          .eq("is_active", true);

        const { count: documentsCount } = await supabaseAdmin
          .from("documents")
          .select("*", { count: "exact", head: true })
          .eq("subject_id", subject.id)
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

    return NextResponse.json(enrichedSubjects);
  } catch (error: any) {
    console.error("Error in GET /api/teacher/subjects:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear contenido para una materia
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    console.log("Raw body recibido:", rawBody);

    const { subject_id, content, content_type, is_pinned } =
      JSON.parse(rawBody);

    if (!subject_id || !content || !content_type) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const currentUser = await requireRole(["teacher"]);

    // Verificar que la materia pertenece al profesor autenticado
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from("subjects")
      .select("*")
      .eq("id", subject_id)
      .eq("teacher_id", currentUser.id)
      .eq("is_active", true)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        {
          error: "La materia no existe o no pertenece al profesor autenticado",
        },
        { status: 403 }
      );
    }

    // Crear contenido
    const { data: insertedContent, error: insertError } = await supabaseAdmin
      .from("subject_content")
      .insert([
        {
          subject_id,
          content,
          content_type,
          is_pinned: is_pinned || false,
          created_by: currentUser.id,
        },
      ])
      .select("id")
      .single();

    if (insertError || !insertedContent) {
      return NextResponse.json(
        { error: "Error al crear el contenido" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Contenido creado exitosamente",
        contentId: insertedContent.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/teacher/subjects:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
