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
  submission_text?: string;
  file_url?: string;
  file_name?: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
  status: string;
  student: {
    name: string;
    email: string;
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
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{assignment.title}</CardTitle>
            <p className="text-gray-600">{assignment.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span>Vence: {formatDate(assignment.due_date)}</span>
              </div>
              <div>
                <span>Puntuación máxima: {assignment.max_score} puntos</span>
              </div>
              <div>
                <span>Entregas: {submissions.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Entregas de Estudiantes</h2>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No hay entregas aún</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        {submission.student.name}
                        {getStatusBadge(submission)}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {submission.student.email}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p>Entregado: {formatDate(submission.submitted_at)}</p>
                      {submission.score !== null &&
                        submission.score !== undefined && (
                          <p className="font-semibold text-lg">
                            {submission.score}/{assignment.max_score} puntos
                          </p>
                        )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {submission.submission_text && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Texto de la entrega:</h4>
                      <p className="bg-gray-50 p-3 rounded text-sm">
                        {submission.submission_text}
                      </p>
                    </div>
                  )}

                  {submission.file_url && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Archivo:</h4>
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4" />
                        <span className="text-sm">{submission.file_name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(submission.file_url, "_blank")
                          }
                        >
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  )}

                  {submission.feedback && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Retroalimentación:</h4>
                      <p className="bg-blue-50 p-3 rounded text-sm">
                        {submission.feedback}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => openGradingDialog(submission)}
                        >
                          <StarIcon className="h-4 w-4 mr-2" />
                          {submission.score !== null &&
                          submission.score !== undefined
                            ? "Editar Calificación"
                            : "Calificar"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
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
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <DialogTrigger asChild>
                              <Button type="button" variant="outline">
                                Cancelar
                              </Button>
                            </DialogTrigger>
                            <Button type="submit">Guardar Calificación</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
