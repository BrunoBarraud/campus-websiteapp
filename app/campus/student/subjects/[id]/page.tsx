"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import LoadingSpinner from "../../../../../components/ui/LoadingSpinner";
import UnitAccordionStudent from "@/components/student/UnitAccordionStudent";
import SubjectHeroCard from "@/components/subjects/SubjectHeroCard";
import { CalendarDays, ListChecks, MessageSquare } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  year: number;
  division?: string;
  image_url: string | null;
}

export default function StudentSubjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { id: subjectId } = params as { id: string };

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [nextDueLabel, setNextDueLabel] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.role !== "student") {
      router.push("/campus/login");
      return;
    }

    fetchSubject();
    fetchSummary();
  }, [session, status, subjectId]);

  const fetchSubject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/subjects/${subjectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar la materia");
      }

      setSubject(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`/api/student/subjects/${subjectId}/assignments`);
      if (!response.ok) {
        setProgress(null);
        setNextDueLabel(null);
        return;
      }

      const assignments = await response.json();
      const arr = Array.isArray(assignments) ? assignments : [];

      const active = arr.filter((a: any) => a && a.is_active);
      const completed = active.filter((a: any) => Boolean(a.submission));

      if (active.length > 0) {
        setProgress(Math.round((completed.length / active.length) * 100));
      } else {
        setProgress(null);
      }

      const now = new Date();
      const pendingWithDue = active
        .filter((a: any) => !a.submission && a.due_date)
        .map((a: any) => ({
          title: String(a.title ?? ""),
          due: new Date(a.due_date),
        }))
        .filter((x: any) => x.due && !isNaN(x.due.getTime()) && x.due.getTime() >= now.getTime())
        .sort((a: any, b: any) => a.due.getTime() - b.due.getTime());

      if (pendingWithDue.length > 0) {
        const first = pendingWithDue[0];
        const dd = first.due.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
        setNextDueLabel(`${dd} - ${first.title}`.trim());
      } else {
        setNextDueLabel("Sin entregas próximas");
      }
    } catch {
      setProgress(null);
      setNextDueLabel(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Cargando contenido..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border-2 border-red-100 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Volver
            </button>
            <button
              onClick={fetchSubject}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page dashboard-stack font-sans text-slate-800">
      <SubjectHeroCard
        title={subject?.name || "Materia"}
        teacher={null}
        progress={progress}
        nextDueLabel={nextDueLabel}
        rightSlot={
          <button
            onClick={() => router.push(`/campus/student/subjects/${subjectId}/assignments`)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors border border-white/20"
            type="button"
          >
            Ver tareas
          </button>
        }
      />

      <div className="mx-auto mt-1 w-full max-w-4xl sm:mt-2">
        <section className="app-panel">
          <div className="mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Accesos rapidos
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => router.push(`/campus/student/subjects/${subjectId}/assignments`)}
            className="rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/40"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Tus tareas</p>
                <p className="text-xs text-slate-500 mt-1">Ver pendientes, entregadas y calificadas</p>
              </div>
              <ListChecks className="w-5 h-5 text-indigo-600" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push(`/campus/student/subjects/${subjectId}/forums`)}
            className="rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/40"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Foros</p>
                <p className="text-xs text-slate-500 mt-1">Hacer preguntas y seguir respuestas del curso</p>
              </div>
              <MessageSquare className="w-5 h-5 text-indigo-600" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/campus/calendar")}
            className="rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/40"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Calendario</p>
                <p className="text-xs text-slate-500 mt-1">Consultar eventos y vencimientos del campus</p>
              </div>
              <CalendarDays className="w-5 h-5 text-indigo-600" />
            </div>
          </button>
          </div>
        </section>

        <div className="mb-3">
          <h3 className="text-lg font-semibold text-slate-900">Unidades y materiales</h3>
          <p className="text-sm text-slate-500">Revisa contenido, foros y tareas disponibles de la materia.</p>
        </div>

        <UnitAccordionStudent subjectId={subjectId} subjectName={subject?.name || ""} />
      </div>
    </div>
  );
}
