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
}

const UnitAccordionStudent: React.FC<UnitAccordionProps> = ({
  subjectId,
  subjectName,
}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnits();
  }, [subjectId]);

  const fetchUnits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/student/subjects/${subjectId}/units`);
      let data = await res.json();
      if (!Array.isArray(data)) data = [];
      data.sort((a: Unit, b: Unit) => a.order_index - b.order_index);
      setUnits(data);

      const sectionsArr = await Promise.all(
        data.map(async (unit: Unit) => {
          try {
            const secRes = await fetch(
              `/api/student/subjects/${subjectId}/units/${unit.id}/contents`
            );
            let secData = await secRes.json();
            if (secData && secData.sections) {
              secData = secData.sections;
            }
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
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-rose-600 bg-clip-text text-transparent">
            {subjectName}
          </h1>
          <p className="text-gray-600 mt-1">
            Unidades y contenidos de la materia
          </p>
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
              <span className="text-xl">
                {expandedUnit === unit.id ? "▲" : "▼"}
              </span>
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
                    sections[unit.id].map((section) => (
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
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnitAccordionStudent;
