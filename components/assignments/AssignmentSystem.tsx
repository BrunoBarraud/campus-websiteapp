"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FiCalendar,
  FiFileText,
  FiUpload,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiEye,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiPlus,
} from "react-icons/fi";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface Assignment {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  instructions?: string;
  unit_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  unit?: {
    id: string;
    title: string;
    unit_number: number;
  };
  submission?: {
    id: string;
    submission_text?: string;
    file_url?: string;
    file_name?: string;
    status: "draft" | "submitted" | "graded";
    submitted_at?: string;
    score?: number;
    feedback?: string;
    graded_at?: string;
  };
  submissions_count?: number;
  average_score?: number;
}

interface Unit {
  id: string;
  title: string;
  unit_number: number;
}

interface AssignmentSystemProps {
  subjectId: string;
  userRole: "admin" | "teacher" | "student";
  currentUserId: string;
  units: Unit[];
  onAssignmentCreated?: () => void;
}

interface AssignmentForm {
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  instructions: string;
  unit_id: string;
  is_active: boolean;
}

interface SubmissionForm {
  submission_text: string;
  file: File | null;
}

export default function AssignmentSystem({
  subjectId,
  userRole,
  units,
  onAssignmentCreated,
}: AssignmentSystemProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "submitted" | "graded"
  >("all");
  const [sortBy, setSortBy] = useState<"due_date" | "created_at" | "title">(
    "due_date"
  );

  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
    title: "",
    description: "",
    due_date: "",
    max_score: 100,
    instructions: "",
    unit_id: "",
    is_active: true,
  });

  const [submissionForm, setSubmissionForm] = useState<SubmissionForm>({
    submission_text: "",
    file: null,
  });

  const [submitting, setSubmitting] = useState(false);

  // Cargar tareas
  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint =
        userRole === "student"
          ? `/api/student/subjects/${subjectId}/assignments`
          : `/api/subjects/${subjectId}/assignments`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("Error al cargar tareas");
      }

      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  }, [subjectId, userRole]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Filtrar y ordenar tareas
  const filteredAssignments = assignments
    .filter((assignment) => {
      if (filter === "all") return true;
      if (filter === "pending") return !assignment.submission;
      if (filter === "submitted")
        return (
          assignment.submission && assignment.submission.status === "submitted"
        );
      if (filter === "graded")
        return (
          assignment.submission && assignment.submission.status === "graded"
        );
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "created_at":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "due_date":
        default:
          return (
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          );
      }
    });

  // Crear/editar tarea
  const handleSaveAssignment = async () => {
    try {
      const url = editingAssignment
        ? `/api/subjects/${subjectId}/assignments`
        : `/api/subjects/${subjectId}/assignments`;

      const method = editingAssignment ? "PUT" : "POST";

      const body = editingAssignment
        ? { ...assignmentForm, id: editingAssignment.id }
        : assignmentForm;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Error al guardar tarea");
      }

      await loadAssignments();
      setShowAssignmentModal(false);
      setEditingAssignment(null);
      resetAssignmentForm();

      if (onAssignmentCreated) onAssignmentCreated();
    } catch (error) {
      console.error("Error saving assignment:", error);
      alert("Error al guardar la tarea");
    }
  };

  // Enviar entrega
  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      if (submissionForm.submission_text.trim()) {
        formData.append("content", submissionForm.submission_text);
      }
      if (submissionForm.file) {
        formData.append("file", submissionForm.file);
      }

      const response = await fetch(
        `/api/subjects/${subjectId}/assignments/${selectedAssignment.id}/submissions`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al enviar entrega");
      }

      await loadAssignments();
      setShowSubmissionModal(false);
      setSelectedAssignment(null);
      resetSubmissionForm();
      alert("Entrega enviada exitosamente");
    } catch (error: any) {
      console.error("Error submitting assignment:", error);
      alert(`Error al enviar entrega: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar tarea
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;

    try {
      const response = await fetch(`/api/subjects/${subjectId}/assignments`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignment_id: assignmentId }),
      });

      if (!response.ok) {
        throw new Error("Error al eliminar tarea");
      }

      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Error al eliminar la tarea");
    }
  };

  // Resetear formularios
  const resetAssignmentForm = () => {
    setAssignmentForm({
      title: "",
      description: "",
      due_date: "",
      max_score: 100,
      instructions: "",
      unit_id: "",
      is_active: true,
    });
  };

  const resetSubmissionForm = () => {
    setSubmissionForm({
      submission_text: "",
      file: null,
    });
  };

  // Obtener estado de la tarea
  const getAssignmentStatus = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const isOverdue = now > dueDate;

    if (userRole === "student") {
      if (!assignment.submission) {
        return {
          status: isOverdue ? "overdue" : "pending",
          label: isOverdue ? "Vencida" : "Pendiente",
          color: isOverdue
            ? "text-red-600 bg-red-50"
            : "text-yellow-600 bg-yellow-50",
        };
      }

      if (assignment.submission.status === "graded") {
        return {
          status: "graded",
          label: "Calificada",
          color: "text-green-600 bg-green-50",
        };
      }

      return {
        status: "submitted",
        label: "Entregada",
        color: "text-blue-600 bg-blue-50",
      };
    } else {
      return {
        status: isOverdue ? "overdue" : "active",
        label: isOverdue ? "Vencida" : "Activa",
        color: isOverdue
          ? "text-red-600 bg-red-50"
          : "text-green-600 bg-green-50",
      };
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Renderizar modal de tarea
  const renderAssignmentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">
            {editingAssignment ? "Editar Tarea" : "Nueva Tarea"}
          </h3>
          <button
            onClick={() => {
              setShowAssignmentModal(false);
              setEditingAssignment(null);
              resetAssignmentForm();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label htmlFor="title">Título de la tarea *</Label>
            <Input
              id="title"
              value={assignmentForm.title}
              onChange={(e) =>
                setAssignmentForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              placeholder="Ej: Ejercicios de álgebra básica"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción *</Label>
            <textarea
              id="description"
              value={assignmentForm.description}
              onChange={(e) =>
                setAssignmentForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe qué deben hacer los estudiantes..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Fecha de entrega *</Label>
              <Input
                type="datetime-local"
                id="due_date"
                value={assignmentForm.due_date}
                onChange={(e) =>
                  setAssignmentForm((prev) => ({
                    ...prev,
                    due_date: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="max_score">Puntaje máximo</Label>
              <Input
                type="number"
                id="max_score"
                value={assignmentForm.max_score}
                onChange={(e) =>
                  setAssignmentForm((prev) => ({
                    ...prev,
                    max_score: Number(e.target.value),
                  }))
                }
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="unit">Unidad (opcional)</Label>
            <select
              id="unit"
              value={assignmentForm.unit_id}
              onChange={(e) =>
                setAssignmentForm((prev) => ({
                  ...prev,
                  unit_id: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin unidad específica</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unidad {unit.unit_number}: {unit.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="instructions">
              Instrucciones adicionales (opcional)
            </Label>
            <textarea
              id="instructions"
              value={assignmentForm.instructions}
              onChange={(e) =>
                setAssignmentForm((prev) => ({
                  ...prev,
                  instructions: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Instrucciones específicas, formato de entrega, etc..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={assignmentForm.is_active}
              onChange={(e) =>
                setAssignmentForm((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="is_active" className="ml-2">
              Tarea activa (visible para estudiantes)
            </Label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignmentModal(false);
                setEditingAssignment(null);
                resetAssignmentForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAssignment}
              disabled={
                !assignmentForm.title.trim() ||
                !assignmentForm.description.trim() ||
                !assignmentForm.due_date
              }
            >
              {editingAssignment ? "Actualizar" : "Crear"} Tarea
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar modal de entrega
  const renderSubmissionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">
            Entregar: {selectedAssignment?.title}
          </h3>
          <button
            onClick={() => {
              setShowSubmissionModal(false);
              setSelectedAssignment(null);
              resetSubmissionForm();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label htmlFor="submission_text">Texto de la entrega</Label>
            <textarea
              id="submission_text"
              value={submissionForm.submission_text}
              onChange={(e) =>
                setSubmissionForm((prev) => ({
                  ...prev,
                  submission_text: e.target.value,
                }))
              }
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Escribe tu respuesta aquí..."
            />
          </div>

          <div>
            <Label htmlFor="file">Archivo adjunto (opcional)</Label>
            <Input
              type="file"
              id="file"
              onChange={(e) =>
                setSubmissionForm((prev) => ({
                  ...prev,
                  file: e.target.files?.[0] || null,
                }))
              }
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
            />
            <p className="text-sm text-gray-500 mt-1">
              Formatos aceptados: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP, RAR
              (máximo 10MB)
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowSubmissionModal(false);
                setSelectedAssignment(null);
                resetSubmissionForm();
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitAssignment}
              disabled={
                submitting ||
                (!submissionForm.submission_text.trim() && !submissionForm.file)
              }
            >
              {submitting ? "Enviando..." : "Entregar Tarea"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {userRole === "student" ? "Mis Tareas" : "Gestión de Tareas"}
          </h2>
          <p className="text-gray-600">
            {filteredAssignments.length} tarea
            {filteredAssignments.length !== 1 ? "s" : ""}
            {filter !== "all" && ` (${filter})`}
          </p>
        </div>

        {(userRole === "admin" || userRole === "teacher") && (
          <Button onClick={() => setShowAssignmentModal(true)}>
            <FiPlus className="w-4 h-4 mr-2" />
            Nueva Tarea
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-4">
        {userRole === "student" && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las tareas</option>
            <option value="pending">Pendientes</option>
            <option value="submitted">Entregadas</option>
            <option value="graded">Calificadas</option>
          </select>
        )}

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="due_date">Fecha de entrega</option>
          <option value="created_at">Fecha de creación</option>
          <option value="title">Título</option>
        </select>
      </div>

      {/* Lista de tareas */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay tareas
          </h3>
          <p className="text-gray-600">
            {filter !== "all"
              ? `No hay tareas ${filter}.`
              : userRole === "student"
              ? "Aún no se han asignado tareas en esta materia."
              : "Aún no has creado tareas para esta materia."}
          </p>
          {(userRole === "admin" || userRole === "teacher") &&
            filter === "all" && (
              <Button
                className="mt-4"
                onClick={() => setShowAssignmentModal(true)}
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Crear primera tarea
              </Button>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAssignments.map((assignment) => {
            const status = getAssignmentStatus(assignment);
            const isOverdue = new Date() > new Date(assignment.due_date);

            return (
              <div
                key={assignment.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {assignment.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {assignment.unit && (
                      <p className="text-sm text-blue-600 mb-2">
                        Unidad {assignment.unit.unit_number}:{" "}
                        {assignment.unit.title}
                      </p>
                    )}
                  </div>

                  {(userRole === "admin" || userRole === "teacher") && (
                    <div className="flex space-x-1 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingAssignment(assignment);
                          setAssignmentForm({
                            title: assignment.title,
                            description: assignment.description,
                            due_date: assignment.due_date.slice(0, 16),
                            max_score: assignment.max_score,
                            instructions: assignment.instructions || "",
                            unit_id: assignment.unit_id || "",
                            is_active: assignment.is_active,
                          });
                          setShowAssignmentModal(true);
                        }}
                      >
                        <FiEdit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {assignment.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <FiCalendar className="w-4 h-4 mr-2" />
                    <span>Vence: {formatDate(assignment.due_date)}</span>
                    {isOverdue && (
                      <FiAlertCircle className="w-4 h-4 ml-2 text-red-500" />
                    )}
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <FiFileText className="w-4 h-4 mr-2" />
                    <span>Puntaje máximo: {assignment.max_score}</span>
                  </div>

                  {userRole !== "student" && (
                    <div className="flex items-center text-sm text-gray-500">
                      <FiCheck className="w-4 h-4 mr-2" />
                      <span>
                        {assignment.submissions_count || 0} entrega
                        {assignment.submissions_count !== 1 ? "s" : ""}
                        {assignment.average_score !== undefined &&
                          ` • Promedio: ${assignment.average_score.toFixed(1)}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Información de entrega para estudiantes */}
                {userRole === "student" && assignment.submission && (
                  <div className="bg-blue-50 p-3 rounded-md mb-4">
                    <p className="text-sm text-blue-800 font-medium">
                      Estado:{" "}
                      {assignment.submission.status === "graded"
                        ? "Calificada"
                        : "Entregada"}
                    </p>
                    {assignment.submission.submitted_at && (
                      <p className="text-sm text-blue-600">
                        Entregada:{" "}
                        {formatDate(assignment.submission.submitted_at)}
                      </p>
                    )}
                    {assignment.submission.score !== undefined && (
                      <p className="text-sm text-blue-600">
                        Calificación: {assignment.submission.score} /{" "}
                        {assignment.max_score}
                      </p>
                    )}
                    {assignment.submission.feedback && (
                      <p className="text-sm text-blue-600 mt-2">
                        <strong>Retroalimentación:</strong>{" "}
                        {assignment.submission.feedback}
                      </p>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2">
                  {userRole === "student" &&
                    !assignment.submission &&
                    !isOverdue && (
                      <Button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowSubmissionModal(true);
                        }}
                        className="flex-1"
                      >
                        <FiUpload className="w-4 h-4 mr-2" />
                        Entregar Tarea
                      </Button>
                    )}

                  {userRole === "student" &&
                    assignment.submission?.file_url && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(assignment.submission!.file_url, "_blank")
                        }
                      >
                        <FiDownload className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                    )}

                  {(userRole === "admin" || userRole === "teacher") && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        (window.location.href = `/campus/subjects/${subjectId}/assignments/${assignment.id}/submissions`)
                      }
                      className="flex-1"
                    >
                      <FiEye className="w-4 h-4 mr-2" />
                      Ver Entregas
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      {showAssignmentModal && renderAssignmentModal()}
      {showSubmissionModal && renderSubmissionModal()}
    </div>
  );
}
