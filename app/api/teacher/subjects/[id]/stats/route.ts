import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher"]);
    const { id: subjectId } = await params;

    const { data: subject, error: subjectError } = await supabaseAdmin
      .from("subjects")
      .select("id, teacher_id")
      .eq("id", subjectId)
      .eq("is_active", true)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json({ error: "Materia no encontrada" }, { status: 404 });
    }

    if (currentUser.role === "teacher" && subject.teacher_id !== currentUser.id) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const { count: studentsCount, error: studentsError } = await supabaseAdmin
      .from("student_subjects")
      .select("id", { count: "exact", head: true })
      .eq("subject_id", subjectId)
      .eq("is_active", true);

    if (studentsError) {
      return NextResponse.json(
        { error: "Error al obtener alumnos" },
        { status: 500 }
      );
    }

    const { count: pendingCorrections, error: pendingError } = await supabaseAdmin
      .from("assignment_submissions")
      .select("id, assignment:assignments!inner(subject_id)", {
        count: "exact",
        head: true,
      })
      .eq("assignment.subject_id", subjectId)
      .is("score", null);

    if (pendingError) {
      return NextResponse.json(
        { error: "Error al obtener correcciones pendientes" },
        { status: 500 }
      );
    }

    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from("assignment_submissions")
      .select("student_id, assignment:assignments!inner(subject_id)")
      .eq("assignment.subject_id", subjectId);

    if (submissionsError) {
      return NextResponse.json(
        { error: "Error al obtener entregas" },
        { status: 500 }
      );
    }

    const uniqueStudentsSubmitted = new Set(
      (submissions || []).map((s: any) => s?.student_id).filter(Boolean)
    );

    const participation =
      (studentsCount || 0) > 0
        ? Math.round((uniqueStudentsSubmitted.size / (studentsCount || 1)) * 100)
        : null;

    return NextResponse.json({
      studentsCount: studentsCount || 0,
      pendingCorrections: pendingCorrections || 0,
      participation,
    });
  } catch (error: any) {
    console.error("Error in GET /api/teacher/subjects/[id]/stats:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
