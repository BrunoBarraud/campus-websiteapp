"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, MessageCircle, Eye, ArrowLeft } from "lucide-react";
import AnswerCard from "@/components/forums/AnswerCard";

interface Question {
  id: string;
  title: string;
  content: string;
  views_count: number;
  answers_count: number;
  is_answered: boolean;
  created_at: string;
  author: {
    name: string;
    role: string;
  };
  forum: {
    allow_student_answers: boolean;
  };
  answers: Array<{
    id: string;
    content: string;
    is_teacher_answer: boolean;
    is_accepted: boolean;
    likes_count: number;
    created_at: string;
    author: {
      name: string;
      role: string;
    };
  }>;
}

export default function StudentQuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { questionId } = params as {
    id: string;
    forumId: string;
    questionId: string;
  };

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forums/questions/${questionId}`);
      if (response.ok) {
        const data = await response.json();
        setQuestion(data);
      }
    } catch (err) {
      console.error("Error fetching question:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/forums/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: answerContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al enviar la respuesta");
      }

      setAnswerContent("");
      await fetchQuestion();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pregunta no encontrada
          </h2>
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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al foro
        </button>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {question.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>{question.views_count} vistas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span>{question.answers_count} respuestas</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span>
              Por <strong>{question.author.name}</strong>
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              {new Date(question.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap text-base">
              {question.content}
            </p>
          </div>
        </div>

        {/* Answers */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {question.answers_count} Respuesta{question.answers_count !== 1 ? "s" : ""}
          </h2>

          <div className="space-y-4">
            {question.answers && question.answers.length > 0 ? (
              question.answers.map((answer) => (
                <AnswerCard key={answer.id} answer={answer} />
              ))
            ) : (
              <div className="bg-white rounded-lg p-8 text-center text-gray-600">
                Aún no hay respuestas para esta pregunta
              </div>
            )}
          </div>
        </div>

        {/* Answer Form */}
        {question.forum.allow_student_answers && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tu Respuesta
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitAnswer}>
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none mb-4"
                required
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !answerContent.trim()}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
                >
                  {submitting ? "Enviando..." : "Publicar Respuesta"}
                </button>
              </div>
            </form>
          </div>
        )}

        {!question.forum.allow_student_answers && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800">
              Solo el profesor puede responder preguntas en este foro
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
