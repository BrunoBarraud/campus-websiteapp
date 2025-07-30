// 📚 Componente mejorado para gestión de unidades con CRUD completo
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, EditIcon, TrashIcon, FileIcon, CalendarIcon, BookOpenIcon } from "lucide-react";
import { toast } from "sonner";

interface Unit {
  id: string;
  unit_number: number;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
  assignments_count?: number;
  contents_count?: number;
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
  has_file?: boolean;
  file_url?: string;
  file_name?: string;
  submissions_count: number;
  graded_count: number;
}

interface UnitManagementProps {
  subjectId: string;
  onUnitSelect: (unitId: string) => void;
  selectedUnitId: string;
}

export default function UnitManagement({ subjectId, onUnitSelect, selectedUnitId }: UnitManagementProps) {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para unidades
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitForm, setUnitForm] = useState({
    unit_number: '',
    title: '',
    description: ''
  });

  // Estados para tareas
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    due_date: '',
    max_score: 100,
    instructions: '',
    is_active: false,
    has_file: false
  });
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);

  const fetchUnits = useCallback(async () => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/units`);
      if (response.ok) {
        const data = await response.json();
        setUnits(data);
        if (data.length > 0 && !selectedUnitId) {
          onUnitSelect(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      toast.error('Error al cargar las unidades');
    } finally {
      setLoading(false);
    }
  }, [subjectId, selectedUnitId, onUnitSelect]);

  const fetchAssignments = useCallback(async (unitId: string) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/assignments?unit_id=${unitId}`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    if (selectedUnitId) {
      fetchAssignments(selectedUnitId);
    }
  }, [selectedUnitId, fetchAssignments]);

  // CRUD para Unidades
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/subjects/${subjectId}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitForm),
      });

      if (response.ok) {
        toast.success('Unidad creada exitosamente');
        setShowUnitDialog(false);
        resetUnitForm();
        fetchUnits();
      } else {
        toast.error('Error al crear la unidad');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear la unidad');
    }
  };

  const handleEditUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    try {
      const response = await fetch(`/api/subjects/${subjectId}/units`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...unitForm, id: editingUnit.id }),
      });

      if (response.ok) {
        toast.success('Unidad actualizada exitosamente');
        setShowUnitDialog(false);
        resetUnitForm();
        fetchUnits();
      } else {
        toast.error('Error al actualizar la unidad');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la unidad');
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta unidad? Se eliminarán todas las tareas asociadas.')) return;

    try {
      const response = await fetch(`/api/subjects/${subjectId}/units`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: unitId }),
      });

      if (response.ok) {
        toast.success('Unidad eliminada exitosamente');
        fetchUnits();
        if (selectedUnitId === unitId) {
          const remainingUnits = units.filter(u => u.id !== unitId);
          if (remainingUnits.length > 0) {
            onUnitSelect(remainingUnits[0].id);
          }
        }
      } else {
        toast.error('Error al eliminar la unidad');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la unidad');
    }
  };

  // CRUD para Tareas
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      
      // Agregar datos del formulario
      Object.entries(assignmentForm).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      formData.append('unit_id', selectedUnitId);
      
      // Agregar archivo si existe
      if (assignmentFile) {
        formData.append('assignment_file', assignmentFile);
      }

      const response = await fetch(`/api/subjects/${subjectId}/assignments`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Tarea creada exitosamente');
        setShowAssignmentDialog(false);
        resetAssignmentForm();
        fetchAssignments(selectedUnitId);
      } else {
        toast.error('Error al crear la tarea');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear la tarea');
    }
  };

  const handleToggleAssignmentStatus = async (assignmentId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/assignments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignmentId, is_active: !isActive }),
      });

      if (response.ok) {
        toast.success(`Tarea ${!isActive ? 'activada' : 'desactivada'} exitosamente`);
        fetchAssignments(selectedUnitId);
      } else {
        toast.error('Error al cambiar el estado de la tarea');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cambiar el estado de la tarea');
    }
  };

  const resetUnitForm = () => {
    setUnitForm({ unit_number: '', title: '', description: '' });
    setEditingUnit(null);
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      title: '',
      description: '',
      due_date: '',
      max_score: 100,
      instructions: '',
      is_active: false,
      has_file: false
    });
    setAssignmentFile(null);
  };

  const openEditUnitDialog = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitForm({
      unit_number: unit.unit_number.toString(),
      title: unit.title,
      description: unit.description
    });
    setShowUnitDialog(true);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando unidades...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel de Unidades */}
      <div className="lg:col-span-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Unidades</h3>
          <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetUnitForm}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nueva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUnit ? 'Editar Unidad' : 'Crear Nueva Unidad'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={editingUnit ? handleEditUnit : handleCreateUnit} className="space-y-4">
                <div>
                  <Label htmlFor="unit_number">Número de Unidad</Label>
                  <Input
                    id="unit_number"
                    type="number"
                    value={unitForm.unit_number}
                    onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={unitForm.title}
                    onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={unitForm.description}
                    onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowUnitDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingUnit ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {units.map((unit) => (
            <Card
              key={unit.id}
              className={`cursor-pointer transition-colors ${
                selectedUnitId === unit.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => onUnitSelect(unit.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">Unidad {unit.unit_number}: {unit.title}</h4>
                    {unit.description && (
                      <p className="text-sm text-gray-600 mt-1">{unit.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <BookOpenIcon className="h-3 w-3 mr-1" />
                        {unit.contents_count || 0} contenidos
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <FileIcon className="h-3 w-3 mr-1" />
                        {unit.assignments_count || 0} tareas
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditUnitDialog(unit);
                      }}
                    >
                      <EditIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUnit(unit.id);
                      }}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Panel de Tareas */}
      <div className="lg:col-span-2">
        {selectedUnitId ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tareas de la Unidad</h3>
              <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetAssignmentForm}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nueva Tarea
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Tarea</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateAssignment} className="space-y-4">
                    <div>
                      <Label htmlFor="assignment_title">Título</Label>
                      <Input
                        id="assignment_title"
                        value={assignmentForm.title}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="assignment_description">Descripción</Label>
                      <Textarea
                        id="assignment_description"
                        value={assignmentForm.description}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                        required
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="assignment_instructions">Instrucciones</Label>
                      <Textarea
                        id="assignment_instructions"
                        value={assignmentForm.instructions}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                        rows={4}
                        placeholder="Instrucciones detalladas para los estudiantes..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="assignment_due_date">Fecha de entrega</Label>
                        <Input
                          id="assignment_due_date"
                          type="datetime-local"
                          value={assignmentForm.due_date}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="assignment_max_score">Puntuación máxima</Label>
                        <Input
                          id="assignment_max_score"
                          type="number"
                          min="1"
                          value={assignmentForm.max_score}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, max_score: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="assignment_file">Archivo de la tarea (opcional)</Label>
                      <Input
                        id="assignment_file"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setAssignmentFile(file);
                          setAssignmentForm({ ...assignmentForm, has_file: !!file });
                        }}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Formatos soportados: PDF, DOC, DOCX, TXT, ZIP, RAR
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="assignment_is_active"
                        checked={assignmentForm.is_active}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, is_active: e.target.checked })}
                      />
                      <Label htmlFor="assignment_is_active">Activar tarea inmediatamente</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowAssignmentDialog(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Crear Tarea</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-lg">{assignment.title}</h4>
                          <Badge variant={assignment.is_active ? "default" : "secondary"}>
                            {assignment.is_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                          {assignment.has_file && (
                            <Badge variant="outline">
                              <FileIcon className="h-3 w-3 mr-1" />
                              Con archivo
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{assignment.description}</p>
                        {assignment.instructions && (
                          <div className="bg-gray-50 p-3 rounded mb-3">
                            <p className="text-sm"><strong>Instrucciones:</strong> {assignment.instructions}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Entrega: {new Date(assignment.due_date).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div>Max: {assignment.max_score} pts</div>
                          <div>Entregas: {assignment.submissions_count}</div>
                          <div>Calificadas: {assignment.graded_count}</div>
                        </div>
                        {assignment.file_url && (
                          <div className="mt-3">
                            <a
                              href={assignment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <FileIcon className="h-4 w-4 mr-1" />
                              {assignment.file_name || 'Descargar archivo'}
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant={assignment.is_active ? "secondary" : "default"}
                          onClick={() => handleToggleAssignmentStatus(assignment.id, assignment.is_active)}
                        >
                          {assignment.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/campus/teacher/subjects/${subjectId}/assignments/${assignment.id}/submissions`)}
                        >
                          Ver Entregas
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {assignments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay tareas en esta unidad. ¡Crea la primera!
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Selecciona una unidad para ver sus tareas
          </div>
        )}
      </div>
    </div>
  );
}
