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
  BookOpenIcon,
  CalendarIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PinIcon,
} from "lucide-react";
import { toast } from "sonner";

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
  documents: Document[];
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

export default function StudentSubjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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

      // Obtener datos de la materia
      const subjectResponse = await fetch(`/api/admin/subjects`);
      const subjectsData = await subjectResponse.json();

      if (!subjectResponse.ok) {
        throw new Error(subjectsData.error || "Error al cargar la materia");
      }

      const currentSubject = subjectsData.find((s: any) => s.id === subjectId);
      if (!currentSubject) {
        throw new Error("Materia no encontrada");
      }

      setSubject(currentSubject);

      // Obtener unidades con contenido
      await fetchUnitsWithContent();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnitsWithContent = async () => {
    try {
      // Obtener unidades activas
      const unitsResponse = await fetch(`/api/subjects/${subjectId}/units`);
      const unitsData = await unitsResponse.json();

      if (!unitsResponse.ok) {
        throw new Error("Error al cargar unidades");
      }

      // Solo mostrar unidades activas para estudiantes
      const activeUnits = unitsData.filter((unit: any) => unit.is_active);

      // Para cada unidad activa, obtener contenido y documentos
      const unitsWithContent = await Promise.all(
        activeUnits.map(async (unit: any) => {
          const [contentsResponse, documentsResponse] = await Promise.all([
            fetch(`/api/subjects/${subjectId}/units/${unit.id}/contents`),
            fetch(`/api/subjects/${subjectId}/units/${unit.id}/documents`),
          ]);

          const contents = contentsResponse.ok
            ? await contentsResponse.json()
            : [];
          const documents = documentsResponse.ok
            ? await documentsResponse.json()
            : [];

          return {
            ...unit,
            contents: contents || [],
            documents: documents || [],
          };
        })
      );

      setUnits(unitsWithContent);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast.error("Error al cargar unidades");
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

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "🎥";
      case "document":
        return "📄";
      case "link":
        return "🔗";
      default:
        return "📝";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = (document: Document) => {
    window.open(document.file_url, "_blank");
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {subject?.name}
              </h1>
              <p className="text-gray-600">
                {subject?.code} • Año {subject?.year}
              </p>
            </div>
            <Button
              onClick={() =>
                router.push(`/campus/student/subjects/${subjectId}/assignments`)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileTextIcon className="h-4 w-4 mr-2" />
              Ver Mis Tareas
            </Button>
          </div>
        </div>

        {/* Units */}
        <div className="space-y-4">
          {units.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpenIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay contenido disponible
                </h3>
                <p className="text-gray-600 mb-4">
                  Tu profesor aún no ha publicado unidades para esta materia
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
                            {unit.contents.length} contenidos
                          </Badge>
                          <Badge variant="outline">
                            {unit.documents.length} materiales
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {/* Contents */}
                      {unit.contents.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <FileTextIcon className="h-4 w-4 mr-2" />
                            Contenidos
                          </h4>
                          <div className="space-y-3">
                            {unit.contents.map((content) => (
                              <div
                                key={content.id}
                                className="p-4 bg-blue-50 rounded-lg"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">
                                      {getContentTypeIcon(content.content_type)}
                                    </span>
                                    <h5 className="font-medium text-gray-900">
                                      {content.title}
                                    </h5>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {content.is_pinned && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-yellow-100 text-yellow-800"
                                      >
                                        <PinIcon className="h-3 w-3 mr-1" />
                                        Fijado
                                      </Badge>
                                    )}
                                    <Badge variant="outline">
                                      {content.content_type}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="text-gray-700 mb-3 whitespace-pre-wrap">
                                  {content.content}
                                </div>

                                {content.content_type === "link" && (
                                  <div className="mb-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        window.open(content.content, "_blank")
                                      }
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <ExternalLinkIcon className="h-4 w-4 mr-1" />
                                      Abrir enlace
                                    </Button>
                                  </div>
                                )}

                                <div className="text-sm text-gray-500">
                                  <CalendarIcon className="h-3 w-3 inline mr-1" />
                                  {formatDate(content.created_at)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {unit.documents.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Materiales
                          </h4>
                          <div className="space-y-3">
                            {unit.documents.map((document) => (
                              <div
                                key={document.id}
                                className="p-4 bg-green-50 rounded-lg"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 mb-1">
                                      {document.title}
                                    </h5>
                                    {document.description && (
                                      <p className="text-gray-600 text-sm mb-2">
                                        {document.description}
                                      </p>
                                    )}
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                      <span>📄 {document.file_name}</span>
                                      <span>
                                        📦 {formatFileSize(document.file_size)}
                                      </span>
                                      <span>
                                        📅 {formatDate(document.created_at)}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                      Subido por: {document.uploader.name}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(document)}
                                    className="ml-4"
                                  >
                                    <DownloadIcon className="h-4 w-4 mr-1" />
                                    Descargar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {unit.contents.length === 0 &&
                        unit.documents.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <FileTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                            <p>No hay contenido disponible en esta unidad</p>
                          </div>
                        )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
