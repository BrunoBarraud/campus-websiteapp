"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Lock, Unlock, Pin, CheckCircle, Plus } from "lucide-react";
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
  is_approved: boolean;
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
  require_approval: boolean;
  questions_count: number;
}

export default function TeacherForumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id: subjectId, forumId } = params as { id: string; forumId: string };

  const [forum, setForum] = useState<Forum | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "answered" | "unanswered">("all");
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);

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
        setForum(forumData);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
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
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error || "Error al crear la pregunta");
    }

    await fetchData();
  };

  const handleToggleLock = async () => {
    if (!forum) return;

    try {
      const response = await fetch(`/api/forums/${forumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_locked: !forum.is_locked }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Error toggling lock:", err);
    }
  };

  const handleTogglePin = async (questionId: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/forums/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !isPinned }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Error toggling pin:", err);
    }
  };

  const handleApproveQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/forums/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved: true }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Error approving question:", err);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === "pending") return !q.is_approved;
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
                    {forum.questions_count} pregunta{forum.questions_count !== 1 ? 's' : ''}
                  </span>
                  {forum.allow_student_answers && (
                    <span className="text-green-600">
                      ✓ Respuestas colaborativas
                    </span>
                  )}
                  {forum.is_locked && (
                    <span className="text-red-600 flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      Cerrado
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAskModalOpen(true)}
                  disabled={forum.is_locked}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Hacer pregunta
                </button>

                <button
                  type="button"
                  onClick={handleToggleLock}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    forum.is_locked
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  {forum.is_locked ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      Abrir Foro
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Cerrar Foro
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "all", label: "Todas" },
            { value: "pending", label: "Pendientes" },
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
            <p className="text-gray-600">No hay preguntas en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div key={question.id} className="relative">
                <QuestionCard
                  question={question}
                  onClick={() =>
                    router.push(
                      `/campus/teacher/subjects/${subjectId}/forums/${forumId}/questions/${question.id}`
                    )
                  }
                />
                
                {/* Quick actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {!question.is_approved && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApproveQuestion(question.id);
                      }}
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      title="Aprobar pregunta"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePin(question.id, question.is_pinned);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      question.is_pinned
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    title={question.is_pinned ? "Desfijar" : "Fijar pregunta"}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AskQuestionModal
          isOpen={isAskModalOpen}
          onClose={() => setIsAskModalOpen(false)}
          onSubmit={handleAskQuestion}
          forumTitle={forum.title}
        />
      </div>
    </div>
  );
}
