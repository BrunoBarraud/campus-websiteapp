import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/app/lib/auth";
import { supabaseAdmin } from "@/app/lib/supabaseClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { id: unitId } = await params;

    // Verificar que la unidad existe y obtener el subject_id
    const { data: unit, error: unitError } = await supabaseAdmin
      .from("subject_units")
      .select("subject_id")
      .eq("id", unitId)
      .single();

    if (unitError || !unit) {
      return NextResponse.json(
        { error: "Unidad no encontrada" },
        { status: 404 }
      );
    }

    // Verificar acceso según el rol
    if (currentUser.role === "student") {
      // Verificar que el estudiante esté inscrito en la materia
      const { data: enrollment } = await supabaseAdmin
        .from("subject_enrollments")
        .select("id")
        .eq("subject_id", unit.subject_id)
        .eq("student_id", currentUser.id)
        .single();

      if (!enrollment) {
        return NextResponse.json([]);
      }
    } else if (currentUser.role === "teacher") {
      // Verificar que el profesor sea el dueño de la materia
      const { data: subject } = await supabaseAdmin
        .from("subjects")
        .select("teacher_id")
        .eq("id", unit.subject_id)
        .single();

      if (!subject || subject.teacher_id !== currentUser.id) {
        return NextResponse.json(
          { error: "No tienes permisos para acceder a esta materia" },
          { status: 403 }
        );
      }
    }

    // Obtener el contenido filtrado según el rol
    let query = supabaseAdmin
      .from("subject_content")
      .select("*")
      .eq("unit_id", unitId)
      .eq("is_active", true);

    // Si es estudiante, filtrar solo contenido visible para estudiantes
    if (currentUser.role === "student") {
      query = query.eq("content_type", "student");
    }

    const { data, error } = await query.order("created_at", {
      ascending: true,
    });

    if (error) {
      console.error("Error fetching unit content:", error);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("Error general:", err);
    return NextResponse.json([]);
  }
}
