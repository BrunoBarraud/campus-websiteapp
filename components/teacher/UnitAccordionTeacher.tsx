import React, { useState, useEffect } from "react";

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
}

const UnitAccordionTeacher: React.FC<UnitAccordionProps> = ({
  subjectId,
  subjectName,
}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAddSection, setShowAddSection] = useState<string | null>(null);
  const [newUnit, setNewUnit] = useState({ title: "", description: "" });
  const [newSection, setNewSection] = useState({
    title: "",
    content_type: "content",
    content: "",
    file: null as File | null,
    due_date: "",
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnits();
  }, [subjectId]);

  const fetchUnits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/units`);
      let data = await res.json();
      if (!Array.isArray(data)) data = [];
      data.sort((a: Unit, b: Unit) => a.order_index - b.order_index);
      setUnits(data);

      const sectionsArr = await Promise.all(
        data.map(async (unit: Unit) => {
          try {
            const secRes = await fetch(`/api/units/${unit.id}/sections`);
            let secData = await secRes.json();
            if (!Array.isArray(secData)) secData = [];
            return [unit.id, secData] as [string, Section[]];
          } catch {
            return [unit.id, []] as [string, Section[]];
          }
        })
      );
      const sectionsObj: Record<string, Section[]> =
        Object.fromEntries(sectionsArr);
      setSections(sectionsObj);
    } catch {
      setError("Error al cargar unidades o secciones.");
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = (unitId: string) => {
    setExpandedUnit(expandedUnit === unitId ? null : unitId);
  };

  const handleAddUnit = async () => {
    if (!newUnit.title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/subjects/${subjectId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUnit),
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
        const errorData = await response.json();
        throw new Error(errorData.error || "No se pudo agregar la sección.");
      }

      setNewSection({
        title: "",
        content_type: "content",
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

  const getSectionIcon = (section: Section) => {
    switch (section.content_type) {
      case "video":
        return "🎥";
      case "document":
        return "📄";
      case "link":
        return "🔗";
      case "assignment":
        return "📝";
      default:
        return "📖";
    }
  };

  const getSectionTypeLabel = (section: Section) => {
    switch (section.content_type) {
      case "video":
        return "Video";
      case "document":
        return "Documento";
      case "link":
        return "Enlace";
      case "assignment":
        return "Tarea";
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
    <div className="space-y-4">
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-center">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border-2 border-yellow-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-rose-600 bg-clip-text text-transparent">
              {subjectName}
            </h1>
            <p className="text-gray-600 mt-1">
              Unidades y contenidos de la materia
            </p>
          </div>
          <button
            onClick={() => setShowAddUnit(true)}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            <span className="font-bold text-lg">+</span>
            Nueva Unidad
          </button>
        </div>
      </div>

      {/* Unidades */}
      <div className="space-y-3">
        {units.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-book-open text-2xl mb-2"></i>
            <p>No hay unidades disponibles aún.</p>
          </div>
        )}
        {units.map((unit) => (
          <div
            key={unit.id}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow border-2 border-yellow-100"
          >
            <button
              className="w-full flex justify-between items-center px-6 py-4 focus:outline-none"
              onClick={() => handleExpand(unit.id)}
              aria-expanded={expandedUnit === unit.id}
              aria-controls={`unit-panel-${unit.id}`}
              id={`unit-header-${unit.id}`}
              role="button"
            >
              <div>
                <div className="font-bold text-gray-800">
                  Unidad {unit.unit_number}: {unit.title}
                </div>
                {unit.description && (
                  <div className="text-sm text-gray-600">
                    {unit.description}
                  </div>
                )}
              </div>
              <span className="text-xl">{expandedUnit === unit.id}</span>
            </button>
            {expandedUnit === unit.id && (
              <div
                className="px-6 pb-4"
                id={`unit-panel-${unit.id}`}
                role="region"
                aria-labelledby={`unit-header-${unit.id}`}
              >
                <div className="space-y-3">
                  {Array.isArray(sections[unit.id]) &&
                    sections[unit.id].map((section) => {
                      // LOG PARA DEPURAR
                      console.log("Section render:", section);
                      return (
                        <div
                          key={section.id}
                          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {getSectionIcon(section)}
                            </span>
                            <span className="font-medium text-gray-900">
                              {section.title}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full capitalize">
                              {getSectionTypeLabel(section)}
                            </span>
                            {/* Botón eliminar y ver entregas solo para tareas */}
                            {section.content_type === "assignment" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleDeleteAssignment(unit.id, section.id)
                                  }
                                  className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs"
                                >
                                  Eliminar tarea
                                </button>
                                <button
                                  onClick={() =>
                                    (window.location.href = `/campus/teacher/subjects/${subjectId}/assignments/${section.assignment_id}/submissions`)
                                  }
                                  className="ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                >
                                  Ver entregas
                                </button>
                              </>
                            )}
                          </div>
                          <div className="text-gray-700 mb-2 whitespace-pre-wrap">
                            {section.content}
                          </div>
                          {section.content_type === "link" && (
                            <a
                              href={section.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                            >
                              🔗 Abrir enlace
                            </a>
                          )}
                          {/* Mostrar botón de descarga si hay archivo */}
                          {section.file_url && section.file_name && (
                            <a
                              href={section.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                              download
                            >
                              📄 Descargar {section.file_name}
                            </a>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Por {section.creator_name || "Desconocido"} •{" "}
                            {new Date(section.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  <button
                    onClick={() => setShowAddSection(unit.id)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50/50 transition-all duration-200 flex items-center justify-center gap-2 text-gray-600"
                  >
                    <span className="font-bold text-lg">+</span>
                    Agregar Sección
                  </button>
                </div>
              </div>
            )}
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
                onChange={(e) =>
                  setNewUnit({ ...newUnit, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Título de la unidad"
              />
              <textarea
                value={newUnit.description}
                onChange={(e) =>
                  setNewUnit({ ...newUnit, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
                placeholder="Descripción de la unidad"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddUnit(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddUnit}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg"
              >
                Crear Unidad
              </button>
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
                onChange={(e) =>
                  setNewSection({ ...newSection, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Título de la sección"
              />
              <select
                value={newSection.content_type}
                onChange={(e) =>
                  setNewSection({
                    ...newSection,
                    content_type: e.target.value,
                    file: null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="content">Contenido</option>
                <option value="document">Documento</option>
                <option value="assignment">Tarea</option>
              </select>
              <textarea
                value={newSection.content}
                onChange={(e) =>
                  setNewSection({ ...newSection, content: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
                placeholder={
                  newSection.content_type === "document"
                    ? "Descripción del documento que estás subiendo..."
                    : newSection.content_type === "assignment"
                    ? "Instrucciones detalladas de la tarea..."
                    : "Descripción del contenido..."
                }
              />
              {/* Campos extra solo para tareas */}
              {newSection.content_type === "assignment" && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                    Fecha de entrega
                  </label>
                  <input
                    type="datetime-local"
                    value={newSection.due_date}
                    onChange={(e) =>
                      setNewSection({ ...newSection, due_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                    Estado
                  </label>
                  <select
                    value={newSection.is_active ? "true" : "false"}
                    onChange={(e) =>
                      setNewSection({
                        ...newSection,
                        is_active: e.target.value === "true",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="true">Activa</option>
                    <option value="false">Inactiva</option>
                  </select>
                </>
              )}
              {/* Archivos */}
              {newSection.content_type === "document" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Archivo del Documento
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setNewSection({
                        ...newSection,
                        file: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                    accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                    required
                  />
                  {fileError && (
                    <div className="text-red-500 text-xs mt-1">{fileError}</div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Archivo (Opcional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setNewSection({
                        ...newSection,
                        file: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddSection(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  showAddSection && handleAddSection(showAddSection)
                }
                className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg"
              >
                Agregar Sección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitAccordionTeacher;
