"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Subject,
  SubjectUnit,
  SubjectContent,
  User,
  Assignment,
} from "@/app/lib/types";
import {
  UnitModal,
  ContentModal,
  DocumentModal,
  AssignmentModal,
} from "@/components/modals/SubjectModals";
import { UnitList } from "@/components/subjects/UnitList";
import SubjectHeroCard from "@/components/subjects/SubjectHeroCard";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Megaphone,
} from "lucide-react";
import {
  FiEdit,
  FiTrash2,
  FiFile,
  FiBookOpen,
  FiCalendar,
  FiFolder,
  FiClipboard,
} from "react-icons/fi";
import { BsPinFill } from "react-icons/bs";

interface Modal {
  type: "unit" | "content" | "document" | "assignment" | null;
  data?: SubjectUnit | SubjectContent | Assignment | { unitId?: string } | null;
}

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id: subjectId } = params as { id: string };

  const [subject, setSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<SubjectUnit[]>([]);
  const [content, setContent] = useState<SubjectContent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "units" | "content" | "assignments"
  >("overview");
  const [modal, setModal] = useState<Modal>({ type: null });

  // Función para recargar datos
  const refreshData = async () => {
    try {
      setLoading(true);

      // Obtener unidades de la materia
      const unitsResponse = await fetch(`/api/subjects/${subjectId}/units`);
      if (unitsResponse.ok) {
        const unitsData = await unitsResponse.json();

        // Obtener documentos de las unidades
        const documentsResponse = await fetch(
          `/api/debug-documents?subjectId=${subjectId}`
        );
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          const unitDocuments = documentsData.unit_documents || [];

          // Asociar documentos a las unidades
          const unitsWithDocuments = unitsData.map((unit: SubjectUnit) => ({
            ...unit,
            documents: unitDocuments.filter(
              (doc: any) => doc.unit_id === unit.id
            ),
          }));

          setUnits(unitsWithDocuments);
          console.log("Units with documents loaded:", unitsWithDocuments);
        } else {
          // Si falla la carga de documentos, usar unidades sin documentos
          setUnits(unitsData);
          console.log("Units loaded (without documents):", unitsData);
        }
      } else {
        console.error("Error loading units:", await unitsResponse.text());
      }

      // Obtener contenido de la materia
      const contentResponse = await fetch(`/api/subjects/${subjectId}/content`);
      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        setContent(contentData);
        console.log("Content loaded:", contentData); // Debug log
      } else {
        console.error("Error loading content:", await contentResponse.text());
      }

      // Obtener assignments de la materia
      const assignmentsResponse = await fetch(
        `/api/subjects/${subjectId}/assignments`
      );
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData);
        console.log("Assignments loaded:", assignmentsData); // Debug log
      } else {
        console.error(
          "Error loading assignments:",
          await assignmentsResponse.text()
        );
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de la materia, unidades y contenido
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener datos del usuario actual
        const userResponse = await fetch("/api/user/me");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentUser(userData);
        }

        // Obtener datos de la materia
        const subjectResponse = await fetch(`/api/subjects/${subjectId}`);
        if (subjectResponse.ok) {
          const subjectData = await subjectResponse.json();
          setSubject(subjectData);
        }

        // Usar refreshData para cargar unidades y contenido
        await refreshData();
      } catch (error) {
        console.error("Error loading subject data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (subjectId) {
      fetchData();
    }
  }, [subjectId]);

  // Verificar permisos
  // Para desarrollo: permitir que todos los profesores puedan editar cualquier materia
  const canEdit =
    currentUser?.role === "admin" || currentUser?.role === "teacher";

  // Para producción (comentado): solo el profesor asignado puede editar
  // const canEdit = currentUser?.role === 'admin' ||
  //   (currentUser?.role === 'teacher' && subject?.teacher_id === currentUser?.id);

  // Debug logs
  console.log("Debug permisos:", {
    currentUser: currentUser,
    subject: subject,
    canEdit: canEdit,
    isAdmin: currentUser?.role === "admin",
    isTeacher: currentUser?.role === "teacher",
    teacherIdMatch: subject?.teacher_id === currentUser?.id,
  });

  const handleCreateUnit = () => {
    setModal({ type: "unit", data: null });
  };

  const handleEditUnit = (unit: SubjectUnit) => {
    setModal({ type: "unit", data: unit });
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta unidad? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/subjects/${subjectId}/units/${unitId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await refreshData();
        alert('Unidad eliminada correctamente');
      } else {
        const error = await response.json();
        alert(`Error al eliminar la unidad: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert('Error al eliminar la unidad');
    }
  };

  const handleReorderUnits = async (reorderedUnits: SubjectUnit[]) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/units/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ units: reorderedUnits })
      });

      if (response.ok) {
        setUnits(reorderedUnits);
      } else {
        const error = await response.json();
        console.error('Error reordering units:', error);
        await refreshData(); // Recargar el orden original en caso de error
      }
    } catch (error) {
      console.error('Error reordering units:', error);
      await refreshData(); // Recargar el orden original en caso de error
    }
  };

  const handleCreateContent = () => {
    setModal({ type: "content", data: null });
  };

  const handleCreateAssignment = () => {
    setModal({ type: "assignment", data: null });
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setModal({ type: "assignment", data: assignment });
  };

  const handleUploadDocument = (unitId?: string) => {
    setModal({ type: "document", data: { unitId } });
  };

  const handleSaveUnit = async (unitData: Partial<SubjectUnit>) => {
    try {
      const url = unitData.id
        ? `/api/subjects/${subjectId}/units/${unitData.id}`
        : `/api/subjects/${subjectId}/units`;

      const method = unitData.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unitData),
      });

      if (response.ok) {
        const savedUnit = await response.json();
        console.log("Unit saved:", savedUnit); // Debug log

        // Refrescar todos los datos para asegurar consistencia
        await refreshData();

        setModal({ type: null });
        alert("Unidad guardada correctamente");
      } else {
        const error = await response.json();
        console.error("Error response:", error);
        alert(`Error al guardar la unidad: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving unit:", error);
      alert("Error al guardar la unidad");
    }
  };

  const handleSaveContent = async (contentData: Partial<SubjectContent>) => {
    try {
      const url = contentData.id
        ? `/api/subjects/${subjectId}/content/${contentData.id}`
        : `/api/subjects/${subjectId}/content`;

      const method = contentData.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentData),
      });

      if (response.ok) {
        await refreshData();
        setModal({ type: null });
        alert("Contenido guardado correctamente");
      } else {
        const error = await response.json();
        alert(`Error al guardar el contenido: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Error al guardar el contenido");
    }
  };

  const handleSaveAssignment = async (assignmentData: Partial<Assignment>) => {
    try {
      const url = assignmentData.id
        ? `/api/subjects/${subjectId}/assignments/${assignmentData.id}`
        : `/api/subjects/${subjectId}/assignments`;

      const method = assignmentData.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentData),
      });

      if (response.ok) {
        await refreshData();
        setModal({ type: null });
        alert("Tarea guardada correctamente");
      } else {
        const error = await response.json();
        alert(`Error al guardar la tarea: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving assignment:", error);
      alert("Error al guardar la tarea");
    }
  };

  const handleSaveDocument = async (documentData: any) => {
    try {
      console.log("Guardando documento:", documentData);

      if (!documentData.file) {
        alert("No se ha seleccionado ningún archivo");
        return;
      }

      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append("title", documentData.title);
      formData.append("description", documentData.description || "");
      formData.append("file", documentData.file);
      formData.append("unit_id", documentData.unit_id);
      formData.append("subject_id", documentData.subject_id);
      formData.append("is_public", "true");

      const response = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al subir el documento");
      }

      const result = await response.json();
      console.log("Documento guardado exitosamente:", result);

      await refreshData();
      setModal({ type: null });
      alert("Documento subido correctamente");
    } catch (error) {
      console.error("Error saving document:", error);
      alert(
        `Error al subir el documento: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "announcement":
        return <Megaphone className="w-4 h-4 text-indigo-600" />;
      case "resource":
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case "assignment":
        return <ClipboardList className="w-4 h-4 text-amber-600" />;
      case "note":
        return <FileText className="w-4 h-4 text-slate-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-border border-t-primary"></div>
          <span className="text-slate-700 text-sm">Cargando materia…</span>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            Materia no encontrada
          </h2>
          <p className="text-slate-600 mt-2">
            La materia que buscas no existe o no tienes permisos para verla.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:brightness-110 shadow-soft"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="p-4 md:p-8">
          <SubjectHeroCard
            title={subject.name}
            teacher={subject.teacher?.name || null}
            progress={null}
            nextDueLabel={(() => {
              const now = new Date();
              const upcoming = (assignments || [])
                .map((a) => ({ title: a.title, due: a.due_date ? new Date(a.due_date) : null }))
                .filter((x): x is { title: string; due: Date } =>
                  Boolean(x.due) && !isNaN((x.due as Date).getTime()) && (x.due as Date).getTime() >= now.getTime()
                )
                .sort((a, b) => a.due.getTime() - b.due.getTime());

              if (upcoming.length > 0) {
                const first = upcoming[0];
                const dd = first.due.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
                return `${dd} - ${first.title}`.trim();
              }

              return "Sin entregas próximas";
            })()}
            rightSlot={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors border border-white/20"
                  type="button"
                >
                  Volver
                </button>

                <button
                  onClick={() => refreshData()}
                  disabled={loading}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors border border-white/20 disabled:opacity-60"
                  type="button"
                >
                  {loading ? "Cargando..." : "Refrescar"}
                </button>

                {canEdit && (
                  <>
                    <button
                      onClick={handleCreateUnit}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors border border-white/20"
                      type="button"
                    >
                      Nueva Unidad
                    </button>
                    <button
                      onClick={handleCreateContent}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors border border-white/20"
                      type="button"
                    >
                      Nuevo Contenido
                    </button>
                    <button
                      onClick={handleCreateAssignment}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors border border-white/20"
                      type="button"
                    >
                      Nueva Tarea
                    </button>
                  </>
                )}
              </div>
            }
          />
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="-mb-px flex space-x-8">
              {[
                {
                  id: "overview",
                  name: "Información General",
                  icon: FiBookOpen,
                },
                { id: "units", name: "Unidades", icon: FiFolder },
                { id: "content", name: "Contenido", icon: FiFile },
                { id: "assignments", name: "Tareas", icon: FiClipboard },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as "overview" | "units" | "content" | "assignments"
                    )
                  }
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-yellow-500 text-yellow-700"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Descripción */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Descripción
                </h3>
                <p className="text-slate-700">
                  {subject.description ||
                    "No hay descripción disponible para esta materia."}
                </p>
              </div>

              {/* Información del curso */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Información del Curso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="text-2xl font-extrabold text-slate-900">
                      {units.length}
                    </div>
                    <div className="text-sm text-slate-600">Unidades</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="text-2xl font-extrabold text-slate-900">
                      {content.length}
                    </div>
                    <div className="text-sm text-slate-600">Publicaciones</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="text-2xl font-extrabold text-slate-900">
                      {units.reduce(
                        (acc, unit) => acc + (unit.documents?.length || 0),
                        0
                      )}
                    </div>
                    <div className="text-sm text-slate-600">Documentos</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">
                    <div className="text-2xl font-extrabold text-yellow-800">
                      {assignments.length}
                    </div>
                    <div className="text-sm text-slate-600">Tareas</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "units" && (
            <div className="space-y-6">
              {units.length > 0 ? (
                <UnitList
                  units={units}
                  onReorder={handleReorderUnits}
                  onEdit={handleEditUnit}
                  onDelete={handleDeleteUnit}
                  onAddContent={handleCreateContent}
                  onUploadDocument={handleUploadDocument}
                />
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <FiFolder className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No hay unidades
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Comienza creando la primera unidad de la materia.
                  </p>
                  {canEdit && (
                    <button
                      onClick={handleCreateUnit}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-yellow-700 transition"
                    >
                      Crear Primera Unidad
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "content" && (
            <div className="space-y-4">
              {content.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">
                          {getContentTypeIcon(item.content_type)}
                        </span>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        {item.is_pinned && (
                          <BsPinFill className="w-4 h-4 ml-2 text-yellow-500" />
                        )}
                      </div>
                      {item.content && (
                        <p className="text-slate-700 mt-2">{item.content}</p>
                      )}
                      <div className="flex items-center text-sm text-slate-500 mt-3">
                        <span>Por {item.creator?.name}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        {item.unit_id && (
                          <>
                            <span className="mx-2">•</span>
                            <span>
                              Unidad{" "}
                              {
                                units.find((u) => u.id === item.unit_id)
                                  ?.unit_number
                              }
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex space-x-2 ml-4">
                        <button className="text-slate-600 hover:text-slate-800">
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {content.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <FiFile className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No hay contenido
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Comienza creando el primer contenido de la materia.
                  </p>
                  {canEdit && (
                    <button
                      onClick={handleCreateContent}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-yellow-700 transition"
                    >
                      Crear Primer Contenido
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <FiClipboard className="w-5 h-5 mr-2 text-yellow-700" />
                        <h3 className="text-lg font-semibold text-slate-900">
                          {assignment.title}
                        </h3>
                      </div>
                      <p className="text-slate-700 mt-2">
                        {assignment.description}
                      </p>
                      {assignment.instructions && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                          <h4 className="text-sm font-medium text-yellow-900 mb-1">
                            Instrucciones:
                          </h4>
                          <p className="text-sm text-yellow-800">
                            {assignment.instructions}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-slate-500 mt-3 flex-wrap gap-4">
                        <span className="flex items-center">
                          <FiCalendar className="w-4 h-4 mr-1" />
                          Vence:{" "}
                          {new Date(assignment.due_date).toLocaleString()}
                        </span>
                        <span>Puntaje máximo: {assignment.max_score}</span>
                        {assignment.unit && (
                          <span>
                            Unidad {assignment.unit.unit_number}:{" "}
                            {assignment.unit.title}
                          </span>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditAssignment(assignment)}
                          className="text-slate-600 hover:text-slate-800"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {assignments.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <FiClipboard className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No hay tareas
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Comienza creando la primera tarea de la materia.
                  </p>
                  {canEdit && (
                    <button
                      onClick={handleCreateAssignment}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-yellow-700 transition"
                    >
                      Crear Primera Tarea
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modales */}
        <UnitModal
          isOpen={modal.type === "unit"}
          onClose={() => setModal({ type: null })}
          onSave={handleSaveUnit}
          unit={
            modal.data && "unit_number" in modal.data
              ? (modal.data as SubjectUnit)
              : null
          }
        />

        <ContentModal
          isOpen={modal.type === "content"}
          onClose={() => setModal({ type: null })}
          onSave={handleSaveContent}
          subjectId={subjectId}
          units={units}
        />

        <DocumentModal
          isOpen={modal.type === "document"}
          onClose={() => setModal({ type: null })}
          onSave={handleSaveDocument}
          subjectId={subjectId}
          unitId={
            modal.data && "unitId" in modal.data ? modal.data.unitId : undefined
          }
        />

        <AssignmentModal
          isOpen={modal.type === "assignment"}
          onClose={() => setModal({ type: null })}
          onSave={handleSaveAssignment}
          assignment={
            modal.data && "title" in modal.data
              ? (modal.data as Assignment)
              : null
          }
          units={units}
        />
      </div>
    </>
  );
}
