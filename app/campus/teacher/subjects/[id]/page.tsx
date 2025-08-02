"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  FileTextIcon,
  UploadIcon,
  UsersIcon,
  EyeIcon,
  EyeOffIcon,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  year: number;
  image_url: string | null;
}

interface Unit {
  id: string;
  unit_number: number;
  title: string;
  description: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  contents: Content[];
  assignments: Assignment[];
}

interface Content {
  id: string;
  title: string;
  content_type: string;
  content: string;
  file_url?: string;
  file_name?: string;
  is_pinned: boolean;
  created_at: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  instructions?: string;
  is_active: boolean;
  unit_id?: string;
  submissions_count: number;
  graded_count: number;
}

export default function UnifiedSubjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Estados para diálogos
  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [createContentOpen, setCreateContentOpen] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [editUnitOpen, setEditUnitOpen] = useState(false);
  const [editContentOpen, setEditContentOpen] = useState(false);
  const [editAssignmentOpen, setEditAssignmentOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");

  // Estados para formularios
  const [newUnit, setNewUnit] = useState({
    unit_number: "",
    title: "",
    description: "",
    is_active: true,
  });

  const [newContent, setNewContent] = useState({
    title: "",
    content: "",
    content_type: "text",
    is_pinned: false,
  });

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
    max_score: 100,
    instructions: "",
    is_active: true,
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.role !== "teacher") {
      router.push("/campus/login");
      return;
    }

    fetchData();
  }, [session, status, subjectId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener datos de la materia
      const subjectResponse = await fetch(
        `/api/admin/subjects?teacher_id=${session?.user?.id}`
      );
      const subjectsData = await subjectResponse.json();

      if (!subjectResponse.ok) {
        throw new Error(subjectsData.error || "Error al cargar la materia");
      }

      const currentSubject = subjectsData.find((s: any) => s.id === subjectId);
      if (!currentSubject) {
        throw new Error("Materia no encontrada");
      }

      setSubject(currentSubject);

      // Obtener unidades con contenido y tareas
      await fetchUnitsWithContent();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnitsWithContent = async () => {
    try {
      // Obtener unidades
      const unitsResponse = await fetch(`/api/subjects/${subjectId}/units`);
      const unitsData = await unitsResponse.json();

      if (!unitsResponse.ok) {
        throw new Error("Error al cargar unidades");
      }

      // Para cada unidad, obtener contenido y tareas
      const unitsWithContent = await Promise.all(
        unitsData.map(async (unit: any) => {
          const [contentsResponse, assignmentsResponse] = await Promise.all([
            fetch(`/api/subjects/${subjectId}/units/${unit.id}/contents`),
            fetch(`/api/subjects/${subjectId}/assignments?unit_id=${unit.id}`),
          ]);

          const contents = contentsResponse.ok
            ? await contentsResponse.json()
            : [];
          const assignments = assignmentsResponse.ok
            ? await assignmentsResponse.json()
            : [];

          return {
            ...unit,
            contents: contents || [],
            assignments: assignments || [],
          };
        })
      );

      setUnits(unitsWithContent);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast.error("Error al cargar unidades");
    }
  };

  const toggleUnit = (unitId: string) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedUnits(newExpanded);
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/subjects/${subjectId}/units`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUnit),
      });

      if (!response.ok) {
        throw new Error("Error al crear la unidad");
      }

      await fetchUnitsWithContent();
      setNewUnit({
        unit_number: "",
        title: "",
        description: "",
        is_active: true,
      });
      setCreateUnitOpen(false);
      toast.success("Unidad creada exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear la unidad");
    }
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUnitId) {
      toast.error("Selecciona una unidad primero");
      return;
    }

    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/units/${selectedUnitId}/contents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newContent),
        }
      );

      if (!response.ok) {
        throw new Error("Error al crear el contenido");
      }

      await fetchUnitsWithContent();
      setNewContent({
        title: "",
        content: "",
        content_type: "text",
        is_pinned: false,
      });
      setCreateContentOpen(false);
      setSelectedUnitId("");
      toast.success("Contenido creado exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear el contenido");
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUnitId) {
      toast.error("Selecciona una unidad primero");
      return;
    }

    try {
      const assignmentData = {
        ...newAssignment,
        unit_id: selectedUnitId,
      };

      const response = await fetch(`/api/subjects/${subjectId}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        throw new Error("Error al crear la tarea");
      }

      await fetchUnitsWithContent();
      setNewAssignment({
        title: "",
        description: "",
        due_date: "",
        max_score: 100,
        instructions: "",
        is_active: true,
      });
      setCreateAssignmentOpen(false);
      setSelectedUnitId("");
      toast.success("Tarea creada exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear la tarea");
    }
  };

  // Funciones para edición
  const handleEditUnit = (unit: Unit) => {
    setSelectedUnitId(unit.id);
    setNewUnit({
      unit_number: unit.unit_number.toString(),
      title: unit.title,
      description: unit.description,
      is_active: unit.is_active,
    });
    setEditUnitOpen(true);
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/units/${selectedUnitId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newUnit),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar la unidad");
      }

      await fetchUnitsWithContent();
      setNewUnit({
        unit_number: "",
        title: "",
        description: "",
        is_active: true,
      });
      setEditUnitOpen(false);
      setSelectedUnitId("");
      toast.success("Unidad actualizada exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar la unidad");
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta unidad? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/units/${unitId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar la unidad");
      }

      await fetchUnitsWithContent();
      toast.success("Unidad eliminada exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar la unidad");
    }
  };

  const handleEditContent = (content: Content) => {
    setSelectedContentId(content.id);
    setNewContent({
      title: content.title,
      content: content.content,
      content_type: content.content_type,
      is_pinned: content.is_pinned,
    });
    setEditContentOpen(true);
  };

  const handleUpdateContent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/units/${selectedUnitId}/contents/${selectedContentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newContent),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar el contenido");
      }

      await fetchUnitsWithContent();
      setNewContent({
        title: "",
        content: "",
        content_type: "text",
        is_pinned: false,
      });
      setEditContentOpen(false);
      setSelectedContentId("");
      toast.success("Contenido actualizado exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar el contenido");
    }
  };

  const handleDeleteContent = async (unitId: string, contentId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este contenido?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/units/${unitId}/contents/${contentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el contenido");
      }

      await fetchUnitsWithContent();
      toast.success("Contenido eliminado exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el contenido");
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignmentId(assignment.id);
    setSelectedUnitId(assignment.unit_id || "");
    setNewAssignment({
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date.slice(0, 16), // Format for datetime-local input
      max_score: assignment.max_score,
      instructions: assignment.instructions || "",
      is_active: assignment.is_active,
    });
    setEditAssignmentOpen(true);
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const assignmentData = {
        ...newAssignment,
        unit_id: selectedUnitId,
      };

      const response = await fetch(
        `/api/subjects/${subjectId}/assignments/${selectedAssignmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assignmentData),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar la tarea");
      }

      await fetchUnitsWithContent();
      setNewAssignment({
        title: "",
        description: "",
        due_date: "",
        max_score: 100,
        instructions: "",
        is_active: true,
      });
      setEditAssignmentOpen(false);
      setSelectedAssignmentId("");
      setSelectedUnitId("");
      toast.success("Tarea actualizada exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar la tarea");
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/assignments/${assignmentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar la tarea");
      }

      await fetchUnitsWithContent();
      toast.success("Tarea eliminada exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar la tarea");
    }
  };

  const toggleUnitVisibility = async (
    unitId: string,
    currentVisibility: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/units/${unitId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_active: !currentVisibility }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al cambiar la visibilidad");
      }

      await fetchUnitsWithContent();
      toast.success(
        `Unidad ${
          !currentVisibility ? "publicada" : "despublicada"
        } exitosamente`
      );
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cambiar la visibilidad");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {subject?.name}
              </h1>
              <p className="text-gray-600">
                {subject?.code} • Año {subject?.year}
              </p>
            </div>
            <Button onClick={() => setCreateUnitOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Unidad
            </Button>
          </div>
        </div>

        {/* Units */}
        <div className="space-y-4">
          {units.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay unidades creadas
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza creando tu primera unidad para organizar el contenido
                </p>
                <Button onClick={() => setCreateUnitOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Crear Primera Unidad
                </Button>
              </CardContent>
            </Card>
          ) : (
            units.map((unit) => (
              <Card key={unit.id} className="overflow-hidden">
                <Collapsible
                  open={expandedUnits.has(unit.id)}
                  onOpenChange={() => toggleUnit(unit.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {expandedUnits.has(unit.id) ? (
                            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                          )}
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              Unidad {unit.unit_number}: {unit.title}
                              {!unit.is_active && (
                                <Badge variant="secondary">No publicada</Badge>
                              )}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              {unit.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {unit.contents.length} contenidos
                          </Badge>
                          <Badge variant="outline">
                            {unit.assignments.length} tareas
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {/* Unit Actions */}
                      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUnitId(unit.id);
                              setCreateContentOpen(true);
                            }}
                          >
                            <UploadIcon className="h-4 w-4 mr-2" />
                            Agregar Contenido
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUnitId(unit.id);
                              setCreateAssignmentOpen(true);
                            }}
                          >
                            <FileTextIcon className="h-4 w-4 mr-2" />
                            Crear Tarea
                          </Button>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUnitVisibility(unit.id, unit.is_active);
                            }}
                            title={
                              unit.is_active
                                ? "Despublicar unidad"
                                : "Publicar unidad"
                            }
                          >
                            {unit.is_active ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditUnit(unit);
                            }}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUnit(unit.id);
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Contents */}
                      {unit.contents.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Contenidos
                          </h4>
                          <div className="space-y-2">
                            {unit.contents.map((content) => (
                              <div
                                key={content.id}
                                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <FileTextIcon className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {content.title}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {content.content_type}
                                    </p>
                                  </div>
                                  {content.is_pinned && (
                                    <Badge variant="secondary">Fijado</Badge>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedUnitId(unit.id);
                                      handleEditContent(content);
                                    }}
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteContent(unit.id, content.id);
                                    }}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assignments */}
                      {unit.assignments.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Tareas
                          </h4>
                          <div className="space-y-2">
                            {unit.assignments.map((assignment) => (
                              <div
                                key={assignment.id}
                                className="p-4 bg-green-50 rounded-lg"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <h5 className="font-medium text-gray-900">
                                        {assignment.title}
                                      </h5>
                                      <Badge
                                        variant={
                                          assignment.is_active
                                            ? "default"
                                            : "secondary"
                                        }
                                      >
                                        {assignment.is_active
                                          ? "Activa"
                                          : "Inactiva"}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {assignment.description}
                                    </p>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                      <span className="flex items-center">
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        {formatDate(assignment.due_date)}
                                      </span>
                                      <span className="flex items-center">
                                        <UsersIcon className="h-4 w-4 mr-1" />
                                        {assignment.submissions_count} entregas
                                      </span>
                                      <span>
                                        Puntos: {assignment.max_score}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        router.push(
                                          `/campus/teacher/subjects/${subjectId}/assignments/${assignment.id}/submissions`
                                        )
                                      }
                                    >
                                      <UsersIcon className="h-4 w-4 mr-1" />
                                      Ver Entregas (
                                      {assignment.submissions_count || 0})
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditAssignment(assignment);
                                      }}
                                    >
                                      <EditIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAssignment(assignment.id);
                                      }}
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {unit.contents.length === 0 &&
                        unit.assignments.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <FileTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                            <p>No hay contenido en esta unidad todavía</p>
                          </div>
                        )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </div>

        {/* Create Unit Dialog */}
        <Dialog open={createUnitOpen} onOpenChange={setCreateUnitOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Unidad</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUnit} className="space-y-4">
              <div>
                <Label htmlFor="unit_number">Número de Unidad</Label>
                <Input
                  id="unit_number"
                  type="number"
                  value={newUnit.unit_number}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, unit_number: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newUnit.title}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newUnit.description}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, description: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newUnit.is_active}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, is_active: e.target.checked })
                  }
                />
                <Label htmlFor="is_active">
                  Publicar unidad (visible para estudiantes)
                </Label>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  Crear Unidad
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateUnitOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Diálogo para crear contenido */}
        <Dialog open={createContentOpen} onOpenChange={setCreateContentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Contenido</DialogTitle>
              <DialogDescription>
                Agrega nuevo contenido a la unidad seleccionada.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateContent} className="space-y-4">
              <div>
                <Label htmlFor="content-title">Título</Label>
                <Input
                  id="content-title"
                  value={newContent.title}
                  onChange={(e) =>
                    setNewContent({ ...newContent, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="content-type">Tipo de contenido</Label>
                <select
                  id="content-type"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={newContent.content_type}
                  onChange={(e) =>
                    setNewContent({
                      ...newContent,
                      content_type: e.target.value,
                    })
                  }
                >
                  <option value="text">Texto</option>
                  <option value="video">Video</option>
                  <option value="document">Documento</option>
                  <option value="link">Enlace</option>
                </select>
              </div>
              <div>
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  value={newContent.content}
                  onChange={(e) =>
                    setNewContent({ ...newContent, content: e.target.value })
                  }
                  required
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_pinned"
                  checked={newContent.is_pinned}
                  onChange={(e) =>
                    setNewContent({
                      ...newContent,
                      is_pinned: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="is_pinned">Destacar contenido</Label>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  Crear Contenido
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateContentOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Diálogo para crear tarea */}
        <Dialog
          open={createAssignmentOpen}
          onOpenChange={setCreateAssignmentOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Tarea</DialogTitle>
              <DialogDescription>
                Crea una nueva tarea para la unidad seleccionada.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <Label htmlFor="assignment-title">Título</Label>
                <Input
                  id="assignment-title"
                  value={newAssignment.title}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="assignment-description">Descripción</Label>
                <Textarea
                  id="assignment-description"
                  value={newAssignment.description}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="instructions">Instrucciones</Label>
                <Textarea
                  id="instructions"
                  value={newAssignment.instructions}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      instructions: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="due-date">Fecha de entrega</Label>
                <Input
                  id="due-date"
                  type="datetime-local"
                  value={newAssignment.due_date}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      due_date: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="max-score">Puntaje máximo</Label>
                <Input
                  id="max-score"
                  type="number"
                  value={newAssignment.max_score}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      max_score: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newAssignment.is_active}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      is_active: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="is_active">Tarea activa</Label>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  Crear Tarea
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateAssignmentOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Unit Dialog */}
        <Dialog open={editUnitOpen} onOpenChange={setEditUnitOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Unidad</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateUnit} className="space-y-4">
              <div>
                <Label htmlFor="edit_unit_number">Número de Unidad</Label>
                <Input
                  id="edit_unit_number"
                  type="number"
                  value={newUnit.unit_number}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, unit_number: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_title">Título</Label>
                <Input
                  id="edit_title"
                  value={newUnit.title}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_description">Descripción</Label>
                <Textarea
                  id="edit_description"
                  value={newUnit.description}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, description: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={newUnit.is_active}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, is_active: e.target.checked })
                  }
                />
                <Label htmlFor="edit_is_active">
                  Publicar unidad (visible para estudiantes)
                </Label>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  Actualizar Unidad
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUnitOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Content Dialog */}
        <Dialog open={editContentOpen} onOpenChange={setEditContentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Contenido</DialogTitle>
              <DialogDescription>
                Modifica el contenido seleccionado.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateContent} className="space-y-4">
              <div>
                <Label htmlFor="edit-content-title">Título</Label>
                <Input
                  id="edit-content-title"
                  value={newContent.title}
                  onChange={(e) =>
                    setNewContent({ ...newContent, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-content-type">Tipo de contenido</Label>
                <select
                  id="edit-content-type"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={newContent.content_type}
                  onChange={(e) =>
                    setNewContent({
                      ...newContent,
                      content_type: e.target.value,
                    })
                  }
                >
                  <option value="text">Texto</option>
                  <option value="video">Video</option>
                  <option value="document">Documento</option>
                  <option value="link">Enlace</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-content">Contenido</Label>
                <Textarea
                  id="edit-content"
                  value={newContent.content}
                  onChange={(e) =>
                    setNewContent({ ...newContent, content: e.target.value })
                  }
                  required
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_is_pinned"
                  checked={newContent.is_pinned}
                  onChange={(e) =>
                    setNewContent({
                      ...newContent,
                      is_pinned: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="edit_is_pinned">Destacar contenido</Label>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  Actualizar Contenido
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditContentOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Assignment Dialog */}
        <Dialog open={editAssignmentOpen} onOpenChange={setEditAssignmentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tarea</DialogTitle>
              <DialogDescription>
                Modifica la tarea seleccionada.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateAssignment} className="space-y-4">
              <div>
                <Label htmlFor="edit-assignment-title">Título</Label>
                <Input
                  id="edit-assignment-title"
                  value={newAssignment.title}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-assignment-description">Descripción</Label>
                <Textarea
                  id="edit-assignment-description"
                  value={newAssignment.description}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-instructions">Instrucciones</Label>
                <Textarea
                  id="edit-instructions"
                  value={newAssignment.instructions}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      instructions: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-due-date">Fecha de entrega</Label>
                <Input
                  id="edit-due-date"
                  type="datetime-local"
                  value={newAssignment.due_date}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      due_date: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-max-score">Puntaje máximo</Label>
                <Input
                  id="edit-max-score"
                  type="number"
                  value={newAssignment.max_score}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      max_score: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={newAssignment.is_active}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      is_active: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="edit_is_active">Tarea activa</Label>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  Actualizar Tarea
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditAssignmentOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
