"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import LoadingSpinner from "../../../../../components/ui/LoadingSpinner";
import UnitAccordionStudent from "@/components/student/UnitAccordionStudent";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  year: number;
  division?: string;
  image_url: string | null;
}

export default function StudentSubjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.role !== "student") {
      router.push("/campus/login");
      return;
    }

    fetchSubject();
  }, [session, status, subjectId]);

  const fetchSubject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/subjects/${subjectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar la materia");
      }

      setSubject(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
              onClick={fetchSubject}
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

        {/* Unidades y contenidos */}
        <UnitAccordionStudent
          subjectId={subjectId}
          subjectName={subject?.name || ""}
        />
      </div>
    </div>
  );
}
