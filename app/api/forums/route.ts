import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener foros (filtrados por materia o unidad)
export async function GET(request: Request) {
  try {
    const currentUser = await requireRole(["teacher", "student", "admin"]);
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subject_id");
    const unitId = searchParams.get("unit_id");

    let query = supabaseAdmin
      .from("forums")
      .select(`
        *,
        subject:subjects(id, name, code, year),
        unit:subject_units(id, title, order_index),
        creator:users!forums_created_by_fkey(id, name, email, role)
      `)
      .eq("is_active", true);

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    if (unitId) {
      query = query.eq("unit_id", unitId);
    }

    // Filtrar según el rol
    if (currentUser.role === "student") {
      // Estudiantes solo ven foros de materias donde están inscritos
      const { data: enrollments } = await supabaseAdmin
        .from("student_subjects")
        .select("subject_id")
        .eq("student_id", currentUser.id);

      const enrolledSubjectIds = enrollments?.map((e) => e.subject_id) || [];
      
      if (enrolledSubjectIds.length === 0) {
        return NextResponse.json([]);
      }

      query = query.in("subject_id", enrolledSubjectIds);
    } else if (currentUser.role === "teacher") {
      // Profesores solo ven foros de sus materias
      const { data: subjects } = await supabaseAdmin
        .from("subjects")
        .select("id")
        .eq("teacher_id", currentUser.id)
        .eq("is_active", true);

      const teacherSubjectIds = subjects?.map((s) => s.id) || [];
      
      if (teacherSubjectIds.length === 0) {
        return NextResponse.json([]);
      }

      query = query.in("subject_id", teacherSubjectIds);
    }

    query = query.order("created_at", { ascending: false });

    const { data: forums, error } = await query;

    if (error) {
      console.error("Error fetching forums:", error);
      return NextResponse.json(
        { error: "Error al obtener los foros" },
        { status: 500 }
      );
    }

    return NextResponse.json(forums || []);
  } catch (error: any) {
    console.error("Error in GET /api/forums:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo foro (solo profesores)
export async function POST(request: Request) {
  try {
    const currentUser = await requireRole(["teacher", "admin"]);
    const body = await request.json();
    const {
      subject_id,
      unit_id,
      title,
      description,
      allow_student_answers,
      require_approval,
    } = body;

    // Validaciones
    if (!subject_id || !title) {
      return NextResponse.json(
        { error: "subject_id y title son requeridos" },
        { status: 400 }
      );
    }

    if (title.length < 3) {
      return NextResponse.json(
        { error: "El título debe tener al menos 3 caracteres" },
        { status: 400 }
      );
    }

    // Verificar que la materia existe y pertenece al profesor (si no es admin)
    if (currentUser.role === "teacher") {
      const { data: subject, error: subjectError } = await supabaseAdmin
        .from("subjects")
        .select("id, teacher_id")
        .eq("id", subject_id)
        .eq("teacher_id", currentUser.id)
        .eq("is_active", true)
        .single();

      if (subjectError || !subject) {
        return NextResponse.json(
          { error: "No tienes permiso para crear foros en esta materia" },
          { status: 403 }
        );
      }
    }

    // Si se especifica unit_id, verificar que existe y pertenece a la materia
    if (unit_id) {
      const { data: unit, error: unitError } = await supabaseAdmin
        .from("subject_units")
        .select("id, subject_id")
        .eq("id", unit_id)
        .eq("subject_id", subject_id)
        .single();

      if (unitError || !unit) {
        return NextResponse.json(
          { error: "La unidad no existe o no pertenece a esta materia" },
          { status: 400 }
        );
      }
    }

    // Crear el foro
    const { data: forum, error: insertError } = await supabaseAdmin
      .from("forums")
      .insert({
        subject_id,
        unit_id: unit_id || null,
        title,
        description: description || null,
        created_by: currentUser.id,
        allow_student_answers: allow_student_answers !== false,
        require_approval: require_approval === true,
        is_active: true,
      })
      .select(`
        *,
        subject:subjects(id, name, code, year),
        unit:subject_units(id, title, order_index),
        creator:users!forums_created_by_fkey(id, name, email, role)
      `)
      .single();

    if (insertError) {
      console.error("Error creating forum:", insertError);
      return NextResponse.json(
        { error: "Error al crear el foro" },
        { status: 500 }
      );
    }

    return NextResponse.json(forum, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/forums:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
