// 📝 Vista de Tarea Individual para Estudiantes
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeftIcon,
  CalendarIcon,
  FileTextIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  MessageCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import SubmissionComments from "@/components/dashboard/SubmissionComments";

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  due_date: string;
  max_score: number;
  is_active: boolean;
  unit_id: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string;
  file_url?: string;
  file_name?: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
  status: string;
}

export default function StudentAssignmentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.role !== "student") {
      router.push("/campus/login");
      return;
    }

    fetchData();
  }, [session, status, assignmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener información de la tarea
      await fetchAssignment();

      // Obtener la entrega del estudiante si existe
      await fetchSubmission();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignment = async () => {
    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/assignments/${assignmentId}`
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Assignment fetch error:", response.status, text);
        let errorMessage = "Error al cargar la tarea";

        try {
          const data = JSON.parse(text);
          errorMessage = data.error || errorMessage;
        } catch {
          // Si no es JSON válido, usar el texto directamente
          errorMessage = text || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      setAssignment(data);
    } catch (err: any) {
      console.error("Error fetching assignment:", err);
      throw err;
    }
  };

  const fetchSubmission = async () => {
    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/assignments/${assignmentId}/submissions`
      );

      if (response.ok) {
        const data = await response.json();
        setSubmission(data);
        if (data) {
          setSubmissionText(data.submission_text || "");
        }
      } else if (response.status === 404) {
        // Es normal que no haya entrega, no hacer nada
        setSubmission(null);
      } else {
        const text = await response.text();
        console.error("Submission fetch error:", response.status, text);
        // No lanzar error aquí porque es opcional
      }
    } catch (err: any) {
      console.error("Error fetching submission:", err);
      // No lanzar error aquí porque es normal que no haya entrega
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submissionText.trim()) {
      toast.error("Debes escribir tu respuesta");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/subjects/${subjectId}/assignments/${assignmentId}/submissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: submissionText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar la entrega");
      }

      toast.success(
        submission
          ? "Entrega actualizada exitosamente"
          : "Entrega enviada exitosamente"
      );

      // Actualizar la entrega
      setSubmission(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
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

  const getStatusBadge = () => {
    if (!submission) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          Pendiente
        </Badge>
      );
    }

    if (submission.score !== null && submission.score !== undefined) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircleIcon className="h-3 w-3" />
          Calificada ({submission.score}/{assignment?.max_score})
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <CheckCircleIcon className="h-3 w-3" />
        Entregada
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando tarea...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => router.back()}
              className="mt-4"
              variant="destructive"
            >
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Tarea no encontrada</p>
            <Button
              onClick={() => router.back()}
              className="mt-4"
              variant="outline"
            >
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const overdue = isOverdue(assignment.due_date);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a la materia
          </Button>
        </div>

        {/* Assignment Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-3 mb-2">
                  <FileTextIcon className="h-6 w-6" />
                  {assignment.title}
                </CardTitle>
                <p className="text-gray-600 mb-4">{assignment.description}</p>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Fecha límite: {formatDate(assignment.due_date)}
                  </span>
                  <span>🎯 Puntos máximos: {assignment.max_score}</span>
                </div>

                {overdue && !submission && (
                  <div className="mt-3 flex items-center text-red-600">
                    <AlertCircleIcon className="h-4 w-4 mr-1" />
                    Esta tarea está vencida
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                {getStatusBadge()}
                {assignment.is_active ? (
                  <Badge variant="default">Activa</Badge>
                ) : (
                  <Badge variant="secondary">Inactiva</Badge>
                )}
              </div>
            </div>
          </CardHeader>

          {assignment.instructions && (
            <CardContent>
              <h4 className="font-semibold text-gray-900 mb-2">
                Instrucciones
              </h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {assignment.instructions}
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Submission Section */}
        {submission &&
        submission.score !== null &&
        submission.score !== undefined ? (
          // Show graded submission
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                Tu entrega calificada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="submission" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="submission">Mi Entrega</TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="flex items-center gap-2"
                  >
                    <MessageCircleIcon className="h-4 w-4" />
                    Comentarios
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="submission" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Tu respuesta:
                    </Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="whitespace-pre-wrap">
                        {submission.submission_text}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Calificación:
                      </Label>
                      <div className="mt-1 text-2xl font-bold text-green-600">
                        {submission.score} / {assignment.max_score}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Entregado el:
                      </Label>
                      <div className="mt-1 text-sm text-gray-600">
                        {formatDate(submission.submitted_at)}
                      </div>
                    </div>
                  </div>

                  {submission.feedback && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Retroalimentación del profesor:
                      </Label>
                      <div className="mt-1 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                        <p className="whitespace-pre-wrap">
                          {submission.feedback}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="comments" className="space-y-4">
                  <SubmissionComments
                    submissionId={submission.id}
                    submissionText={
                      submission.submission_text || "Sin contenido de texto"
                    }
                    canComment={true}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          // Show submission form
          <Card>
            <CardHeader>
              <CardTitle>
                {submission ? "Actualizar entrega" : "Entregar tarea"}
              </CardTitle>
              {submission && (
                <p className="text-sm text-gray-600">
                  Entregado el: {formatDate(submission.submitted_at)}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {assignment.is_active ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="submission">Tu respuesta *</Label>
                    <Textarea
                      id="submission"
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Escribe tu respuesta aquí..."
                      rows={8}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || (overdue && !submission)}
                    >
                      {submitting
                        ? "Enviando..."
                        : submission
                        ? "Actualizar entrega"
                        : "Enviar entrega"}
                    </Button>
                  </div>

                  {overdue && !submission && (
                    <div className="text-red-600 text-sm">
                      ⚠️ Esta tarea está vencida y no se pueden hacer nuevas
                      entregas.
                    </div>
                  )}
                </form>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Esta tarea no está activa para entregas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
