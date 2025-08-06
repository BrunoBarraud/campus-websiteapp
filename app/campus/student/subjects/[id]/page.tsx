"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import LoadingSpinner from "../../../../../components/ui/LoadingSpinner";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  year: number;
  division?: string;
  image_url: string | null;
}

interface Unit {
  id: string;
  unit_number: number;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
}

interface Content {
  id: string;
  title: string;
  content_type: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  created_by: string;
  creator_name?: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  created_at: string;
  created_by: string;
  creator_name?: string;
}

interface Document {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  unit_id: string | null;
  created_at: string;
  uploader: {
    name: string;
    email: string;
  };
}

export default function StudentSubjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [contents, setContents] = useState<Content[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"units" | "documents">("units");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.role !== "student") {
      router.push("/campus/login");
      return;
    }

    fetchData();
  }, [session, status, subjectId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      await fetchSubject();
      await fetchUnits();
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubject = async () => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar la materia");
      }

      setSubject(data);
    } catch (err: any) {
      console.error("Error fetching subject:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/units`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar las unidades");
      }

      setUnits(data);
      if (data.length > 0 && !selectedUnitId) {
        setSelectedUnitId(data[0].id);
        fetchContentsAndAssignments(data[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching units:", err);
    }
  };

  // Consulta adicional para obtener el nombre del creador
  const fetchCreatorName = async (creatorId: string) => {
    if (!creatorId) return "";
    try {
      const response = await fetch(`/api/users/${creatorId}`);
      const data = await response.json();
      return data?.name || "";
    } catch {
      return "";
    }
  };

  // Trae contenidos y tareas juntos y agrega el nombre del creador
  const fetchContentsAndAssignments = async (unitId: string) => {
    try {
      const response = await fetch(
        `/api/student/units/${unitId}/contents?subjectId=${subjectId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar los contenidos");
      }

      // Obtener nombres de creadores para contenidos
      const contentsWithNames = await Promise.all(
        (data.contents || []).map(async (content: Content) => ({
          ...content,
          creator_name: await fetchCreatorName(content.created_by),
        }))
      );

      // Obtener nombres de creadores para tareas
      const assignmentsWithNames = await Promise.all(
        (data.assignments || []).map(async (assignment: Assignment) => ({
          ...assignment,
          creator_name: await fetchCreatorName(assignment.created_by),
        }))
      );

      setContents(contentsWithNames);
      setAssignments(assignmentsWithNames);
    } catch (err: any) {
      console.error("Error fetching contents and assignments:", err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/documents`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar los documentos");
      }

      setDocuments(data);
    } catch (err: any) {
      console.error("Error fetching documents:", err);
    }
  };

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnitId(unitId);
    fetchContentsAndAssignments(unitId);
  };

  const handleDownload = (document: Document) => {
    window.open(document.file_url, "_blank");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Cargando contenido..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border-2 border-red-100 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Volver
            </button>
            <button
              onClick={fetchData}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => router.push("/campus/dashboard")}
              className="hover:text-blue-600 transition-colors"
            >
              Dashboard
            </button>
            <i className="fas fa-chevron-right text-xs"></i>
            <button
              onClick={() => router.push("/campus/student/subjects")}
              className="hover:text-blue-600 transition-colors"
            >
              Mis Materias
            </button>
            <i className="fas fa-chevron-right text-xs"></i>
            <span className="text-gray-800 font-medium">
              {subject?.name || "Materia"}
            </span>
          </div>
        </nav>

        {/* Subject Info Card */}
        {subject && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border-2 border-blue-100 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {subject.image_url ? (
                  <img
                    src={subject.image_url}
                    alt={subject.name}
                    className="w-16 h-16 rounded-lg object-cover border-2 border-blue-200"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-book text-blue-600 text-xl"></i>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-800">
                      {subject.name}
                    </h1>
                    <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {subject.code}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{subject.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      <i className="fas fa-graduation-cap mr-1"></i>
                      {subject.year}° Año
                      {subject.division ? ` "${subject.division}"` : ""}
                    </span>
                    <span>
                      <i className="fas fa-book mr-1"></i>
                      {subject.code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    router.push(
                      `/campus/student/subjects/${subjectId}/assignments`
                    )
                  }
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <i className="fas fa-tasks mr-1"></i>
                  Mis Tareas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-2 border-blue-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("units")}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === "units"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Unidades y Contenidos
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === "documents"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Materiales
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === "units" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Unidades (Left Panel) */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Unidades
                  </h3>

                  <div className="space-y-2">
                    {units.map((unit) => (
                      <div
                        key={unit.id}
                        onClick={() => handleUnitSelect(unit.id)}
                        className={`p-4 rounded-lg cursor-pointer border transition-all duration-200 ${
                          selectedUnitId === unit.id
                            ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-md"
                            : "bg-white/50 border-gray-200 hover:bg-white/70 hover:shadow-sm"
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          Unidad {unit.unit_number}: {unit.title}
                        </div>
                        {unit.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {unit.description}
                          </div>
                        )}
                      </div>
                    ))}

                    {units.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <i className="fas fa-book-open text-2xl mb-2"></i>
                        <p>No hay unidades disponibles aún.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenidos y Tareas (Right Panel) */}
                <div className="lg:col-span-2">
                  {selectedUnitId ? (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Contenidos
                      </h3>

                      <div className="space-y-4">
                        {contents.map((content) => (
                          <div
                            key={content.id}
                            className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">
                                  {getContentTypeIcon(content.content_type)}
                                </span>
                                <h4 className="font-medium text-gray-900">
                                  {content.title}
                                </h4>
                              </div>
                              <div className="flex items-center space-x-2">
                                {content.is_pinned && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                    📌 Fijado
                                  </span>
                                )}
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full capitalize">
                                  {content.content_type}
                                </span>
                              </div>
                            </div>

                            <div className="text-gray-700 mb-3 whitespace-pre-wrap">
                              {content.content}
                            </div>

                            {content.content_type === "link" && (
                              <div className="mb-3">
                                <a
                                  href={content.content}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  🔗 Abrir enlace
                                  <svg
                                    className="w-4 h-4 ml-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                </a>
                              </div>
                            )}

                            <div className="text-sm text-gray-500">
                              Por {content.creator_name || "Desconocido"} •{" "}
                              {new Date(
                                content.created_at
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        ))}

                        {contents.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <i className="fas fa-file-alt text-2xl mb-2"></i>
                            <p>No hay contenidos disponibles en esta unidad.</p>
                          </div>
                        )}

                        {/* Tareas de la unidad */}
                        <h4 className="text-md font-semibold text-gray-900 mt-8 mb-2">
                          Tareas de la unidad
                        </h4>
                        {assignments.length > 0 ? (
                          assignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-2"
                            >
                              <div className="font-medium text-gray-900">
                                {assignment.title}
                              </div>
                              <div className="text-sm text-gray-600">
                                {assignment.description}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Fecha entrega:{" "}
                                {assignment.due_date
                                  ? new Date(
                                      assignment.due_date
                                    ).toLocaleDateString()
                                  : "Sin fecha"}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Por {assignment.creator_name || "Desconocido"}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 text-sm">
                            No hay tareas en esta unidad.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-hand-pointer text-2xl mb-2"></i>
                      <p>Selecciona una unidad para ver sus contenidos.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Materiales de Estudio
                </h3>

                <div className="grid gap-4">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {document.title}
                          </h4>
                          {document.description && (
                            <p className="text-gray-600 text-sm mb-2">
                              {document.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>📄 {document.file_name}</span>
                            <span>📦 {formatFileSize(document.file_size)}</span>
                            <span>
                              📅{" "}
                              {new Date(
                                document.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Subido por: {document.uploader.name}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(document)}
                          className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
                        >
                          📥 Descargar
                        </button>
                      </div>
                    </div>
                  ))}

                  {documents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-folder-open text-2xl mb-2"></i>
                      <p>No hay materiales disponibles aún.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
