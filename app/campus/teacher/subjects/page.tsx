"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookOpen, CalendarDays, ChevronRight, FileText, Filter, Layers3 } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  year: number;
  semester: number;
  credits: number;
  image_url: string | null;
  stats: {
    units_count: number;
    contents_count: number;
    documents_count: number;
  };
}

export default function TeacherSubjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.role !== "teacher") {
      router.push("/campus/login");
      return;
    }

    fetchSubjects();
  }, [session, status, selectedYear]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const url = selectedYear ? `/api/teacher/subjects?year=${selectedYear}` : "/api/teacher/subjects";
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar las materias");
      }

      setSubjects(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    router.push(`/campus/teacher/subjects/${subjectId}`);
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="app-panel p-4">
              <div className="mb-3 h-28 skeleton"></div>
              <div className="mb-2 h-4 w-40 skeleton"></div>
              <div className="h-3.5 w-2/3 skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page dashboard-stack">
      <section className="dashboard-header px-4 py-4 sm:px-5">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-[1.85rem]">Mis materias</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestioná contenido, unidades y materiales con una grilla más compacta y más cómoda para pantallas bajas.
        </p>
      </section>

      <section className="app-panel">
        <div className="dashboard-grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-end">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="app-select appearance-none pl-10"
            >
              <option value="">Todos los años</option>
              <option value="1">1er Año</option>
              <option value="2">2do Año</option>
              <option value="3">3er Año</option>
              <option value="4">4to Año</option>
              <option value="5">5to Año</option>
              <option value="6">6to Año</option>
            </select>
          </div>
          <p className="text-sm text-slate-500">
            {subjects.length} materias asignadas. La vista prioriza mejor densidad vertical y lectura rápida.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="app-panel text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900">No tienes materias asignadas</h3>
          <p className="mt-2 text-sm text-slate-500">
            Contacta al administrador para que te asigne materias.
          </p>
        </div>
      ) : (
        <div className="dashboard-card-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => handleSubjectClick(subject.id)}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_18px_40px_-32px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:border-yellow-200 hover:shadow-[0_22px_44px_-32px_rgba(245,158,11,0.34)]"
            >
              <div className="relative h-32 overflow-hidden rounded-t-2xl bg-gradient-to-br from-yellow-400 to-rose-400">
                {subject.image_url ? (
                  <img src={subject.image_url} alt={subject.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold">{subject.code}</h3>
                      <p className="mt-1 text-sm text-yellow-50">{subject.year}° Año</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">{subject.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {subject.description || "Sin descripción disponible"}
                  </p>
                </div>

                <div className="text-sm text-slate-500">
                  {subject.year}° Año • {subject.semester}° Sem
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-2.5 text-center">
                    <div className="flex justify-center text-yellow-700">
                      <Layers3 className="h-4 w-4" />
                    </div>
                    <div className="mt-1 text-lg font-bold text-yellow-700">{subject.stats.units_count}</div>
                    <div className="text-[11px] font-medium text-yellow-700">Unidades</div>
                  </div>
                  <div className="rounded-xl border border-green-100 bg-green-50 p-2.5 text-center">
                    <div className="flex justify-center text-green-600">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div className="mt-1 text-lg font-bold text-green-600">{subject.stats.contents_count}</div>
                    <div className="text-[11px] font-medium text-green-600">Contenidos</div>
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50 p-2.5 text-center">
                    <div className="flex justify-center text-rose-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="mt-1 text-lg font-bold text-rose-600">{subject.stats.documents_count}</div>
                    <div className="text-[11px] font-medium text-rose-600">Docs</div>
                  </div>
                </div>

                <div className="flex items-center justify-end text-sm font-semibold text-yellow-700">
                  Abrir materia
                  <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
