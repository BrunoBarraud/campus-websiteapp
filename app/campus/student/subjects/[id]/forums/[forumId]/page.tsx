"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Plus, Lock } from "lucide-react";
import QuestionCard from "@/components/forums/QuestionCard";
import AskQuestionModal from "@/components/forums/AskQuestionModal";

interface Question {
  id: string;
  title: string;
  content: string;
  views_count: number;
  answers_count: number;
  is_answered: boolean;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  author: {
    name: string;
    role: string;
  };
}

interface Forum {
  id: string;
  title: string;
  description?: string;
  is_locked: boolean;
  allow_student_answers: boolean;
  questions_count: number;
}

export default function StudentForumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id: subjectId, forumId } = params;

  const [forum, setForum] = useState<Forum | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "answered" | "unanswered">("all");

  useEffect(() => {
    fetchData();
  }, [forumId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [forumRes, questionsRes] = await Promise.all([
        fetch(`/api/forums/${forumId}`),
        fetch(`/api/forums/${forumId}/questions`),
      ]);

      if (forumRes.ok) {
        const forumData = await forumRes.json();
        console.log('[Student Forum] Datos del foro:', forumData);
        console.log('[Student Forum] Foro cerrado?', forumData.is_locked);
        console.log('[Student Forum] Permite respuestas?', forumData.allow_student_answers);
        setForum(forumData);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        console.log('[Student Forum] Preguntas cargadas:', questionsData.length);
        setQuestions(questionsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (data: { title: string; content: string }) => {
    const response = await fetch(`/api/forums/${forumId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear la pregunta");
    }

    await fetchData();
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === "answered") return q.is_answered;
    if (filter === "unanswered") return !q.is_answered;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Foro no encontrado</h2>
          <button
            onClick={() => router.back()}
            className="text-yellow-600 hover:text-yellow-700"
          >
            ← Volver
          </button>
        </div>
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
            ← Volver a foros
          </button>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {forum.title}
                </h1>
                {forum.description && (
                  <p className="text-gray-600">{forum.description}</p>
                )}

                <div className="flex items-center gap-4 mt-4 text-sm">
                  <span className="text-gray-600">
                    {forum.questions_count} pregunta{forum.questions_count !== 1 ? "s" : ""}
                  </span>
                  {forum.allow_student_answers && (
                    <span className="text-green-600">
                      ✓ Puedes responder preguntas
                    </span>
                  )}
                  {forum.is_locked && (
                    <span className="text-red-600 flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      Foro cerrado
                    </span>
                  )}
                </div>
              </div>

              <div>
                {!forum.is_locked ? (
                  <button
                    onClick={() => {
                      console.log('[Student Forum] Abriendo modal para hacer pregunta');
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                    Hacer Pregunta
                  </button>
                ) : (
                  <div className="px-6 py-3 bg-gray-100 text-gray-500 rounded-lg flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Foro cerrado
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "all", label: "Todas" },
            { value: "unanswered", label: "Sin responder" },
            { value: "answered", label: "Respondidas" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-yellow-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">
              {filter === "all"
                ? "Aún no hay preguntas en este foro"
                : `No hay preguntas ${filter === "answered" ? "respondidas" : "sin responder"}`}
            </p>
            {!forum.is_locked && filter === "all" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Hacer la Primera Pregunta
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onClick={() =>
                  router.push(
                    `/campus/student/subjects/${subjectId}/forums/${forumId}/questions/${question.id}`
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AskQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAskQuestion}
        forumTitle={forum.title}
      />
    </div>
  );
}
