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
  due_date?: string;
  is_active?: boolean;
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
    content_type: "document",
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

  // Agregar logs más detallados en el fetchUnits
  const fetchUnits = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Iniciando fetch de unidades para SubjectId:', subjectId);
      const res = await fetch(`/api/subjects/${subjectId}/units`);
      let rawData = await res.text();
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

  const handleExpand = (unitId: string) => {
    setExpandedUnit(expandedUnit === unitId ? null : unitId);
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
      // Si el tipo es 'content', enviarlo como 'document' para el backend
      formData.append("content_type", newSection.content_type === "content" ? "document" : newSection.content_type);
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

  const getSectionIcon = (section: Section) => {
    switch (section.content_type) {
      case "document":
        return "📄";
      case "assignment":
        return "📝";
      default:
        return "📖";
    }
  };

  const getSectionTypeLabel = (section: Section) => {
    switch (section.content_type) {
      case "document":
        return "Contenido / Documento";
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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Error message */}
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-center">
          {error} Por favor, verifica tu conexión o contacta al administrador.
        </div>
      )}

      {/* Header - matches beautiful HTML */}
      <div className="bg-white rounded-xl shadow-soft p-6 mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Contenido de la Materia
            </h1>
            <p className="text-gray-600 mt-2">
              Gestiona las unidades y contenidos de la materia
            </p>
          </div>
          <button
            onClick={() => setShowAddUnit(true)}
            className="px-5 py-3 bg-gradient-to-r from-yellow-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-medium"
          >
            <i className="fas fa-plus"></i>
            Nueva Unidad
          </button>
        </div>
      </div>

      {/* Units List */}
      <div className="space-y-4">
        {units.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500 mb-4">
              <i className="fas fa-book-open text-3xl"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">No hay unidades disponibles</h3>
            <p className="text-gray-500 mb-6">No se encontraron unidades para esta materia. Intenta agregar una nueva unidad.</p>
            <button onClick={() => setShowAddUnit(true)} className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-medium mx-auto">
              <i className="fas fa-plus"></i>
              Crear Primera Unidad
            </button>
          </div>
        )}
        {units.map((unit, idx) => (
          <div key={unit.id} className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-100 hover:border-yellow-200 transition-colors duration-200">
            <button
              className="unit-header w-full flex justify-between items-center px-6 py-5 focus:outline-none hover:bg-gray-50 transition-colors duration-150"
              onClick={() => handleExpand(unit.id)}
              aria-expanded={expandedUnit === unit.id}
              aria-controls={`unit-panel-${unit.id}`}
              id={`unit-header-${unit.id}`}
              role="button"
            >
              <div className="text-left">
                <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <span className="bg-yellow-100 text-yellow-800 rounded-full w-8 h-8 flex items-center justify-center text-sm">{unit.unit_number}</span>
                  <span>{unit.title}</span>
                </div>
                {unit.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {unit.description}
                  </div>
                )}
              </div>
              <i className={`fas fa-chevron-down text-gray-400 transition-transform duration-200 ${expandedUnit === unit.id ? 'transform rotate-180' : ''}`}></i>
            </button>
            <div className={`accordion-content ${expandedUnit === unit.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} transition-all duration-300 overflow-hidden`}>
              <div className="px-6 pb-6 space-y-4">
                {Array.isArray(sections[unit.id]) && sections[unit.id].length > 0 ? (
                  sections[unit.id].map((section) => (
                  <div key={section.id} className="bg-yellow-50 border border-yellow-100 rounded-lg p-5 fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-yellow-100 text-yellow-800 rounded-full w-8 h-8 flex items-center justify-center">
                          {/* Icon logic */}
                          {section.content_type === 'document' && <i className="fas fa-book-open"></i>}
                          {section.content_type === 'document' && <i className="fas fa-file-pdf"></i>}
                          {section.content_type === 'assignment' && <i className="fas fa-tasks"></i>}
                        </span>
                        <span className="font-medium text-gray-900">{section.title}</span>
                        <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                          {getSectionTypeLabel(section)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {/* Assignment buttons */}
                        {section.content_type === "assignment" && (
                          <>
                            <button
                              onClick={() => handleDeleteAssignment(unit.id, section.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 text-xs font-medium flex items-center gap-1"
                            >
                              <i className="fas fa-trash-alt text-xs"></i>
                              Eliminar
                            </button>
                            <button
                              onClick={() => (window.location.href = `/campus/teacher/subjects/${subjectId}/assignments/${section.assignment_id}/submissions`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 text-xs font-medium flex items-center gap-1"
                            >
                              <i className="fas fa-list-check mr-1"></i>
                              Ver entregas
                            </button>
                          </>
                        )}
                        {/* Delete for other types */}
                        {section.content_type !== "assignment" && (
                          <button
                            onClick={() => handleDeleteAssignment(unit.id, section.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 text-xs font-medium flex items-center gap-1"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-700 mb-3 pl-11 whitespace-pre-wrap">{section.content}</div>
                    {/* Download link for documents */}
                    {section.file_url && section.file_name && (
                      <div className="pl-11 mb-3">
                        <a href={section.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium" download>
                          <i className="fas fa-download mr-2"></i>
                          Descargar {section.file_name}
                        </a>
                      </div>
                    )}
                    {section.content_type === "assignment" && (
                      <div className="flex flex-wrap gap-2 pl-11 mb-3">
                        {section.due_date && (
                          <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                            <i className="fas fa-clock"></i> Entrega: {new Date(section.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className={`px-2.5 py-1 ${section.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} rounded-full text-xs font-medium`}>
                          <i className={`fas fa-${section.is_active ? 'check-circle' : 'times-circle'}`}></i> {section.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 pl-11">
                      <i className="fas fa-user-circle mr-1"></i> {section.creator_name || "Desconocido"} • {new Date(section.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-6">No hay secciones en esta unidad.</div>
                )}
                {/* Add Section Button */}
                <button onClick={() => setShowAddSection(unit.id)} className="add-section-btn w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50/30 transition-all duration-200 flex items-center justify-center gap-2 text-gray-600 font-medium">
                  <i className="fas fa-plus-circle text-yellow-500"></i>
                  Agregar Sección
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
              <button onClick={handleAddUnit} className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-pink-500 text-white rounded-lg hover:shadow-lg">Crear Unidad</button>
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
                onChange={(e) => setNewSection({ ...newSection, content_type: e.target.value, file: null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="document">Contenido</option>
                <option value="document">Documento</option>
                <option value="assignment">Tarea</option>
              </select>
              <textarea
                value={newSection.content}
                onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
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
              {newSection.content_type === "document" ? (
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
              ) : (
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
              <button onClick={() => showAddSection && handleAddSection(showAddSection)} className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-pink-500 text-white rounded-lg hover:shadow-lg">Agregar Sección</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitAccordionTeacher;
