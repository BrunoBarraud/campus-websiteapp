"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import ForumCard from "@/components/forums/ForumCard";
import CreateForumModal from "@/components/forums/CreateForumModal";

interface Forum {
  id: string;
  title: string;
  description?: string;
  questions_count: number;
  is_locked: boolean;
  allow_student_answers: boolean;
  created_at: string;
  unit?: {
    id: string;
    title: string;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string;
  year: number;
}

interface Unit {
  id: string;
  title: string;
}

export default function TeacherForumsPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [forums, setForums] = useState<Forum[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
    
    // Verificar si viene de crear una sección con tipo foro
    const urlParams = new URLSearchParams(window.location.search);
    const shouldCreate = urlParams.get('create');
    const prefilledTitle = urlParams.get('title');
    
    if (shouldCreate === 'true' && prefilledTitle) {
      setIsModalOpen(true);
      // Limpiar los parámetros de la URL sin recargar
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [subjectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos de la materia
      const subjectRes = await fetch(`/api/subjects/${subjectId}`);
      if (subjectRes.ok) {
        const subjectData = await subjectRes.json();
        setSubject(subjectData);
      }

      // Obtener unidades
      const unitsRes = await fetch(`/api/subjects/${subjectId}/units`);
      if (unitsRes.ok) {
        const unitsData = await unitsRes.json();
        setUnits(unitsData);
      }

      // Obtener foros
      const forumsRes = await fetch(`/api/forums?subject_id=${subjectId}`);
      if (forumsRes.ok) {
        const forumsData = await forumsRes.json();
        setForums(forumsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForum = async (data: any) => {
    const response = await fetch("/api/forums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        subject_id: subjectId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear el foro");
    }

    await fetchData();
  };

  const handleForumClick = (forumId: string) => {
    router.push(`/campus/teacher/subjects/${subjectId}/forums/${forumId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Volver
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Foros de Discusión
              </h1>
              {subject && (
                <p className="text-gray-600 mt-2">
                  {subject.name} - {subject.year}° Año
                </p>
              )}
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Crear Foro
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Foros Grid */}
        {forums.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
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
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay foros creados
            </h3>
            <p className="text-gray-600 mb-6">
              Crea el primer foro para que tus estudiantes puedan hacer preguntas
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Foro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forums.map((forum) => (
              <ForumCard
                key={forum.id}
                forum={forum}
                onClick={() => handleForumClick(forum.id)}
                isTeacher
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {forums.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-yellow-600">
                {forums.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Foros activos
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-green-600">
                {forums.reduce((sum, f) => sum + f.questions_count, 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Preguntas totales
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-blue-600">
                {forums.filter(f => f.allow_student_answers).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Con respuestas colaborativas
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <CreateForumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateForum}
        units={units}
        subjectName={subject?.name || ""}
      />
    </div>
  );
}
