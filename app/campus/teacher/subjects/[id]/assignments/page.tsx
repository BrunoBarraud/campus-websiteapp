"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  ChevronLeft,
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-border border-t-primary" />
          <span className="text-slate-700 text-sm">Cargando tareas…</span>
        </div>
      </div>
    );
  }

  const totalSubmissions = assignments.reduce(
    (sum, a) => sum + (Number(a.submissions_count) || 0),
    0
  );
  const pendingCorrections = assignments.reduce((sum, a) => {
    const sub = Number(a.submissions_count) || 0;
    const graded = Number(a.graded_count) || 0;
    return sum + Math.max(0, sub - graded);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1"
          type="button"
        >
          <ChevronLeft className="w-4 h-4" /> Volver
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Tareas</h2>
            <p className="text-slate-500 text-sm sm:text-base">Creá, administrá y revisá entregas</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all active:scale-95 inline-flex items-center gap-2 text-sm sm:text-base"
                type="button"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" /> <span className="hidden sm:inline">Nueva Tarea</span><span className="sm:hidden">+</span>
              </button>
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
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="instructions">Instrucciones</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={4}
                    placeholder="Instrucciones detalladas para los estudiantes..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="due_date">Fecha de entrega *</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingAssignment ? "Actualizar" : "Crear"} Tarea</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
            <div className="p-2 sm:p-3 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
              <FileTextIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-3xl font-bold text-slate-800">{activeAssignments.length}</p>
              <p className="text-xs sm:text-sm font-medium text-slate-500">Tareas Activas</p>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
            <div className="p-2 sm:p-3 rounded-xl bg-amber-50 text-amber-600 flex-shrink-0">
              <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-3xl font-bold text-slate-800">{pendingCorrections}</p>
              <p className="text-xs sm:text-sm font-medium text-slate-500">Por corregir</p>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
            <div className="p-2 sm:p-3 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
              <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-3xl font-bold text-slate-800">{totalSubmissions}</p>
              <p className="text-xs sm:text-sm font-medium text-slate-500">Entregas Totales</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Tareas Activas ({activeAssignments.length})</TabsTrigger>
            <TabsTrigger value="inactive">Tareas Inactivas ({inactiveAssignments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-4">
            {activeAssignments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center">
                <h3 className="text-base sm:text-lg font-bold text-slate-700">No hay tareas activas</h3>
                <p className="text-slate-500 mt-1 text-sm sm:text-base">Creá la primera tarea para esta materia.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow ${
                      isOverdue(assignment.due_date)
                        ? "border-red-200 bg-red-50/40"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-900 truncate">{assignment.title}</h3>
                          {isOverdue(assignment.due_date) ? (
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
                              Vencida
                            </span>
                          ) : null}
                          {!assignment.is_active ? (
                            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200">
                              Inactiva
                            </span>
                          ) : null}
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

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(assignment)}>
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(assignment.id)}>
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-slate-700">
                        <CalendarIcon className="h-4 w-4 text-indigo-500" />
                        <span className="truncate">{formatDate(assignment.due_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <ClockIcon className="h-4 w-4 text-amber-500" />
                        <span>{assignment.max_score} puntos</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <UsersIcon className="h-4 w-4 text-emerald-500" />
                        <span>{assignment.submissions_count} entregas</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <FileTextIcon className="h-4 w-4 text-slate-500" />
                        <span>{assignment.graded_count} calificadas</span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                        type="button"
                        onClick={() =>
                          router.push(
                            `/campus/teacher/subjects/${subjectId}/assignments/${assignment.id}/submissions`
                          )
                        }
                      >
                        Ver Entregas ({assignment.submissions_count})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4 mt-4">
            {inactiveAssignments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center">
                <h3 className="text-base sm:text-lg font-bold text-slate-700">No hay tareas inactivas</h3>
                <p className="text-slate-500 mt-1 text-sm sm:text-base">Cuando desactives una tarea, aparecerá acá.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inactiveAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm opacity-70"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-900 truncate">{assignment.title}</h3>
                          <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200">
                            Inactiva
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1 line-clamp-2">{assignment.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(assignment)}>
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(assignment.id)}>
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm mt-5 pt-5 border-t border-slate-100 text-slate-700">
                      <span className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-indigo-500" /> {formatDate(assignment.due_date)}
                      </span>
                      <span className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-emerald-500" /> {assignment.submissions_count} entregas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
