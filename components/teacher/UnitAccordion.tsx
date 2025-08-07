// 🎯 Nuevo componente de Unidades Desplegables para Profesores
"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  FileTextIcon,
  ClipboardIcon,
  DownloadIcon,
} from "lucide-react";
import {
  extractOriginalContentType,
  getContentTypeLabel,
  hasAttachment,
} from "@/app/lib/utils/contentTypes";

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
  content_type: "document" | "assignment" | "content";
  content?: string;
  file_url?: string;
  file_name?: string;
  due_date?: string;
  is_active: boolean;
  created_at: string;
}

interface UnitAccordionProps {
  subjectId: string;
  subjectName: string;
}

const UnitAccordion: React.FC<UnitAccordionProps> = ({
  subjectId,
  subjectName,
}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [sections, setSections] = useState<{ [unitId: string]: Section[] }>({});
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAddSection, setShowAddSection] = useState<string | null>(null);

  // Estados para formularios
  const [newUnit, setNewUnit] = useState({
    unit_number: 1,
    title: "",
    description: "",
  });

  const [newSection, setNewSection] = useState({
    title: "",
    content_type: "content" as "document" | "assignment" | "content",
    content: "",
    due_date: "",
    file: null as File | null,
  });

  useEffect(() => {
    fetchUnits();
  }, [subjectId]);

  const fetchUnits = async () => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/units`);
      const data = await response.json();

      if (response.ok) {
        setUnits(data);
        // Cargar secciones para cada unidad
        data.forEach((unit: Unit) => {
          fetchSections(unit.id);
        });
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (unitId: string) => {
    try {
      const response = await fetch(
        `/api/subjects/${subjectId}/units/${unitId}/contents`
      );
      const data = await response.json();

      if (response.ok) {
        setSections((prev) => ({ ...prev, [unitId]: data }));
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
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

  const handleAddUnit = async () => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUnit),
      });

      if (response.ok) {
        setShowAddUnit(false);
        setNewUnit({
          unit_number: units.length + 1,
          title: "",
          description: "",
        });
        fetchUnits();
      }
    } catch (error) {
      console.error("Error adding unit:", error);
    }
  };

  const handleAddSection = async (unitId: string) => {
    try {
      // Validaciones
      if (!newSection.title.trim()) {
        alert("El título es requerido");
        return;
      }

      if (newSection.content_type === "document" && !newSection.file) {
        alert("Debe seleccionar un archivo para el documento");
        return;
      }

      if (newSection.content_type === "assignment" && !newSection.due_date) {
        alert("La fecha de entrega es requerida para las tareas");
        return;
      }

      const formData = new FormData();
      formData.append("title", newSection.title);
      formData.append("content_type", newSection.content_type);
      formData.append("content", newSection.content);

      if (newSection.content_type === "assignment" && newSection.due_date) {
        formData.append("due_date", newSection.due_date);
      }

      if (newSection.file) {
        formData.append("file", newSection.file);
      }

      const response = await fetch(
        `/api/subjects/${subjectId}/units/${unitId}/contents`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        setShowAddSection(null);
        setNewSection({
          title: "",
          content_type: "content",
          content: "",
          due_date: "",
          file: null,
        });
        fetchSections(unitId);

        // Mostrar mensaje de éxito
        if (newSection.content_type === "document") {
          alert("Documento subido exitosamente");
        }
      } else {
        const error = await response.text();
        alert(`Error al crear la sección: ${error}`);
      }
    } catch (error) {
      console.error("Error adding section:", error);
      alert("Error al crear la sección");
    }
  };

  const getSectionIcon = (section: Section) => {
    const { originalType } = extractOriginalContentType(section.content || "");

    switch (originalType) {
      case "document":
        return <FileTextIcon className="w-4 h-4 text-blue-500" />;
      case "assignment":
        return <ClipboardIcon className="w-4 h-4 text-red-500" />;
      case "content":
      default:
        return <FileTextIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSectionTypeLabel = (section: Section) => {
    return getContentTypeLabel(section.content || "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border-2 border-yellow-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-rose-600 bg-clip-text text-transparent">
              {subjectName}
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona las unidades y contenido de tu materia
            </p>
          </div>
          <button
            onClick={() => setShowAddUnit(true)}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva Unidad
          </button>
        </div>
      </div>

      {/* Unidades Desplegables */}
      <div className="space-y-3">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-2 border-yellow-100 overflow-hidden"
          >
            {/* Header de la Unidad */}
            <div
              className="p-4 cursor-pointer hover:bg-yellow-50/50 transition-colors duration-200"
              onClick={() => toggleUnit(unit.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedUnits.has(unit.id) ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="bg-gradient-to-r from-yellow-100 to-rose-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    Unidad {unit.unit_number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {unit.title}
                    </h3>
                    <p className="text-sm text-gray-600">{unit.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {sections[unit.id]?.length || 0} secciones
                  </span>
                </div>
              </div>
            </div>

            {/* Contenido Desplegable */}
            {expandedUnits.has(unit.id) && (
              <div className="border-t border-gray-100">
                {/* Secciones */}
                <div className="p-4 space-y-3">
                  {sections[unit.id]?.map((section) => (
                    <div
                      key={section.id}
                      className="bg-gray-50/50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getSectionIcon(section)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-800">
                                {section.title}
                              </h4>
                              {hasAttachment(
                                section.content || "",
                                section.file_url
                              ) && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                                  <i className="fas fa-paperclip"></i>
                                  {section.file_name || "Archivo"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                {getSectionTypeLabel(section)}
                              </span>
                              {section.due_date && (
                                <span className="text-xs text-red-500 flex items-center gap-1">
                                  <i className="fas fa-clock"></i>
                                  Vence:{" "}
                                  {new Date(
                                    section.due_date
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {/* BOTÓN DE DESCARGA MEJORADO */}
                            {section.file_url && (
                              <div className="flex items-center gap-2 mt-2">
                                <a
                                  href={section.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold shadow"
                                  title="Descargar archivo"
                                >
                                  <DownloadIcon className="w-5 h-5 mr-2" />
                                  {section.file_name || "Descargar archivo"}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {section.content && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2 bg-white p-2 rounded border-l-2 border-yellow-200">
                          {
                            extractOriginalContentType(section.content)
                              .cleanContent
                          }
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Botón Agregar Sección */}
                  <button
                    onClick={() => setShowAddSection(unit.id)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50/50 transition-all duration-200 flex items-center justify-center gap-2 text-gray-600"
                  >
                    <PlusIcon className="w-4 h-4" />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Unidad
                </label>
                <input
                  type="number"
                  value={newUnit.unit_number || ""}
                  onChange={(e) =>
                    setNewUnit({
                      ...newUnit,
                      unit_number: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={newUnit.title}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ej: Introducción a la Programación"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newUnit.description}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
                  placeholder="Descripción de la unidad..."
                />
              </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={newSection.title}
                  onChange={(e) =>
                    setNewSection({ ...newSection, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Título de la sección"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Contenido
                </label>
                <select
                  value={newSection.content_type}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setNewSection({
                      ...newSection,
                      content_type: newType,
                      // Limpiar archivo si se cambia de documento a otro tipo
                      file: newType === "document" ? newSection.file : null,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="content">📝 Contenido</option>
                  <option value="document">📄 Documento</option>
                  <option value="assignment">✅ Tarea</option>
                </select>
                {newSection.content_type === "document" && (
                  <p className="text-xs text-blue-600 mt-1">
                    <i className="fas fa-info-circle mr-1"></i>
                    Se requiere subir un archivo para este tipo de contenido
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {newSection.content_type === "document"
                    ? "Descripción del Documento"
                    : newSection.content_type === "assignment"
                    ? "Instrucciones de la Tarea"
                    : "Descripción"}
                </label>
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
              </div>
              {newSection.content_type === "assignment" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Entrega
                  </label>
                  <input
                    type="date"
                    value={newSection.due_date}
                    onChange={(e) =>
                      setNewSection({ ...newSection, due_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              )}

              {/* Campo de archivo - Obligatorio para documentos */}
              {newSection.content_type === "document" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Archivo del Documento{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
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
                    <p className="text-xs text-gray-500">
                      Formatos permitidos: PDF, Word, PowerPoint, Excel, TXT
                    </p>
                    {newSection.file && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                        <i className="fas fa-check-circle"></i>
                        <span>
                          Archivo seleccionado: {newSection.file.name}
                        </span>
                      </div>
                    )}
                  </div>
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
                  {newSection.file && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg mt-2">
                      <i className="fas fa-paperclip"></i>
                      <span>Archivo: {newSection.file.name}</span>
                    </div>
                  )}
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

export default UnitAccordion;
