"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import UnitAccordionTeacher from "../../../../../components/teacher/UnitAccordionTeacher";
import SubjectImageEditor from "../../../../../components/dashboard/SubjectImageEditor";
import SubjectHeroCard from "@/components/subjects/SubjectHeroCard";
import { BarChart3, FileUp, MessageSquare, Plus, Users } from "lucide-react";
interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  year: number;
  division?: string;
  image_url: string | null;
}

export default function TeacherSubjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { id: subjectId } = params as { id: string };

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [nextDueLabel, setNextDueLabel] = useState<string | null>(null);
  const [teacherStats, setTeacherStats] = useState<{
    studentsCount: number;
    pendingCorrections: number;
    participation: number | null;
  } | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !session.user) {
      router.push("/campus/login");
      return;
    }

    if (session.user.role !== "teacher") {
      router.push("/campus/dashboard");
      return;
    }

    fetchSubject();
    fetchNextDue();
    fetchTeacherStats();
  }, [session, status, router, subjectId]);

  const fetchTeacherStats = async () => {
    try {
      const res = await fetch(`/api/teacher/subjects/${subjectId}/stats`);
      if (!res.ok) {
        setTeacherStats(null);
        return;
      }

      const json = await res.json();
      setTeacherStats({
        studentsCount: Number(json?.studentsCount) || 0,
        pendingCorrections: Number(json?.pendingCorrections) || 0,
        participation:
          json?.participation === null || json?.participation === undefined
            ? null
            : Number(json.participation),
      });
    } catch {
      setTeacherStats(null);
    }
  };

  const fetchNextDue = async () => {
    try {
      const res = await fetch(`/api/subjects/${subjectId}/assignments`);
      if (!res.ok) {
        setNextDueLabel(null);
        return;
      }

      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];

      const now = new Date();
      const upcoming: Array<{ title: string; due: Date }> = arr
        .map((a: any) => ({
          title: String(a?.title ?? ""),
          due: a?.due_date ? new Date(a.due_date) : null,
        }))
        .filter((x: any): x is { title: string; due: Date } =>
          x.due && !isNaN(x.due.getTime()) && x.due.getTime() >= now.getTime()
        )
        .sort((a, b) => a.due.getTime() - b.due.getTime());

      if (upcoming.length > 0) {
        const first = upcoming[0];
        const dd = first.due.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
        setNextDueLabel(`${dd} - ${first.title}`.trim());
      } else {
        setNextDueLabel("Sin entregas próximas");
      }
    } catch {
      setNextDueLabel(null);
    }
  };

  const fetchSubject = async () => {
    try {
      setLoading(true);
      setError("");

      // Verificar que el profesor tenga acceso a esta materia
      const response = await fetch("/api/teacher/subjects");

      if (!response.ok) {
        throw new Error("Error al cargar las materias");
      }

      const subjectsData = await response.json();
      const currentSubject = subjectsData.find(
        (s: Subject) => s.id === subjectId
      );

      if (!currentSubject) {
        throw new Error(
          "Materia no encontrada o no tienes permisos para acceder a ella"
        );
      }

      setSubject(currentSubject);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching subject:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center px-4">
        <div className="bg-surface border border-border shadow-soft rounded-xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-border border-t-primary" />
          <span className="text-gray-700 dark:text-gray-200 text-sm">Cargando materia…</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center px-4">
        <div className="bg-surface rounded-xl p-8 shadow-soft border border-border text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Volver
            </button>
            <button
              onClick={fetchSubject}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:brightness-110 shadow-soft transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No subject found
  if (!subject) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center px-4">
        <div className="bg-surface rounded-xl p-8 shadow-soft border border-border text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-book text-yellow-600 text-xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Materia no encontrada
          </h2>
          <p className="text-gray-600 mb-4">
            No se pudo cargar la información de la materia solicitada.
          </p>
          <button
            onClick={() => router.push("/campus/dashboard")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:brightness-110 shadow-soft transition-all"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans text-slate-800">
      <SubjectHeroCard
        title={subject.name}
        teacher={session?.user?.name || null}
        progress={null}
        nextDueLabel={nextDueLabel}
        rightSlot={
          <div className="flex items-center gap-2">
            <SubjectImageEditor
              subjectId={subjectId}
              currentImage={subject.image_url || ""}
              canEdit={true}
              onUpdated={(newUrl: string) => setSubject((prev) => (prev ? { ...prev, image_url: newUrl } : prev))}
            />
          </div>
        }
      />

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{subject.name}</h2>
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {`${subject.year}°${subject.division ? ` '${subject.division}'` : ""}`}
                </span>
              </div>
              <p className="text-slate-500 text-sm">Panel de Docente</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                type="button"
                onClick={() => window.dispatchEvent(new Event("teacher-open-add-unit"))}
              >
                <Plus className="w-4 h-4" /> Nueva Unidad
              </button>
              <a
                className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                href={`/campus/teacher/subjects/${subjectId}/forums`}
              >
                <MessageSquare className="w-4 h-4" /> Avisos
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href={`/campus/teacher/subjects/${subjectId}/students`}
              className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer"
            >
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{teacherStats ? teacherStats.studentsCount : "—"}</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Alumnos inscriptos</p>
              </div>
            </a>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                <FileUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{teacherStats ? teacherStats.pendingCorrections : "—"}</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Por corregir</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {teacherStats
                    ? teacherStats.participation === null
                      ? "—"
                      : `${teacherStats.participation}%`
                    : "—"}
                </p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Participación</p>
              </div>
            </div>
          </div>
        </div>

        <UnitAccordionTeacher subjectId={subjectId} subjectName={subject?.name || ""} />
      </div>
    </div>
  );
}
