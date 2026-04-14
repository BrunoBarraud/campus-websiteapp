"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Filter, Search, User, Users } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  year: number;
  division: string | null;
  image_url: string | null;
  teacher: {
    id: string;
    name: string;
    email: string;
  } | null;
  stats: {
    units_count: number;
    contents_count: number;
    documents_count: number;
  };
}

export default function StudentSubjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.role !== "student") {
      router.push("/campus/auth/login");
      return;
    }

    fetchSubjects();
  }, [session, status, router, selectedYear]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError("");

      try {
        await fetch("/api/student/enroll", { method: "POST" });
      } catch (enrollError) {
        console.log("Error en auto-inscripción (no crítico):", enrollError);
      }

      const url = selectedYear ? `/api/student/subjects?year=${selectedYear}` : "/api/student/subjects";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSubjects(data || []);
    } catch (err: any) {
      console.error("Error fetching subjects:", err);
      setError(err.message || "Error al cargar las materias");
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    router.push(`/campus/student/subjects/${subjectId}`);
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === "" || subject.year.toString() === selectedYear;
    return matchesSearch && matchesYear;
  });

  const uniqueYears = Array.from(new Set(subjects.map((s) => s.year))).sort();

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
          Accedé al contenido de tus cursos con una vista más compacta y cómoda para notebooks.
        </p>
      </section>

      <section className="app-panel">
        <div className="dashboard-grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar materias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="app-input pl-10"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="app-select appearance-none pl-10"
            >
              <option value="">Todos los años</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}° año
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Mostrando {filteredSubjects.length} de {subjects.length} materias
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          <button
            onClick={fetchSubjects}
            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {filteredSubjects.length === 0 ? (
        <div className="app-panel text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900">No hay materias</h3>
          <p className="mt-2 text-sm text-slate-500">
            {searchTerm || selectedYear
              ? "No se encontraron materias con los filtros aplicados."
              : "Aún no estás inscrito en ninguna materia."}
          </p>
        </div>
      ) : (
        <div className="dashboard-card-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredSubjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => handleSubjectClick(subject.id)}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_18px_40px_-32px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:border-yellow-200 hover:shadow-[0_22px_44px_-32px_rgba(245,158,11,0.34)]"
            >
              <div className="relative h-32 overflow-hidden bg-gradient-to-br from-yellow-400 to-rose-400">
                {subject.image_url ? (
                  <img src={subject.image_url} alt={subject.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-12 w-12 text-white/80" />
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-950/15"></div>
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  {subject.code}
                </div>
                <div className="absolute right-3 top-3 rounded-full bg-yellow-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                  {subject.year}° año
                </div>
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">{subject.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {subject.description || "Sin descripción disponible"}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <User className="h-4 w-4" />
                  <span className="truncate">Prof. {subject.teacher?.name || "No asignado"}</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {subject.stats?.units_count || 0} unidades
                    </span>
                    {subject.division && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        División {subject.division}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
