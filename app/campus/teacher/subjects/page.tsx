// 👨‍🏫 Dashboard del Profesor - Gestión de Materias
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
      const url = selectedYear
        ? `/api/teacher/subjects?year=${selectedYear}`
        : "/api/teacher/subjects";

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
      <div className="min-h-screen bg-muted p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl shadow-soft p-4">
                <div className="h-40 w-full skeleton mb-4"></div>
                <div className="h-5 w-40 skeleton mb-2"></div>
                <div className="h-4 w-2/3 skeleton"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Mis Materias
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Gestiona tus materias, unidades y contenidos
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-surface border border-border rounded-xl shadow-soft p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Filtrar por año:
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="notification-error border rounded-xl p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Materias Grid */}
        {subjects.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl shadow-soft p-6 sm:p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No tienes materias asignadas
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Contacta al administrador para que te asigne materias.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => handleSubjectClick(subject.id)}
                className="bg-surface rounded-xl shadow-soft hover:shadow-elevated transition cursor-pointer border border-border"
              >
                {/* Subject Image */}
                <div className="h-48 bg-gradient-to-br from-yellow-400 to-rose-400 rounded-t-xl relative overflow-hidden">
                  {subject.image_url ? (
                    <img
                      src={subject.image_url}
                      alt={subject.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-white text-center">
                        <h3 className="text-2xl font-bold mb-2">
                          {subject.code}
                        </h3>
                        <p className="text-yellow-50">{subject.year}° Año</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subject Info */}
                <div className="p-4 sm:p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {subject.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {subject.description || "Sin descripción disponible"}
                    </p>
                  </div>

                  {/* Subject Details */}
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 space-y-3">
                    <span className="block">
                      {subject.year}° Año • {subject.semester}° Sem
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-yellow-50 rounded-lg p-2 sm:p-3 border border-yellow-100 text-center">
                        <div className="text-lg sm:text-2xl font-bold text-yellow-700">
                          {subject.stats.units_count}
                        </div>
                        <div className="text-[10px] sm:text-xs text-yellow-700 font-medium">
                          Unidades
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 sm:p-3 border border-green-100 text-center">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">
                          {subject.stats.contents_count}
                        </div>
                        <div className="text-[10px] sm:text-xs text-green-600 font-medium">
                          Contenidos
                        </div>
                      </div>
                      <div className="bg-rose-50 rounded-lg p-2 sm:p-3 border border-rose-100 text-center">
                        <div className="text-lg sm:text-2xl font-bold text-rose-600">
                          {subject.stats.documents_count}
                        </div>
                        <div className="text-[10px] sm:text-xs text-rose-600 font-medium">
                          Documentos
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
