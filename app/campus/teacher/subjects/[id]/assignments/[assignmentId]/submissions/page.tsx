"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarIcon,
  FileIcon,
  UserIcon,
  DownloadIcon,
  ChevronLeft,
  Search,
  Filter,
  Trophy,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  instructions?: string;
}

interface Submission {
  id: string;
  student_id: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
  status: string;
  student: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export default function AssignmentSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(
    null
  );
  const [gradeData, setGradeData] = useState({ score: "", feedback: "" });
  const [subjectId, setSubjectId] = useState<string>("");
  const [assignmentId, setAssignmentId] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setSubjectId(resolvedParams.id);
      setAssignmentId(resolvedParams.assignmentId);
    };
    loadParams();
  }, [params]);

  const fetchAssignment = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/assignments?assignmentId=${assignmentId}`
      );
      if (response.ok) {
        const data = await response.json();
        setAssignment(data[0]);
      }
    } catch (error) {
      console.error("Error fetching assignment:", error);
      toast.error("Error al cargar la tarea");
    }
  }, [subjectId, assignmentId]);

  const fetchSubmissions = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/assignments/${assignmentId}/submissions`
      );
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Error al cargar las entregas");
    } finally {
      setLoading(false);
    }
  }, [subjectId, assignmentId]);

  useEffect(() => {
    if (session?.user && subjectId && assignmentId) {
      fetchAssignment();
      fetchSubmissions();
    }
  }, [session, subjectId, assignmentId, fetchAssignment, fetchSubmissions]);

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/assignments/${assignmentId}/submissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submission_id: gradingSubmission.id,
            score: parseInt(gradeData.score),
            feedback: gradeData.feedback,
          }),
        }
      );

      if (response.ok) {
        toast.success("Calificación guardada exitosamente");
        setGradingSubmission(null);
        setGradeData({ score: "", feedback: "" });
        fetchSubmissions();
      } else {
        toast.error("Error al guardar la calificación");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar la calificación");
    }
  };

  const openGradingDialog = (submission: Submission) => {
    setGradingSubmission(submission);
    setGradeData({
      score: submission.score?.toString() || "",
      feedback: submission.feedback || "",
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Fecha no válida";
      }
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Fecha no válida";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (submission: Submission) => {
    if (submission.score !== null && submission.score !== undefined) {
      return <Badge variant="default">Calificada</Badge>;
    }

    const isLate =
      new Date(submission.submitted_at) > new Date(assignment?.due_date || "");
    if (isLate) {
      return <Badge variant="destructive">Tarde</Badge>;
    }

    return <Badge variant="secondary">Pendiente</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-border border-t-primary" />
          <span className="text-slate-700 text-sm">Cargando entregas…</span>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-center">
          <div className="text-lg font-semibold text-slate-800">Tarea no encontrada</div>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1"
            type="button"
          >
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
        </div>
      </div>
    );
  }

  const pendingCorrections = submissions.filter(
    (s) => s.score === null || s.score === undefined
  ).length;

  const filteredSubmissions = submissions.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.student.name.toLowerCase().includes(q) ||
      s.student.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <button
          className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1"
          type="button"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-4 h-4" /> Volver a Tareas
        </button>

        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full -mr-10 -mt-10 opacity-50 blur-2xl" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2 truncate">{assignment.title}</h1>
                <p className="text-slate-500 max-w-2xl text-sm sm:text-base">{assignment.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Fecha Límite</p>
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <CalendarIcon className="w-4 h-4 text-indigo-500" /> {formatDate(assignment.due_date)}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Puntuación</p>
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <Trophy className="w-4 h-4 text-amber-500" /> {assignment.max_score} Puntos
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Entregas</p>
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <FileIcon className="w-4 h-4 text-emerald-500" /> {submissions.length}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Por corregir</p>
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <UserIcon className="w-4 h-4 text-slate-500" /> {pendingCorrections}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm sm:text-base">
              Entregas de Estudiantes
              <span className="text-slate-400 text-xs sm:text-sm font-normal">({pendingCorrections} pendientes)</span>
            </h3>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar alumno..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                type="button"
                title="Filtros"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">
                {submissions.length === 0 ? "Aún no hay entregas" : "No se encontraron resultados"}
              </h3>
              <p className="text-slate-500 max-w-sm mt-1">
                {submissions.length === 0
                  ? "Los estudiantes todavía no han subido sus archivos. Cuando lo hagan, aparecerán listados aquí."
                  : "Probá con otro término de búsqueda."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="p-4 sm:p-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full overflow-hidden border border-slate-200">
                          {submission.student.avatar_url ? (
                            <img
                              src={submission.student.avatar_url}
                              alt={submission.student.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-slate-200 flex items-center justify-center">
                              <span className="text-sm font-bold text-slate-600">
                                {getInitials(submission.student.name)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900 truncate">{submission.student.name}</h4>
                          {getStatusBadge(submission)}
                        </div>
                        <p className="text-sm text-slate-500 truncate">{submission.student.email}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          Entregado: {formatDate(submission.submitted_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4">
                      {submission.score !== null && submission.score !== undefined ? (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-indigo-700">
                            {submission.score}
                            <span className="text-lg text-slate-400">/{assignment.max_score}</span>
                          </div>
                          <p className="text-sm text-slate-500">puntos</p>
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                          Pendiente
                        </div>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            onClick={() => openGradingDialog(submission)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                            type="button"
                          >
                            {submission.score !== null && submission.score !== undefined
                              ? "Editar"
                              : "Calificar"}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>
                              Calificar entrega de {submission.student.name}
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleGrade} className="space-y-4">
                            <div>
                              <Label htmlFor="score">
                                Puntuación (máximo {assignment.max_score} puntos)
                              </Label>
                              <Input
                                id="score"
                                type="number"
                                min="0"
                                max={assignment.max_score}
                                value={gradeData.score}
                                onChange={(e) =>
                                  setGradeData({
                                    ...gradeData,
                                    score: e.target.value,
                                  })
                                }
                                required
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="feedback">Retroalimentación</Label>
                              <Textarea
                                id="feedback"
                                value={gradeData.feedback}
                                onChange={(e) =>
                                  setGradeData({
                                    ...gradeData,
                                    feedback: e.target.value,
                                  })
                                }
                                rows={4}
                                placeholder="Comentarios para el estudiante..."
                                className="mt-1"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                              <DialogTrigger asChild>
                                <Button type="button" variant="outline">
                                  Cancelar
                                </Button>
                              </DialogTrigger>
                              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                                Guardar
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {submission.content ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <p className="text-slate-700 whitespace-pre-wrap">{submission.content}</p>
                      </div>
                    ) : null}

                    {submission.file_url ? (
                      <div className="flex items-center gap-3 p-3 border border-indigo-100 bg-indigo-50/50 rounded-xl">
                        <FileIcon className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-900 flex-1 truncate">
                          {submission.file_name || "Archivo"}
                        </span>
                        <a
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-200 bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50"
                          href={`/api/files/download?url=${encodeURIComponent(submission.file_url)}${submission.file_name ? `&name=${encodeURIComponent(submission.file_name)}` : ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <DownloadIcon className="h-4 w-4" /> Descargar
                        </a>
                      </div>
                    ) : null}

                    {submission.feedback ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-amber-900 whitespace-pre-wrap">{submission.feedback}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
