import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  assignment_id?: string; // ID real del assignment
  is_active?: boolean; // Estado activo de la tarea
  due_date?: string; // Fecha de vencimiento
  forum_id?: string; // ID del foro
  questions_count?: number; // Número de preguntas en el foro
  is_closed?: boolean; // Si el foro está cerrado
}

const UnitAccordionStudent: React.FC<UnitAccordionProps> = ({
  subjectId,
  subjectName,
}) => {
  const router = useRouter();
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
            // Cargar secciones regulares
            const secRes = await fetch(
              `/api/student/subjects/${subjectId}/units/${unit.id}/contents`
            );
            let secData = await secRes.json();
            if (secData && secData.sections) {
              secData = secData.sections;
            }
            if (!Array.isArray(secData)) secData = [];

            // Cargar foros de esta unidad
            try {
              console.log(`[Student] Cargando foros para unidad ${unit.id}...`);
              const forumsRes = await fetch(`/api/forums?unit_id=${unit.id}`);
              console.log(`[Student] Respuesta de foros:`, forumsRes.status);
              
              if (forumsRes.ok) {
                const forumsData = await forumsRes.json();
                console.log(`[Student] Foros recibidos para unidad ${unit.id}:`, forumsData);
                
                if (Array.isArray(forumsData) && forumsData.length > 0) {
                  const forumSections = forumsData.map((forum: any) => ({
                    id: `forum-${forum.id}`,
                    forum_id: forum.id,
                    title: forum.title,
                    content_type: 'forum',
                    content: forum.description || '',
                    created_at: forum.created_at,
                    creator_name: forum.creator?.name || 'Profesor',
                    questions_count: forum.questions_count || 0,
                    is_closed: forum.is_locked || false
                  }));
                  console.log(`[Student] Agregando ${forumSections.length} foros a la unidad`);
                  secData = [...secData, ...forumSections];
                } else {
                  console.log(`[Student] No hay foros para la unidad ${unit.id}`);
                }
              } else {
                const errorText = await forumsRes.text();
                console.error(`[Student] Error al cargar foros (${forumsRes.status}):`, errorText);
              }
            } catch (forumError) {
              console.error('[Student] Error cargando foros para unidad:', unit.id, forumError);
            }

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
      case "forum":
        return "💬";
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
      case "forum":
        return "Foro";
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
      <div className="bg-white rounded-xl shadow-soft p-6 mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-pink-500 gradient-text">
              {subjectName}
            </h1>
            <p className="text-gray-600 mt-2">
              Unidades y contenidos de la materia
            </p>
          </div>
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
            className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-100 hover:border-yellow-200 transition-colors duration-200"
          >
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
                  <span className="bg-yellow-100 text-yellow-800 rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    {unit.unit_number}
                  </span>
                  <span>{unit.title}</span>
                </div>
                {unit.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {unit.description}
                  </div>
                )}
              </div>
              <i
                className={`fas fa-chevron-down text-gray-400 transition-transform duration-200 ${
                  expandedUnit === unit.id ? "transform rotate-180" : ""
                }`}
              ></i>
            </button>
            <div
              className={`accordion-content ${
                expandedUnit === unit.id
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              } transition-all duration-300 overflow-hidden`}
            >
              <div className="px-6 pb-6 space-y-4">
                {Array.isArray(sections[unit.id]) &&
                sections[unit.id].length > 0 ? (
                  sections[unit.id]
                    .filter(
                      (section) =>
                        section.content_type !== "assignment" ||
                        (section.is_active && (!section.due_date || new Date(section.due_date) >= new Date()))
                    )
                    .map((section) => (
                      <div
                        key={section.id}
                        className="bg-yellow-50 border border-yellow-100 rounded-lg p-5 fade-in"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="bg-yellow-100 text-yellow-800 rounded-full w-8 h-8 flex items-center justify-center">
                              {getSectionIcon(section)}
                            </span>
                            <span className="font-medium text-gray-900">
                              {section.title}
                            </span>
                            <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                              {getSectionTypeLabel(section)}
                            </span>
                          </div>
                          {section.content_type === "assignment" && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/campus/student/subjects/${subjectId}/assignments`
                                )
                              }
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 text-xs font-medium flex items-center gap-1"
                            >
                              📝 Realizar Entrega
                            </button>
                          )}
                          {section.content_type === "forum" && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/campus/student/subjects/${subjectId}/forums/${section.forum_id}`
                                )
                              }
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 text-xs font-medium flex items-center gap-1"
                            >
                              💬 Ver Foro
                            </button>
                          )}
                        </div>
                        <div className="text-gray-700 mb-3 pl-11 whitespace-pre-wrap">
                          {section.content}
                        </div>
                        {section.file_url && section.file_name && (
                          <div className="pl-11 mb-3">
                            <a
                              href={section.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                              download
                            >
                              📄 Descargar {section.file_name}
                            </a>
                          </div>
                        )}
                        {section.content_type === "link" && (
                          <div className="pl-11 mb-3">
                            <a
                              href={section.content}
                              target="_blank"
                              className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                            >
                              🔗 Abrir enlace
                            </a>
                          </div>
                        )}
                        {section.content_type === "forum" && (
                          <div className="pl-11 mb-2">
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <span className="font-medium">{section.questions_count || 0}</span>
                                {section.questions_count === 1 ? 'pregunta' : 'preguntas'}
                              </span>
                              {section.is_closed && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                  🔒 Cerrado
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 pl-11">
                          Por {section.creator_name || "Desconocido"} •{" "}
                          {new Date(section.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    No hay secciones en esta unidad.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnitAccordionStudent;
