"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, MessageSquare, HelpCircle, Users, MoreHorizontal, CheckCircle } from "lucide-react";
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

function formatRelativeTime(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export default function StudentForumsPage() {
  const params = useParams();
  const router = useRouter();
  const { id: subjectId } = params as { id: string };

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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1"
          type="button"
        >
          ← Volver
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Foros de Discusión</h2>
            <p className="text-slate-500">
              {subject ? `${subject.name} - ${subject.year}° Año` : "Espacio de debate e intercambio"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">{forums.length}</p>
              <p className="text-sm font-medium text-slate-500">Foros Activos</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">{forums.reduce((sum, f) => sum + f.questions_count, 0)}</p>
              <p className="text-sm font-medium text-slate-500">Preguntas Totales</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">{forums.filter((f) => f.allow_student_answers).length}</p>
              <p className="text-sm font-medium text-slate-500">Colaboraciones</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-700 mt-4">Debates Recientes</h3>
          {forums.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
              <h3 className="text-lg font-bold text-slate-700">No hay foros disponibles</h3>
              <p className="text-slate-500 mt-1">Tu profesor aún no creó foros para esta materia.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {forums.map((forum) => (
                <div
                  key={forum.id}
                  onClick={() => handleForumClick(forum.id)}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleForumClick(forum.id);
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {forum.unit?.title ? (
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          {forum.unit.title}
                        </span>
                      ) : null}
                      <span className="text-slate-400 text-xs">• {formatRelativeTime(forum.created_at)}</span>
                    </div>
                    <button
                      className="text-slate-400 hover:text-indigo-600"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  <h4 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                    {forum.title}
                  </h4>
                  {forum.description ? (
                    <p className="text-slate-600 mb-4 line-clamp-2">{forum.description}</p>
                  ) : null}

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {subject?.year ? String(subject.year) : "F"}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{subject?.name || "Materia"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500 text-sm">
                      <span className="flex items-center gap-1 hover:text-indigo-600">
                        <MessageSquare className="w-4 h-4" /> {forum.questions_count} preguntas
                      </span>
                      {forum.allow_student_answers ? (
                        <span className="flex items-center gap-1 hover:text-emerald-600">
                          <CheckCircle className="w-4 h-4" /> Colaborativo
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="hidden">
            {forums.map((forum) => (
              <ForumCard key={forum.id} forum={forum} onClick={() => handleForumClick(forum.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
