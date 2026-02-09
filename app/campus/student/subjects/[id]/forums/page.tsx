"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ForumCard from "@/components/forums/ForumCard";

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

export default function StudentForumsPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
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

      // Obtener foros
      const forumsRes = await fetch(`/api/forums?subject_id=${subjectId}`);
      if (forumsRes.ok) {
        const forumsData = await forumsRes.json();
        setForums(forumsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleForumClick = (forumId: string) => {
    router.push(`/campus/student/subjects/${subjectId}/forums/${forumId}`);
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
        </div>

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
              No hay foros disponibles
            </h3>
            <p className="text-gray-600">
              Tu profesor aún no ha creado foros para esta materia
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forums.map((forum) => (
              <ForumCard
                key={forum.id}
                forum={forum}
                onClick={() => handleForumClick(forum.id)}
              />
            ))}
          </div>
        )}

        {/* Info */}
        {forums.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-medium text-blue-900 mb-2">
              💬 Sobre los foros
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Puedes hacer preguntas sobre los temas de la materia</li>
              <li>• Tus compañeros y el profesor podrán responder</li>
              <li>• Todas las preguntas y respuestas son visibles para el curso</li>
              <li>• Sé respetuoso y ayuda a tus compañeros cuando puedas</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
