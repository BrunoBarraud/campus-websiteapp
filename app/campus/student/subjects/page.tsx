"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  BookOpen,
  User,
  Users,
  ChevronRight,
} from "lucide-react";

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

      // Auto-inscribir al estudiante en sus materias
      try {
        await fetch("/api/student/enroll", {
          method: "POST",
        });
      } catch (enrollError) {
        console.log("Error en auto-inscripción (no crítico):", enrollError);
      }

      const url = selectedYear
        ? `/api/student/subjects?year=${selectedYear}`
        : "/api/student/subjects";

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
    const matchesYear =
      selectedYear === "" || subject.year.toString() === selectedYear;
    return matchesSearch && matchesYear;
  });

  const uniqueYears = Array.from(new Set(subjects.map((s) => s.year))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 mt-[12vh] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando materias...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 mt-[12vh] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Mis Materias
          </h1>
          <p className="text-lg text-gray-600">
            Gestiona tu progreso académico y accede al contenido de tus cursos
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar materias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Year Filter */}
            <div className="lg:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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
          </div>
        </div>

        {/* Results summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Mostrando {filteredSubjects.length} de {subjects.length} materias
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchSubjects}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Materias Grid */}
        {filteredSubjects.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay materias
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedYear
                ? "No se encontraron materias con los filtros aplicados"
                : "Aún no estás inscrito en ninguna materia"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => handleSubjectClick(subject.id)}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 group hover:scale-[1.02] hover:border-blue-300"
              >
                {/* Subject Image */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden rounded-t-xl">
                  {subject.image_url ? (
                    <img
                      src={subject.image_url}
                      alt={subject.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-16 w-16 text-white opacity-80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {subject.code}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {subject.year}° año
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {subject.name}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {subject.description || "Sin descripción disponible"}
                  </p>

                  {/* Teacher info */}
                  <div className="flex items-center mb-4 text-sm text-gray-500">
                    <User className="h-4 w-4 mr-2" />
                    <span>Prof. {subject.teacher?.name || "No asignado"}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        <span>{subject.stats?.units_count || 0} unidades</span>
                      </div>
                      {subject.division && (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>División {subject.division}</span>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
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
