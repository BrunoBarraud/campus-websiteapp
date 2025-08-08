"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  FileTextIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  instructions?: string;
  is_active: boolean;
  unit_id?: string;
  created_at: string;
  submissions_count: number;
  graded_count: number;
  unit?: {
    title: string;
  };
}

interface Unit {
  id: string;
  title: string;
  order_index: number;
}

export default function TeacherAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );
  const [subjectId, setSubjectId] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    max_score: 100,
    instructions: "",
    unit_id: null as string | null,
  });

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setSubjectId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/assignments`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Error al cargar las tareas");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  const fetchUnits = useCallback(async () => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/units`);
      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  }, [subjectId]);

  useEffect(() => {
    if (session?.user && subjectId) {
      fetchAssignments();
      fetchUnits();
    }
  }, [session, subjectId, fetchAssignments, fetchUnits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAssignment
        ? `/api/subjects/${subjectId}/assignments`
        : `/api/subjects/${subjectId}/assignments`;

      const method = editingAssignment ? "PUT" : "POST";
      const body = editingAssignment
        ? { ...formData, id: editingAssignment.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(
          editingAssignment
            ? "Tarea actualizada exitosamente"
            : "Tarea creada exitosamente"
        );
        setIsDialogOpen(false);
        setEditingAssignment(null);
        setFormData({
          title: "",
          description: "",
          due_date: "",
          max_score: 100,
          instructions: "",
          unit_id: null,
        });
        fetchAssignments();
      } else {
        toast.error("Error al guardar la tarea");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar la tarea");
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      due_date:
        assignment.due_date.split("T")[0] +
        "T" +
        assignment.due_date.split("T")[1].substring(0, 5),
      max_score: assignment.max_score,
      instructions: assignment.instructions || "",
      unit_id: assignment.unit_id || null,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;

    try {
      const response = await fetch(`/api/subjects/${subjectId}/assignments`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: assignmentId }),
      });

      if (response.ok) {
        toast.success("Tarea eliminada exitosamente");
        fetchAssignments();
      } else {
        toast.error("Error al eliminar la tarea");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar la tarea");
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

  const activeAssignments = assignments.filter((a) => a.is_active);
  const inactiveAssignments = assignments.filter((a) => !a.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando tareas...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Tareas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingAssignment(null);
                setFormData({
                  title: "",
                  description: "",
                  due_date: "",
                  max_score: 100,
                  instructions: "",
                  unit_id: null,
                });
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAssignment ? "Editar Tarea" : "Crear Nueva Tarea"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="instructions">Instrucciones</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, instructions: e.target.value })
                  }
                  rows={4}
                  placeholder="Instrucciones detalladas para los estudiantes..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="due_date">Fecha de entrega *</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_score">Puntuación máxima</Label>
                  <Input
                    id="max_score"
                    type="number"
                    min="1"
                    value={formData.max_score}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_score: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="unit_id">Unidad (opcional)</Label>
                <Select
                  value={formData.unit_id || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      unit_id: value === "none" ? null : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin unidad específica</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAssignment ? "Actualizar" : "Crear"} Tarea
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Tareas Activas ({activeAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Tareas Inactivas ({inactiveAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAssignments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No hay tareas activas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeAssignments.map((assignment) => (
                <Card
                  key={assignment.id}
                  className={`${
                    isOverdue(assignment.due_date)
                      ? "border-red-200 bg-red-50"
                      : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {assignment.title}
                          {isOverdue(assignment.due_date) && (
                            <Badge variant="destructive">Vencida</Badge>
                          )}
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(assignment)}
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(assignment.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(assignment.due_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                        <span>{assignment.max_score} puntos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-gray-500" />
                        <span>{assignment.submissions_count} entregas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileTextIcon className="h-4 w-4 text-gray-500" />
                        <span>{assignment.graded_count} calificadas</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/campus/teacher/subjects/${subjectId}/assignments/${assignment.id}/submissions`
                          )
                        }
                      >
                        Ver Entregas ({assignment.submissions_count})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {inactiveAssignments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No hay tareas inactivas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {inactiveAssignments.map((assignment) => (
                <Card key={assignment.id} className="opacity-60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {assignment.title}
                      <Badge variant="secondary">Inactiva</Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {assignment.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        Fecha límite: {formatDate(assignment.due_date)}
                      </span>
                      <span>{assignment.submissions_count} entregas</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
