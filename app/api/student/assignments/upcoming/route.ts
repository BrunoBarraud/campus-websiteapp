import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["student"]);

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const days = Math.max(1, Math.min(30, Number(daysParam) || 7));

    // Materias del alumno
    const { data: relations, error: relErr } = await supabaseAdmin
      .from("student_subjects")
      .select("subject_id")
      .eq("student_id", user.id)
      .eq("is_active", true);

    if (relErr) {
      return NextResponse.json(
        { error: "Error al obtener materias del alumno" },
        { status: 500 }
      );
    }

    const subjectIds = (relations ?? [])
      .map((r: any) => r.subject_id)
      .filter(Boolean);

    if (!subjectIds.length) {
      return NextResponse.json({ count: 0, nearest: null });
    }

    const now = new Date();
    const startIso = now.toISOString();
    const endIso = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    // Traer tareas futuras (activas) de las materias del alumno
    const { data: assignments, error: aErr } = await supabaseAdmin
      .from("assignments")
      .select(
        `
        id,
        title,
        due_date,
        subject_id,
        is_active,
        subject:subjects(id, name)
      `
      )
      .in("subject_id", subjectIds)
      .eq("is_active", true)
      .gte("due_date", startIso)
      .order("due_date", { ascending: true });

    if (aErr) {
      return NextResponse.json(
        { error: "Error al obtener tareas" },
        { status: 500 }
      );
    }

    const assignmentList = (assignments ?? []).filter(
      (a: any) => a?.due_date && !isNaN(new Date(a.due_date).getTime())
    );

    if (!assignmentList.length) {
      return NextResponse.json({ count: 0, nearest: null });
    }

    // Buscar entregas del alumno para esas tareas
    const assignmentIds = assignmentList.map((a: any) => a.id);

    const { data: submissions, error: sErr } = await supabaseAdmin
      .from("assignment_submissions")
      .select("assignment_id")
      .eq("student_id", user.id)
      .in("assignment_id", assignmentIds);

    if (sErr) {
      return NextResponse.json(
        { error: "Error al obtener entregas" },
        { status: 500 }
      );
    }

    const submittedSet = new Set(
      (submissions ?? []).map((s: any) => s.assignment_id).filter(Boolean)
    );

    const pending = assignmentList.filter((a: any) => !submittedSet.has(a.id));

    const upcomingInWindow = pending.filter((a: any) => {
      const due = new Date(a.due_date).getTime();
      const end = new Date(endIso).getTime();
      return due <= end;
    });

    const nearest = pending.length
      ? (() => {
          const subj = (pending[0] as any)?.subject;
          const subjName = Array.isArray(subj) ? subj?.[0]?.name : subj?.name;

          return {
            subjectId: pending[0].subject_id as string,
            subjectName: (subjName as string) || "Materia",
            title: pending[0].title as string,
            dueDate: pending[0].due_date as string,
          };
        })()
      : null;

    return NextResponse.json({ count: upcomingInWindow.length, nearest });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
