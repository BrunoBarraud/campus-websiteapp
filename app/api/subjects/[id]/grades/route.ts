// 📊 API para gestión de calificaciones
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Obtener calificaciones de una materia
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { id: subjectId } = await params;

    let query = supabaseAdmin
      .from("grades")
      .select(
        `
        id,
        student_id,
        subject_id,
        assignment_id,
        grade_type,
        score,
        max_score,
        percentage,
        comments,
        graded_by,
        graded_at,
        created_at,
        student:users!grades_student_id_fkey(id, name, email),
        assignment:assignments(id, title, due_date),
        grader:users!grades_graded_by_fkey(id, name)
      `
      )
      .eq("subject_id", subjectId)
      .order("graded_at", { ascending: false });

    // Si es estudiante, solo ver sus propias calificaciones
    if (currentUser.role === "student") {
      query = query.eq("student_id", currentUser.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching grades:", error);
      return NextResponse.json(
        { error: "Error al obtener calificaciones" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error in GET /api/subjects/[id]/grades:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - Crear nueva calificación (solo profesores y admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher"]);
    const { id: subjectId } = await params;

    const {
      student_id,
      assignment_id,
      grade_type,
      score,
      max_score,
      comments,
    } = await request.json();

    // Validaciones
    if (!student_id || !grade_type || score === undefined || !max_score) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (score < 0 || score > max_score) {
      return NextResponse.json(
        { error: "El puntaje debe estar entre 0 y el puntaje máximo" },
        { status: 400 }
      );
    }

    // Verificar que el estudiante está inscrito en la materia
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from("student_subjects")
      .select("id")
      .eq("student_id", student_id)
      .eq("subject_id", subjectId)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: "El estudiante no está inscrito en esta materia" },
        { status: 400 }
      );
    }

    // Verificar que la tarea existe si se especifica
    if (assignment_id) {
      const { data: assignment, error: assignmentError } = await supabaseAdmin
        .from("assignments")
        .select("id")
        .eq("id", assignment_id)
        .eq("subject_id", subjectId)
        .single();

      if (assignmentError || !assignment) {
        return NextResponse.json(
          { error: "Tarea no encontrada" },
          { status: 400 }
        );
      }
    }

    const percentage = (score / max_score) * 100;

    const { data, error } = await supabaseAdmin
      .from("grades")
      .insert([
        {
          student_id,
          subject_id: subjectId,
          assignment_id: assignment_id || null,
          grade_type,
          score,
          max_score,
          percentage,
          comments: comments || null,
          graded_by: currentUser.id,
          graded_at: new Date().toISOString(),
        },
      ])
      .select(
        `
        id,
        student_id,
        subject_id,
        assignment_id,
        grade_type,
        score,
        max_score,
        percentage,
        comments,
        graded_by,
        graded_at,
        created_at,
        student:users!grades_student_id_fkey(id, name, email),
        assignment:assignments(id, title, due_date),
        grader:users!grades_graded_by_fkey(id, name)
      `
      )
      .single();

    if (error) {
      console.error("Error creating grade:", error);
      return NextResponse.json(
        { error: "Error al crear la calificación" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error("Error in POST /api/subjects/[id]/grades:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
