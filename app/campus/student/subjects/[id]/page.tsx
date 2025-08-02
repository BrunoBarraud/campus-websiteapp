// 📚 Vista de Materia para Estudiantes
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  ExternalLinkIcon,
  DownloadIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  FolderIcon,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  year: number;
  image_url: string | null;
}

interface Unit {
  id: string;
  unit_number: number;
  title: string;
  description: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  contents: Content[];
  assignments: Assignment[];
}

interface Content {
  id: string;
  title: string;
  content_type: string;
  content: string;
  file_url?: string;
  file_name?: string;
  is_pinned: boolean;
  created_at: string;
  creator: {
    name: string;
    email: string;
  };
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
  has_submission: boolean;
  submission_status?: string;
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
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [documents, setDocuments] = useState<Document[]>([]);
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

  const toggleUnit = (unitId: string) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedUnits(newExpanded);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener información de la materia
      await fetchSubject();

      // Obtener unidades con contenido y tareas
      await fetchUnits();

      // Obtener documentos
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
      const response = await fetch(
        `/api/subjects/${subjectId}/units?include=contents,assignments`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar las unidades");
      }

      // Solo mostrar unidades activas a los estudiantes
      const activeUnits = data.filter((unit: Unit) => unit.is_active);
      setUnits(activeUnits);

      // Expandir la primera unidad por defecto
      if (activeUnits.length > 0) {
        setExpandedUnits(new Set([activeUnits[0].id]));
      }
    } catch (err: any) {
      console.error("Error fetching units:", err);
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

  const handleDownload = (document: Document) => {
    // Abrir el archivo en una nueva ventana/pestaña
    window.open(document.file_url, "_blank");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando contenido...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => router.back()}
              className="mt-4"
              variant="destructive"
            >
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a mis materias
          </Button>

          {subject && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {subject.name}
              </h1>
              <p className="text-gray-600">{subject.description}</p>
            </div>
          )}

          {/* Botón de navegación a tareas */}
          <div className="mb-4">
            <Button
              onClick={() =>
                router.push(`/campus/student/subjects/${subjectId}/assignments`)
              }
              className="flex items-center"
            >
              <BookOpenIcon className="h-4 w-4 mr-2" />
              Ver Mis Tareas
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex space-x-1">
              <Button
                variant={activeTab === "units" ? "default" : "ghost"}
                onClick={() => setActiveTab("units")}
                className="flex items-center"
              >
                <BookOpenIcon className="h-4 w-4 mr-2" />
                Unidades y Contenidos
              </Button>
              <Button
                variant={activeTab === "documents" ? "default" : "ghost"}
                onClick={() => setActiveTab("documents")}
                className="flex items-center"
              >
                <FolderIcon className="h-4 w-4 mr-2" />
                Materiales
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {activeTab === "units" && (
              <div className="space-y-4">
                {units.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <BookOpenIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">
                        No hay unidades disponibles aún.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  units.map((unit) => (
                    <Card key={unit.id} className="overflow-hidden">
                      <Collapsible
                        open={expandedUnits.has(unit.id)}
                        onOpenChange={() => toggleUnit(unit.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {expandedUnits.has(unit.id) ? (
                                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                                ) : (
                                  <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                                )}
                                <div>
                                  <CardTitle className="flex items-center gap-2">
                                    Unidad {unit.unit_number}: {unit.title}
                                  </CardTitle>
                                  <p className="text-sm text-gray-600">
                                    {unit.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">
                                  {unit.contents?.length || 0} contenidos
                                </Badge>
                                <Badge variant="outline">
                                  {unit.assignments?.length || 0} tareas
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            {/* Contents */}
                            {unit.contents && unit.contents.length > 0 && (
                              <div className="mb-6">
                                <h4 className="font-semibold text-gray-900 mb-3">
                                  Contenidos
                                </h4>
                                <div className="space-y-2">
                                  {unit.contents.map((content) => (
                                    <div
                                      key={content.id}
                                      className="flex items-start justify-between p-3 bg-blue-50 rounded-lg"
                                    >
                                      <div className="flex items-start space-x-3 flex-1">
                                        <FileTextIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <p className="font-medium text-gray-900">
                                              {content.title}
                                            </p>
                                            {content.is_pinned && (
                                              <Badge variant="secondary">
                                                Fijado
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
                                            {content.content}
                                          </p>
                                          {content.content_type === "link" && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                window.open(
                                                  content.content,
                                                  "_blank"
                                                )
                                              }
                                              className="mb-2"
                                            >
                                              <ExternalLinkIcon className="h-4 w-4 mr-2" />
                                              Abrir enlace
                                            </Button>
                                          )}
                                          <div className="text-xs text-gray-500">
                                            Por {content.creator.name} •{" "}
                                            {formatDate(content.created_at)}
                                          </div>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="ml-2">
                                        {content.content_type}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Assignments */}
                            {unit.assignments &&
                              unit.assignments.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3">
                                    Tareas
                                  </h4>
                                  <div className="space-y-2">
                                    {unit.assignments.map((assignment) => (
                                      <div
                                        key={assignment.id}
                                        className="p-4 bg-green-50 rounded-lg"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                              <h5 className="font-medium text-gray-900">
                                                {assignment.title}
                                              </h5>
                                              <Badge
                                                variant={
                                                  assignment.is_active
                                                    ? "default"
                                                    : "secondary"
                                                }
                                              >
                                                {assignment.is_active
                                                  ? "Activa"
                                                  : "Inactiva"}
                                              </Badge>
                                              {assignment.has_submission && (
                                                <Badge variant="secondary">
                                                  Entregada
                                                </Badge>
                                              )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">
                                              {assignment.description}
                                            </p>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                              <span>
                                                📅 Fecha límite:{" "}
                                                {formatDate(
                                                  assignment.due_date
                                                )}
                                              </span>
                                              <span>
                                                🎯 Puntos:{" "}
                                                {assignment.max_score}
                                              </span>
                                            </div>
                                          </div>
                                          <Button
                                            onClick={() =>
                                              router.push(
                                                `/campus/student/subjects/${subjectId}/assignments/${assignment.id}`
                                              )
                                            }
                                            size="sm"
                                          >
                                            Ver Tarea
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {(!unit.contents || unit.contents.length === 0) &&
                              (!unit.assignments ||
                                unit.assignments.length === 0) && (
                                <div className="text-center py-8 text-gray-500">
                                  <FileTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                  <p>No hay contenido en esta unidad todavía</p>
                                </div>
                              )}
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "documents" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Materiales de Estudio
                </h3>

                <div className="space-y-4">
                  {documents.map((document) => (
                    <Card
                      key={document.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
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
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                              <span className="flex items-center">
                                <FileTextIcon className="h-4 w-4 mr-1" />
                                {document.file_name}
                              </span>
                              <span>{formatFileSize(document.file_size)}</span>
                              <span>{formatDate(document.created_at)}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Subido por: {document.uploader.name}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleDownload(document)}
                            className="ml-4"
                          >
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {documents.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <FolderIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">
                          No hay materiales disponibles aún.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
