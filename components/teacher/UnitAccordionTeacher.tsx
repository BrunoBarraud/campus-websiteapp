import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  ListChecks,
  MessageSquare,
  Trash2,
} from "lucide-react";

interface UnitAccordionProps {
  subjectId: string;
  subjectName: string;
}

interface Unit {
  id: string;
  unit_number: number;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
  is_visible?: boolean;
}

interface Section {
  id: string;
  title: string;
  content_type: string;
  content: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  creator_name?: string;
  assignment_id?: string;
  due_date?: string;
  is_active?: boolean;
  forum_id?: string;
  questions_count?: number;
  is_closed?: boolean;
}

const UnitAccordionTeacher: React.FC<UnitAccordionProps> = ({
  subjectId,
  subjectName: _subjectName,
}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAddSection, setShowAddSection] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [newUnit, setNewUnit] = useState({ title: "", description: "" });
  const [newSection, setNewSection] = useState({
    title: "",
    content_type: "document",
    content: "",
    file: null as File | null,
    due_date: "",
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<{
    unitId: string;
    contentId: string;
    title: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    fetchUnits();
  }, [subjectId]);

  useEffect(() => {
    const onOpenAddUnit = () => setShowAddUnit(true);
    window.addEventListener("teacher-open-add-unit", onOpenAddUnit);
    return () => window.removeEventListener("teacher-open-add-unit", onOpenAddUnit);
  }, []);

  // Agregar logs más detallados en el fetchUnits
  const fetchUnits = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Iniciando fetch de unidades para SubjectId:', subjectId);
      const res = await fetch(`/api/subjects/${subjectId}/units`);
      const rawData = await res.text();
      console.log('Respuesta cruda de la API (unidades):', rawData);
      let data;
      try {
        data = JSON.parse(rawData);
      } catch (parseError) {
        console.error('Error al parsear JSON de unidades:', parseError);
        data = [];
      }
      if (!Array.isArray(data)) data = [];
      data.sort((a: Unit, b: Unit) => a.order_index - b.order_index);
      setUnits(data);

      console.log('Unidades obtenidas:', data);

      const sectionsArr = await Promise.all(
        data.map(async (unit: Unit) => {
          try {
            console.log(`Iniciando fetch de secciones para unidad ${unit.id}`);
            const secRes = await fetch(`/api/units/${unit.id}/sections`);
            let secData = await secRes.json();
            if (!Array.isArray(secData)) secData = [];

            console.log(`Secciones obtenidas para unidad ${unit.id}:`, secData);

            if (Array.isArray(secData) && secData.length === 0) {
              console.log(`Secciones vacías para unidad ${unit.id}, intentando fallback a /api/subjects/${subjectId}/units/${unit.id}/contents`);
              try {
                const contentsRes = await fetch(`/api/subjects/${subjectId}/units/${unit.id}/contents`);
                const contentsText = await contentsRes.text();
                console.log(`Fallback response status: ${contentsRes.status} for unit ${unit.id}`);
                console.log('Fallback raw body:', contentsText);
                let contentsData = [] as any;
                try {
                  contentsData = JSON.parse(contentsText);
                } catch (parseErr) {
                  console.error('Error al parsear JSON del fallback de contenidos:', parseErr);
                }
                if (Array.isArray(contentsData) && contentsData.length > 0) {
                  secData = contentsData as Section[];
                } else {
                  console.log(`Fallback no devolvió secciones para unidad ${unit.id}`);
                }
              } catch (fallbackError) {
                console.error('Error en el fetch del fallback de contenidos:', fallbackError);
              }
            }

            // Cargar también los foros asociados a esta unidad
            try {
              console.log(`Iniciando fetch de foros para unidad ${unit.id}`);
              const forumsRes = await fetch(`/api/forums?unit_id=${unit.id}`);
              if (forumsRes.ok) {
                const forumsData = await forumsRes.json();
                console.log(`Foros obtenidos para unidad ${unit.id}:`, forumsData);
                
                // Convertir foros a formato de sección
                if (Array.isArray(forumsData) && forumsData.length > 0) {
                  const forumSections = forumsData.map((forum: any) => ({
                    id: forum.id,
                    title: forum.title,
                    content_type: 'forum',
                    content: forum.description || '',
                    created_at: forum.created_at,
                    creator_name: 'Profesor',
                    forum_id: forum.id,
                    questions_count: forum.questions_count || 0,
                    is_closed: forum.is_closed || false,
                  }));
                  secData = [...secData, ...forumSections];
                }
              }
            } catch (forumError) {
              console.error('Error al obtener foros para unidad', unit.id, forumError);
            }

            return [unit.id, secData] as [string, Section[]];
          } catch (sectionError) {
            console.error('Error al obtener secciones para unidad', unit.id, sectionError);
            return [unit.id, []] as [string, Section[]];
          }
        })
      );
      const sectionsObj: Record<string, Section[]> = Object.fromEntries(sectionsArr);
      console.log('Secciones obtenidas para todas las unidades:', sectionsObj);
      setSections(sectionsObj);
    } catch (err) {
      setError("Error al cargar unidades o secciones.");
      console.error('Error en fetchUnits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditedUnit = async () => {
    if (!editingUnit) return;
    if (!editingUnit.title?.trim()) return;
    if (!editingUnit.unit_number || editingUnit.unit_number < 1) return;

    try {
      const res = await fetch(`/api/subjects/${subjectId}/units/${editingUnit.id}` as string, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingUnit.title,
          description: editingUnit.description,
          unit_number: editingUnit.unit_number,
          is_visible: editingUnit.is_visible,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error ? String(data.error) : "No se pudo actualizar la unidad.";
        setError(msg);
        return;
      }

      const updated = await res.json().catch(() => null);
      if (updated) {
        setUnits((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      } else {
        await fetchUnits();
      }
      setEditingUnit(null);
    } catch {
      setError("No se pudo actualizar la unidad.");
    }
  };

  const handleDeleteContent = async (
    unitId: string,
    contentId: string
  ) => {
    if (!window.confirm("¿Seguro que quieres eliminar este contenido?")) return;

    const res = await fetch(`/api/subjects/${subjectId}/content/${contentId}` as string, {
      method: "DELETE",
    });

    if (res.ok) {
      setSections((prev) => ({
        ...prev,
        [unitId]: (prev[unitId] || []).filter((s) => s.id !== contentId),
      }));
      return;
    }

    const data = await res.json().catch(() => ({}));
    alert(data?.error || "Error al eliminar el contenido");
  };

  const handleSaveEditedContent = async () => {
    if (!editingContent) return;
    if (!editingContent.title.trim()) return;

    const res = await fetch(
      `/api/subjects/${subjectId}/content/${editingContent.contentId}` as string,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingContent.title,
          content: editingContent.content,
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "Error al actualizar el contenido");
      return;
    }

    const updated = await res.json().catch(() => null);
    if (updated) {
      setSections((prev) => ({
        ...prev,
        [editingContent.unitId]: (prev[editingContent.unitId] || []).map((s) =>
          s.id === editingContent.contentId
            ? {
                ...s,
                title: updated.title ?? editingContent.title,
                content: updated.content ?? editingContent.content,
              }
            : s
        ),
      }));
    }

    setEditingContent(null);
  };

  const handleDeleteForum = async (unitId: string, forumId: string) => {
    if (!window.confirm("¿Seguro que quieres eliminar este foro?")) return;
    const res = await fetch(`/api/forums/${forumId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setSections((prev) => ({
        ...prev,
        [unitId]: (prev[unitId] || []).filter((s) => (s.forum_id || s.id) !== forumId),
      }));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "Error al eliminar el foro");
    }
  };

  const handleExpand = (unitId: string) => {
    setExpandedUnit(expandedUnit === unitId ? null : unitId);
  };

  const handleDeleteUnit = async (e: React.MouseEvent, unitId: string) => {
    e.stopPropagation();

    if (!window.confirm("¿Seguro que quieres eliminar esta unidad?")) return;

    try {
      const res = await fetch(`/api/subjects/${subjectId}/units/${unitId}` as string, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error ? String(data.error) : "No se pudo eliminar la unidad.";
        setError(msg);
        return;
      }

      setUnits((prev) => prev.filter((u) => u.id !== unitId));
      setSections((prev) => {
        const next = { ...prev };
        delete next[unitId];
        return next;
      });
      if (expandedUnit === unitId) setExpandedUnit(null);
    } catch {
      setError("No se pudo eliminar la unidad.");
    }
  };

  const handleToggleVisibility = async (e: React.MouseEvent, unit: Unit) => {
    e.stopPropagation();

    const next = unit.is_visible === false;
    try {
      const res = await fetch(`/api/subjects/${subjectId}/units/${unit.id}` as string, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: next }),
      });

      if (!res.ok) {
        setError("No se pudo actualizar la visibilidad de la unidad.");
        return;
      }

      setUnits((prev) => prev.map((u) => (u.id === unit.id ? { ...u, is_visible: next } : u)));
    } catch {
      setError("No se pudo actualizar la visibilidad de la unidad.");
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Calcular el siguiente unit_number automáticamente
      const nextUnitNumber = units.length > 0
        ? Math.max(...units.map(u => u.unit_number)) + 1
        : 1;
      const payload = {
        ...newUnit,
        unit_number: nextUnitNumber,
      };
      const response = await fetch(`/api/subjects/${subjectId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "No se pudo crear la unidad.");
      }

      setNewUnit({ title: "", description: "" });
      await fetchUnits();
      setShowAddUnit(false);
    } catch (err: any) {
      setError(err.message || "No se pudo crear la unidad.");
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una tarea (assignment)
  const handleDeleteAssignment = async (
    unitId: string,
    assignmentId: string
  ) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta tarea?")) return;
    const res = await fetch(
      `/api/units/${unitId}/sections?assignmentId=${assignmentId}`,
      {
        method: "DELETE",
      }
    );
    if (res.ok) {
      setSections((prev) => ({
        ...prev,
        [unitId]: prev[unitId].filter((section) => section.id !== assignmentId),
      }));
    } else {
      const data = await res.json();
      alert(data.error || "Error al eliminar la tarea");
    }
  };

  const handleAddSection = async (unitId: string) => {
    if (!newSection.title.trim()) return;
    
    // Si es un foro, redirigir a la creación de foro
    if (newSection.content_type === "forum") {
      // Redirigir a la página de foros con el unitId
      window.location.href = `/campus/teacher/subjects/${subjectId}/forums?unit_id=${unitId}&create=true&title=${encodeURIComponent(newSection.title)}`;
      return;
    }

    if ((newSection.content_type === "link" || newSection.content_type === "video") && !newSection.content.trim()) {
      setFileError("Debes ingresar un enlace (URL).");
      return;
    }

    if (newSection.content_type === "link" || newSection.content_type === "video") {
      try {
        new URL(newSection.content.trim());
      } catch {
        setFileError("El enlace (URL) no es válido.");
        return;
      }
    }

    if (newSection.content_type === "document" && !newSection.file) {
      setFileError("Debes seleccionar un archivo.");
      return;
    }
    setFileError(null);
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("title", newSection.title);
      formData.append("content_type", newSection.content_type);
      formData.append("content", newSection.content);
      if (newSection.file) formData.append("file", newSection.file);
      if (newSection.content_type === "assignment") {
        formData.append("due_date", newSection.due_date || "");
        formData.append("is_active", String(newSection.is_active));
      }

      const response = await fetch(`/api/units/${unitId}/sections`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.detalle
          ? `${errorData.error || "No se pudo agregar la sección."} (${errorData.detalle})`
          : errorData.error || "No se pudo agregar la sección.";
        throw new Error(msg);
      }

      setNewSection({
        title: "",
        content_type: "document",
        content: "",
        file: null,
        due_date: "",
        is_active: true,
      });
      await fetchUnits();
      setShowAddSection(null);
    } catch (err: any) {
      setError(err.message || "No se pudo agregar la sección.");
    } finally {
      setLoading(false);
    }
  };

  // const getSectionIcon = (section: Section) => {
  //   switch (section.content_type) {
  //     case "document":
  //       return "📄";
  //     case "assignment":
  //       return "📝";
  //     default:
  //       return "📖";
  //   }
  // };

  const getSectionTypeLabel = (section: Section) => {
    switch (section.content_type) {
      case "document":
        return "Contenido / Documento";
      case "assignment":
        return "Tarea";
      case "forum":
        return "Foro de Discusión";
      default:
        return "Contenido";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="text-gray-500">Cargando unidades...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-center">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {units.length === 0 && (
          <div className="text-center py-10 text-slate-500 bg-white rounded-2xl border border-slate-200">
            <div className="mx-auto w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-slate-600" />
            </div>
            <p className="font-medium">No hay unidades disponibles aún.</p>
          </div>
        )}

        {units.map((unit) => (
          <div
            key={unit.id}
            className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
              expandedUnit === unit.id
                ? "shadow-lg border-indigo-200 ring-1 ring-indigo-50"
                : unit.is_visible === false
                  ? "shadow-sm border-dashed border-slate-300 opacity-90"
                  : "shadow-sm border-slate-200 hover:border-slate-300"
            }`}
          >
            <div
              className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-slate-50/80 transition-colors group cursor-pointer"
              onClick={() => handleExpand(unit.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleExpand(unit.id);
                }
              }}
              aria-expanded={expandedUnit === unit.id}
              aria-controls={`unit-panel-${unit.id}`}
              id={`unit-header-${unit.id}`}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    expandedUnit === unit.id
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  }`}
                >
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold transition-colors ${
                      expandedUnit === unit.id ? "text-indigo-900" : "text-slate-700"
                    }`}
                  >
                    {unit.title}
                    {unit.is_visible === false ? (
                      <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide">
                        Oculto
                      </span>
                    ) : null}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">
                    {unit.description || `Unidad ${unit.unit_number}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleToggleVisibility(e, unit)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title={unit.is_visible === false ? "Hacer visible" : "Ocultar a alumnos"}
                >
                  {unit.is_visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingUnit(unit);
                  }}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Editar unidad"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDeleteUnit(e, unit.id)}
                  className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar unidad"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div
                  className={`transform transition-transform duration-300 p-1 rounded-full ${
                    expandedUnit === unit.id
                      ? "rotate-180 bg-indigo-50 text-indigo-600"
                      : "text-slate-400"
                  }`}
                >
                  <ChevronDown className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div
              className={`accordion-content ${
                expandedUnit === unit.id
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              } transition-all duration-300 overflow-hidden`}
            >
              <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                {Array.isArray(sections[unit.id]) && sections[unit.id].length > 0 ? (
                  sections[unit.id].map((section) => (
                    <div
                      key={section.id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100/50 transition-all duration-200 group/item"
                    >
                      <div className="flex items-center gap-4 mb-3 md:mb-0 w-full md:w-auto">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 group-hover/item:bg-indigo-50 group-hover/item:border-indigo-100 transition-colors">
                          {section.content_type === "assignment" ? (
                            <ListChecks className="w-5 h-5 text-amber-600" />
                          ) : section.content_type === "forum" ? (
                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 group-hover/item:text-indigo-700 transition-colors truncate">
                            {section.title}
                          </p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                            {getSectionTypeLabel(section).toUpperCase()}
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            {section.content_type === "assignment" && section.due_date
                              ? `Entrega: ${new Date(section.due_date).toLocaleDateString("es-AR")}`
                              : section.content_type === "forum"
                                ? `${section.questions_count || 0} ${section.questions_count === 1 ? "pregunta" : "preguntas"}`
                                : section.file_name
                                  ? section.file_name
                                  : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end pl-[52px] md:pl-0">
                        {section.content_type === "assignment" ? (
                          <span className={`flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${section.is_active ? "text-emerald-700 bg-emerald-100 border-emerald-200" : "text-slate-600 bg-slate-100 border-slate-200"}`}>
                            {section.is_active ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1.5" />
                                Activa
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 mr-1.5" />
                                Inactiva
                              </>
                            )}
                          </span>
                        ) : null}

                        {section.content_type === "forum" ? (
                          <button
                            type="button"
                            onClick={() => (window.location.href = `/campus/teacher/subjects/${subjectId}/forums/${section.forum_id}`)}
                            className="text-slate-400 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all text-sm font-semibold"
                          >
                            Ver foro
                          </button>
                        ) : null}

                        {section.content_type === "assignment" ? (
                          <button
                            type="button"
                            onClick={() => (window.location.href = `/campus/teacher/subjects/${subjectId}/assignments/${section.assignment_id}/submissions`)}
                            className="text-slate-400 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all text-sm font-semibold"
                          >
                            Ver entregas
                          </button>
                        ) : null}

                        {section.file_url ? (
                          <a
                            className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-all"
                            title="Descargar / Ver"
                            href={`/api/files/download?url=${encodeURIComponent(section.file_url)}${section.file_name ? `&name=${encodeURIComponent(section.file_name)}` : ""}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        ) : null}

                        {section.content_type !== "forum" && section.content_type !== "assignment" ? (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingContent({
                                unitId: unit.id,
                                contentId: section.id,
                                title: section.title,
                                content: section.content || "",
                              })
                            }
                            className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-all"
                            title="Editar"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() =>
                            section.content_type === "forum"
                              ? handleDeleteForum(unit.id, String(section.forum_id || section.id))
                              : section.content_type === "assignment"
                                ? handleDeleteAssignment(unit.id, section.id)
                                : handleDeleteContent(unit.id, section.id)
                          }
                          className="text-slate-400 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 py-6">No hay secciones en esta unidad.</div>
                )}

                <button
                  onClick={() => setShowAddSection(unit.id)}
                  className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-200 flex items-center justify-center gap-2 text-slate-600 font-semibold"
                  type="button"
                >
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Agregar sección
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Agregar Unidad */}
      {showAddUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Nueva Unidad</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newUnit.title}
                onChange={(e) => setNewUnit({ ...newUnit, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Título de la unidad"
              />
              <textarea
                value={newUnit.description}
                onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
                placeholder="Descripción de la unidad"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddUnit(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleAddUnit} className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg hover:shadow-lg transition-colors font-semibold">Crear Unidad</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Sección */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Nueva Sección</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newSection.title}
                onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Título de la sección"
              />
              <select
                value={newSection.content_type}
                onChange={(e) => {
                  const next = e.target.value;
                  setNewSection({
                    ...newSection,
                    content_type: next,
                    file: null,
                    content: next === "link" || next === "video" ? "" : newSection.content,
                  });
                  setFileError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="document">Documento / Archivo</option>
                <option value="link">Enlace</option>
                <option value="video">Video</option>
                <option value="assignment">Tarea</option>
                <option value="forum">Foro de Discusión</option>
              </select>

              {newSection.content_type === "link" || newSection.content_type === "video" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enlace (URL)</label>
                  <input
                    type="url"
                    value={newSection.content}
                    onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder={newSection.content_type === "video" ? "https://... (YouTube, Drive, etc.)" : "https://..."}
                    required
                  />
                  {fileError && <div className="text-red-500 text-xs mt-1">{fileError}</div>}
                </div>
              ) : (
                <textarea
                  value={newSection.content}
                  onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
                  placeholder={
                    newSection.content_type === "document"
                      ? "Descripción del documento que estás subiendo..."
                      : newSection.content_type === "assignment"
                      ? "Instrucciones detalladas de la tarea..."
                      : newSection.content_type === "forum"
                      ? "Descripción del foro (opcional)..."
                      : "Descripción"
                  }
                />
              )}
              {/* Campos extra solo para tareas */}
              {newSection.content_type === "assignment" && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">Fecha de entrega</label>
                  <input
                    type="datetime-local"
                    value={newSection.due_date}
                    onChange={(e) => setNewSection({ ...newSection, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">Estado</label>
                  <select
                    value={newSection.is_active ? "true" : "false"}
                    onChange={(e) => setNewSection({ ...newSection, is_active: e.target.value === "true" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="true">Activa</option>
                    <option value="false">Inactiva</option>
                  </select>
                </>
              )}
              {/* Archivos */}
              {newSection.content_type === "forum" ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💬 Se creará un foro de discusión donde los estudiantes podrán hacer preguntas públicas visibles para todo el curso.
                  </p>
                </div>
              ) : newSection.content_type === "document" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Archivo del Documento</label>
                  <input
                    type="file"
                    onChange={(e) => setNewSection({ ...newSection, file: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                    accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                    required
                  />
                  {fileError && <div className="text-red-500 text-xs mt-1">{fileError}</div>}
                </div>
              ) : newSection.content_type === "link" || newSection.content_type === "video" ? null : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Archivo (Opcional)</label>
                  <input
                    type="file"
                    onChange={(e) => setNewSection({ ...newSection, file: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddSection(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={() => showAddSection && handleAddSection(showAddSection)} className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg hover:shadow-lg transition-colors font-semibold">Agregar Sección</button>
            </div>
          </div>
        </div>
      )}

      {editingContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Editar contenido</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={editingContent.title}
                onChange={(e) =>
                  setEditingContent((prev) =>
                    prev ? { ...prev, title: e.target.value } : prev
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Título"
              />
              <textarea
                value={editingContent.content}
                onChange={(e) =>
                  setEditingContent((prev) =>
                    prev ? { ...prev, content: e.target.value } : prev
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 h-24"
                placeholder="Descripción / contenido"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditingContent(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditedContent}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg hover:shadow-lg transition-colors font-semibold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Editar unidad</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">N°</label>
                  <input
                    type="number"
                    min={1}
                    value={editingUnit.unit_number}
                    onChange={(e) =>
                      setEditingUnit((prev) =>
                        prev
                          ? { ...prev, unit_number: Number(e.target.value || 1) }
                          : prev
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Título</label>
                  <input
                    type="text"
                    value={editingUnit.title}
                    onChange={(e) =>
                      setEditingUnit((prev) => (prev ? { ...prev, title: e.target.value } : prev))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
                <textarea
                  value={editingUnit.description || ""}
                  onChange={(e) =>
                    setEditingUnit((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 h-24"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditingUnit(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditedUnit}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg hover:shadow-lg transition-colors font-semibold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitAccordionTeacher;
