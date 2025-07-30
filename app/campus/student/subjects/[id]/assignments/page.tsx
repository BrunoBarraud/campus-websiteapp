"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CalendarIcon, ClockIcon, FileTextIcon, UploadIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";
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

export default function StudentAssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionData, setSubmissionData] = useState({
    submission_text: "",
    file: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [subjectId, setSubjectId] = useState<string>('');

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setSubjectId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await fetch(`/api/student/subjects/${subjectId}/assignments`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      } else {
        console.error('Error fetching assignments');
      }
    } catch (error) {
      console.error('Error:', error);
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
      // Crear FormData si hay archivo, JSON si solo hay texto
      if (submissionData.file) {
        // Enviar como FormData con el archivo
        const formData = new FormData();
        formData.append('content', submissionData.submission_text);
        formData.append('file', submissionData.file);

        const response = await fetch(`/api/subjects/${subjectId}/assignments/${selectedAssignment.id}/submissions`, {
          method: "POST",
          body: formData, // No incluir Content-Type header, deja que el navegador lo configure
        });

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
      } else {
        // Enviar como JSON solo con texto
        const response = await fetch(`/api/subjects/${subjectId}/assignments/${selectedAssignment.id}/submissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: submissionData.submission_text,
          }),
        });

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
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    if (assignment.submission) {
      if (assignment.submission.score !== null && assignment.submission.score !== undefined) {
        return {
          badge: <Badge variant="default">Calificada</Badge>,
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
        };
      } else {
        return {
          badge: <Badge variant="secondary">Entregada</Badge>,
          icon: <CheckCircleIcon className="h-5 w-5 text-blue-500" />
        };
      }
    } else if (isOverdue(assignment.due_date)) {
      return {
        badge: <Badge variant="destructive">Vencida</Badge>,
        icon: <AlertCircleIcon className="h-5 w-5 text-red-500" />
      };
    } else {
      return {
        badge: <Badge variant="outline">Pendiente</Badge>,
        icon: <ClockIcon className="h-5 w-5 text-yellow-500" />
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando tareas...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mis Tareas</h1>
        <p className="text-gray-600">Administra tus entregas y revisa las calificaciones</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No hay tareas disponibles</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const status = getAssignmentStatus(assignment);
            return (
              <Card key={assignment.id} className={`${isOverdue(assignment.due_date) && !assignment.submission ? 'border-red-200 bg-red-50' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {status.icon}
                        {assignment.title}
                        {status.badge}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {assignment.description}
                      </p>
                      {assignment.unit && (
                        <Badge variant="secondary" className="mt-2">
                          {assignment.unit.title}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span>Vence: {formatDate(assignment.due_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                        <span>{assignment.max_score} puntos</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {assignment.instructions && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Instrucciones:</h4>
                      <p className="text-sm bg-gray-50 p-3 rounded">
                        {assignment.instructions}
                      </p>
                    </div>
                  )}

                  {assignment.submission ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded">
                        <h4 className="font-medium mb-2">Tu entrega:</h4>
                        <div className="text-sm space-y-2">
                          <p><strong>Entregado:</strong> {formatDate(assignment.submission.submitted_at)}</p>
                          
                          {assignment.submission.submission_text && (
                            <div>
                              <strong>Texto:</strong>
                              <p className="mt-1 bg-white p-2 rounded">{assignment.submission.submission_text}</p>
                            </div>
                          )}
                          
                          {assignment.submission.file_url && (
                            <div>
                              <strong>Archivo:</strong>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(assignment.submission!.file_url, '_blank')}
                                className="ml-2"
                              >
                                {assignment.submission.file_name}
                              </Button>
                            </div>
                          )}
                          
                          {assignment.submission.score !== null && assignment.submission.score !== undefined && (
                            <div>
                              <strong>Calificación:</strong>
                              <span className="ml-2 text-lg font-semibold">
                                {assignment.submission.score}/{assignment.max_score} puntos
                              </span>
                            </div>
                          )}
                          
                          {assignment.submission.feedback && (
                            <div>
                              <strong>Retroalimentación:</strong>
                              <p className="mt-1 bg-green-50 p-2 rounded">{assignment.submission.feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      {isOverdue(assignment.due_date) ? (
                        <Button disabled variant="outline">
                          <AlertCircleIcon className="h-4 w-4 mr-2" />
                          Fecha Vencida
                        </Button>
                      ) : (
                        <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                          <DialogTrigger asChild>
                            <Button onClick={() => openSubmitDialog(assignment)}>
                              <UploadIcon className="h-4 w-4 mr-2" />
                              Entregar Tarea
                            </Button>
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
                                  onChange={(e) => setSubmissionData({ ...submissionData, submission_text: e.target.value })}
                                  rows={4}
                                  placeholder="Escribe aquí tu respuesta o comentarios..."
                                />
                              </div>
                              <div>
                                <Label htmlFor="file">Archivo (opcional)</Label>
                                <Input
                                  id="file"
                                  type="file"
                                  onChange={(e) => setSubmissionData({ ...submissionData, file: e.target.files?.[0] || null })}
                                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                />
                                <p className="text-xs text-gray-500 mt-1">
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
                                <Button type="submit" disabled={uploading || (!submissionData.submission_text.trim() && !submissionData.file)}>
                                  {uploading ? "Subiendo..." : "Entregar Tarea"}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
