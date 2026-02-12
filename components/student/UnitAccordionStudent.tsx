import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Download,
  FileText,
  Link as LinkIcon,
  MessageSquare,
  Video,
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
  subjectName: _subjectName,
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
        return <Video className="w-5 h-5 text-blue-500" />;
      case "document":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "link":
        return <LinkIcon className="w-5 h-5 text-purple-500" />;
      case "assignment":
        return <BookOpen className="w-5 h-5 text-emerald-600" />;
      case "forum":
        return <MessageSquare className="w-5 h-5 text-indigo-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
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
      <div className="flex justify-center items-center py-6 sm:py-12">
        <span className="text-gray-500">Cargando unidades...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 pb-24 lg:pb-0">
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-center">
          {error}
        </div>
      )}

      {/* Unidades */}
      <div className="space-y-4 sm:space-y-6">
        {units.length === 0 && (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            <i className="fas fa-book-open text-2xl sm:text-3xl mb-2"></i>
            <p className="text-sm sm:text-base">No hay unidades disponibles aún.</p>
          </div>
        )}
        {units.map((unit) => (
          <div
            key={unit.id}
            className={`bg-white rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden ${
              expandedUnit === unit.id
                ? "shadow-lg border-indigo-200 ring-1 ring-indigo-50"
                : "shadow-sm border-slate-200 hover:border-slate-300"
            }`}
          >
            <button
              className="w-full flex items-center justify-between p-4 sm:p-6 text-left bg-white hover:bg-slate-50/80 transition-colors group"
              onClick={() => handleExpand(unit.id)}
              aria-expanded={expandedUnit === unit.id}
              aria-controls={`unit-panel-${unit.id}`}
              id={`unit-header-${unit.id}`}
              role="button"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    expandedUnit === unit.id
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  }`}
                >
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-base sm:text-lg font-bold transition-colors ${
                      expandedUnit === unit.id ? "text-indigo-900" : "text-slate-700"
                    }`}
                  >
                    {unit.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                    {unit.description || `Unidad ${unit.unit_number}`}
                  </p>
                </div>
              </div>
              <div
                className={`transform transition-transform duration-300 p-1 rounded-full flex-shrink-0 ${
                  expandedUnit === unit.id
                    ? "rotate-180 bg-indigo-50 text-indigo-600"
                    : "text-slate-400"
                }`}
              >
                <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </button>
            <div
              className={`accordion-content ${
                expandedUnit === unit.id
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              } transition-all duration-300 overflow-hidden`}
            >
              <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6 space-y-4 sm:space-y-6">
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
                        className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100/50 transition-all duration-200 group/item"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 md:mb-0 w-full md:w-auto">
                          <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl border border-slate-100 group-hover/item:bg-indigo-50 group-hover/item:border-indigo-100 transition-colors flex-shrink-0">
                            {getSectionIcon(section)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-700 group-hover/item:text-indigo-700 transition-colors truncate text-sm sm:text-base">
                              {section.title}
                            </p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                              {getSectionTypeLabel(section).toUpperCase()}
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              {section.content_type === "assignment" && section.due_date
                                ? `Vence: ${new Date(section.due_date).toLocaleDateString("es-AR")}`
                                : section.content_type === "link"
                                  ? "Enlace externo"
                                  : section.file_name
                                    ? section.file_name
                                    : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pl-[52px] md:pl-0">
                          {section.content_type === "assignment" ? (
                            <span className="flex items-center text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                              {section.due_date && new Date(section.due_date) < new Date() ? (
                                <>
                                  <AlertCircle className="w-3 h-3 mr-1.5" />
                                  Vencida
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1.5" />
                                  Pendiente
                                </>
                              )}
                            </span>
                          ) : null}

                          {section.content_type === "forum" ? (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/campus/student/subjects/${subjectId}/forums/${section.forum_id}`
                                )
                              }
                              className="text-slate-400 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all text-sm font-semibold"
                            >
                              Ver foro
                            </button>
                          ) : null}

                          {section.content_type === "assignment" ? (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/campus/student/subjects/${subjectId}/assignments`
                                )
                              }
                              className="text-slate-400 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all text-sm font-semibold"
                            >
                              Ver tareas
                            </button>
                          ) : null}

                          {section.content_type === "link" ? (
                            <a
                              href={section.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all text-sm font-semibold"
                            >
                              Abrir
                            </a>
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
