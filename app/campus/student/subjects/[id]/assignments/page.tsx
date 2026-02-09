"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  CalendarIcon,
  ClockIcon,
  UploadIcon,
  CheckCircleIcon,
  AlertCircleIcon,
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
  unit_id?: string;
  created_at: string;
  is_active: boolean;
  unit?: {
    title: string;
  };
  submission?: {
    id: string;
    submission_text?: string;
    file_url?: string;
    file_name?: string;
    submitted_at: string;
    score?: number;
    feedback?: string;
    status: string;
  };
}

export default function StudentAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [submissionData, setSubmissionData] = useState({
    submission_text: "",
    file: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [subjectId, setSubjectId] = useState<string>("");

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setSubjectId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  const fetchAssignments = useCallback(async () => {
    if (!subjectId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/student/subjects/${subjectId}/assignments`
      );
      if (response.ok) {
        const data = await response.json();
        // Filtro de tareas
        const filtered = (
          Array.isArray(data) ? data : data.assignments || []
        ).filter((a: Assignment) => {
          const dueDate = a.due_date ? new Date(a.due_date).getTime() : null;
          const now = new Date().getTime();
          const isActive = a.is_active;
          const condition = isActive && (a.submission || (dueDate && dueDate >= now));
          return condition;
        });
        setAssignments(filtered);
      } else {
        toast.error("Error al cargar las tareas.");
        console.error("Error fetching assignments");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    if (session?.user && subjectId) {
      fetchAssignments();
    }
  }, [session, subjectId, fetchAssignments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setUploading(true);
    try {
      const body: FormData | string = submissionData.file
        ? (() => {
            const fd = new FormData();
            fd.append("submission_text", submissionData.submission_text);
            fd.append("file", submissionData.file as File);
            return fd;
          })()
        : JSON.stringify({ submission_text: submissionData.submission_text });

      const requestOptions: RequestInit = {
        method: "POST",
        body,
      };

      if (!submissionData.file) {
        requestOptions.headers = { "Content-Type": "application/json" };
      }

      const response = await fetch(
        `/api/student/subjects/${subjectId}/assignments/${selectedAssignment.id}/submissions`,
        requestOptions
      );

      if (response.ok) {
        toast.success("Tarea entregada exitosamente");
        setSubmitDialogOpen(false);
        setSelectedAssignment(null);
        setSubmissionData({ submission_text: "", file: null });
        fetchAssignments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Error al entregar la tarea");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al entregar la tarea");
    } finally {
      setUploading(false);
    }
  };

  const openSubmitDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionData({ submission_text: "", file: null });
    setSubmitDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    if (assignment.submission) {
      if (
        assignment.submission.score !== null &&
        assignment.submission.score !== undefined
      ) {
        return {
          badge: <Badge variant="default">Calificada</Badge>,
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        };
      } else {
        return {
          badge: <Badge variant="secondary">Entregada</Badge>,
          icon: <CheckCircleIcon className="h-5 w-5 text-blue-500" />,
        };
      }
    } else if (isOverdue(assignment.due_date)) {
      return {
        badge: <Badge variant="destructive">Vencida</Badge>,
        icon: <AlertCircleIcon className="h-5 w-5 text-red-500" />,
      };
    } else {
      return {
        badge: <Badge variant="outline">Pendiente</Badge>,
        icon: <ClockIcon className="h-5 w-5 text-yellow-500" />,
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-border border-t-primary" />
          <span className="text-slate-700 text-sm">Cargando tareas…</span>
        </div>
      </div>
    );
  }

  const pendingCount = assignments.filter((a) => !a.submission && !isOverdue(a.due_date)).length;
  const submittedCount = assignments.filter((a) => Boolean(a.submission)).length;
  const gradedCount = assignments.filter(
    (a) => a.submission && a.submission.score !== null && a.submission.score !== undefined
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Mis Tareas</h2>
            <p className="text-slate-500">Administra tus entregas y revisa las calificaciones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <ClockIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">{pendingCount}</p>
              <p className="text-sm font-medium text-slate-500">Pendientes</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">{submittedCount}</p>
              <p className="text-sm font-medium text-slate-500">Entregadas</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">{gradedCount}</p>
              <p className="text-sm font-medium text-slate-500">Calificadas</p>
            </div>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner mx-auto">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No hay tareas disponibles</h3>
            <p className="text-slate-500 mt-1">No hay tareas disponibles para esta materia.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const status = getAssignmentStatus(assignment);
              const overdue = isOverdue(assignment.due_date) && !assignment.submission;

              return (
                <div
                  key={assignment.id}
                  className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow ${
                    overdue ? "border-red-200 bg-red-50/40" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900 truncate">{assignment.title}</h3>
                        {status.badge}
                      </div>
                      <p className="text-slate-600 mt-1 line-clamp-2">{assignment.description}</p>
                      {assignment.unit?.title ? (
                        <div className="mt-3">
                          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            {assignment.unit.title}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="text-right text-sm text-slate-700">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <CalendarIcon className="h-4 w-4 text-indigo-500" />
                        <span className="truncate">Vence: {formatDate(assignment.due_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <span>{assignment.max_score} puntos</span>
                      </div>
                    </div>
                  </div>

                  {assignment.instructions ? (
                    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{assignment.instructions}</p>
                    </div>
                  ) : null}

                  {assignment.submission ? (
                    <div className="mt-4 space-y-3">
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                        <div className="text-sm text-slate-700 space-y-2">
                          <p>
                            <span className="font-semibold">Entregado:</span> {formatDate(assignment.submission.submitted_at)}
                          </p>
                          {assignment.submission.submission_text ? (
                            <div>
                              <div className="font-semibold">Texto:</div>
                              <div className="mt-1 bg-white border border-indigo-100 rounded-lg p-3">
                                <p className="whitespace-pre-wrap">{assignment.submission.submission_text}</p>
                              </div>
                            </div>
                          ) : null}

                          {assignment.submission.file_url ? (
                            <div className="flex items-center gap-3 p-3 border border-indigo-100 bg-white rounded-xl">
                              <FileText className="w-5 h-5 text-indigo-600" />
                              <span className="text-sm font-semibold text-indigo-900 flex-1 truncate">
                                {assignment.submission.file_name || "Archivo"}
                              </span>
                              <a
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-200 bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50"
                                href={`/api/files/download?url=${encodeURIComponent(assignment.submission.file_url)}${assignment.submission.file_name ? `&name=${encodeURIComponent(assignment.submission.file_name)}` : ""}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Descargar
                              </a>
                            </div>
                          ) : null}

                          {assignment.submission.score !== null && assignment.submission.score !== undefined ? (
                            <div>
                              <span className="font-semibold">Calificación:</span>{" "}
                              <span className="text-lg font-bold text-emerald-700">
                                {assignment.submission.score}/{assignment.max_score}
                              </span>
                            </div>
                          ) : null}

                          {assignment.submission.feedback ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                              <div className="font-semibold text-emerald-900">Retroalimentación:</div>
                              <p className="text-emerald-800 mt-1 whitespace-pre-wrap">{assignment.submission.feedback}</p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex justify-end">
                      {overdue ? (
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold cursor-not-allowed"
                          disabled
                        >
                          <AlertCircleIcon className="h-4 w-4 inline mr-2" /> Fecha vencida
                        </button>
                      ) : (
                        <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                          <DialogTrigger asChild>
                            <button
                              onClick={() => openSubmitDialog(assignment)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                              type="button"
                            >
                              <UploadIcon className="h-4 w-4 inline mr-2" /> Entregar Tarea
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Entregar: {selectedAssignment?.title}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                              <div>
                                <Label htmlFor="submission_text">Texto de la entrega</Label>
                                <Textarea
                                  id="submission_text"
                                  value={submissionData.submission_text}
                                  onChange={(e) =>
                                    setSubmissionData({
                                      ...submissionData,
                                      submission_text: e.target.value,
                                    })
                                  }
                                  rows={4}
                                  placeholder="Escribe aquí tu respuesta o comentarios..."
                                />
                              </div>
                              <div>
                                <Label htmlFor="file">Archivo (opcional)</Label>
                                <Input
                                  id="file"
                                  type="file"
                                  onChange={(e) =>
                                    setSubmissionData({
                                      ...submissionData,
                                      file: e.target.files?.[0] || null,
                                    })
                                  }
                                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                  Formatos aceptados: PDF, DOC, DOCX, TXT, JPG, PNG (máximo 10MB)
                                </p>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setSubmitDialogOpen(false)}
                                  disabled={uploading}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={
                                    uploading ||
                                    (!submissionData.submission_text.trim() && !submissionData.file)
                                  }
                                >
                                  {uploading ? "Subiendo..." : "Entregar Tarea"}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
