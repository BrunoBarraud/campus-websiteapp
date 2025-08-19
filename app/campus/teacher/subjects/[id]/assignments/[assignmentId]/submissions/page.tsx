"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  StarIcon,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando entregas...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Tarea no encontrada</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            ← Volver
          </Button>

          {/* Header de la tarea */}
          <div className="bg-white rounded-xl shadow-soft p-6 mb-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-pink-500 bg-clip-text text-transparent">
                  {assignment.title}
                </h1>
                <p className="text-gray-600 mt-2">{assignment.description}</p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-500">Fecha límite</p>
                  <p className="font-medium">{formatDate(assignment.due_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <StarIcon className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-500">Puntuación máxima</p>
                  <p className="font-medium">{assignment.max_score} puntos</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileIcon className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-500">Total entregas</p>
                  <p className="font-medium">{submissions.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Entregas de Estudiantes</h2>

          {submissions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-soft p-8 text-center border border-gray-100">
              <FileIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No hay entregas aún</h3>
              <p className="text-gray-500">Los estudiantes aún no han enviado sus entregas para esta tarea.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {submissions.map((submission) => (
                <div key={submission.id} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar del estudiante */}
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-gray-200">
                          {submission.student.avatar_url ? (
                            <img 
                              src={submission.student.avatar_url} 
                              alt={submission.student.name}
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-r from-yellow-400 to-pink-400 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {getInitials(submission.student.name)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Información del estudiante */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                              {submission.student.name}
                              {getStatusBadge(submission)}
                            </h3>
                            <p className="text-sm text-gray-500">{submission.student.email}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Entregado: {formatDate(submission.submitted_at)}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            {submission.score !== null && submission.score !== undefined && (
                              <div className="text-right">
                                <div className="text-2xl font-bold text-yellow-600">
                                  {submission.score}<span className="text-lg text-gray-400">/{assignment.max_score}</span>
                                </div>
                                <p className="text-sm text-gray-500">puntos</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contenido de la entrega */}
                    <div className="mt-6 space-y-4">
                      {submission.content && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Texto de la entrega:</h4>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-gray-700 whitespace-pre-wrap">{submission.content}</p>
                          </div>
                        </div>
                      )}

                      {submission.file_url && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Archivo adjunto:</h4>
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <FileIcon className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800 flex-1">{submission.file_name}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(submission.file_url, "_blank")}
                              className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                              <DownloadIcon className="h-4 w-4 mr-1" />
                              Descargar
                            </Button>
                          </div>
                        </div>
                      )}

                      {submission.feedback && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Retroalimentación:</h4>
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-yellow-800">{submission.feedback}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botón de calificación */}
                    <div className="mt-6 flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => openGradingDialog(submission)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            <StarIcon className="h-4 w-4 mr-2" />
                            {submission.score !== null && submission.score !== undefined
                              ? "Editar Calificación"
                              : "Calificar"}
                          </Button>
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
                              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700">
                                Guardar Calificación
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
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
