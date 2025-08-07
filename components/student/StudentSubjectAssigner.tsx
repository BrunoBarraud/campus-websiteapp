"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface StudentSubjectAssignerProps {
  onSubjectsAssigned?: () => void;
}

export default function StudentSubjectAssigner({
  onSubjectsAssigned,
}: StudentSubjectAssignerProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const [subjectsCount, setSubjectsCount] = useState(0);

  useEffect(() => {
    if (session?.user?.id) {
      checkAssignedSubjects();
    }
  }, [session?.user?.id]);

  const checkAssignedSubjects = async () => {
    try {
      const response = await fetch(
        `/api/student/assign-subjects?studentId=${session?.user?.id}`
      );
      const data = await response.json();

      if (data.total > 0) {
        setAssigned(true);
        setSubjectsCount(data.total);
      }
    } catch (error) {
      console.error("Error verificando materias:", error);
    }
  };

  const assignSubjects = async () => {
    if (!session?.user?.id || !session.user.year) {
      alert("No se puede determinar el año del estudiante");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/student/assign-subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: session.user.id,
          year: session.user.year,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAssigned(true);
        setSubjectsCount(data.assigned || data.subjects?.length || 0);
        alert(
          `✅ ${
            data.assigned || data.subjects?.length || 0
          } materias asignadas exitosamente`
        );

        if (onSubjectsAssigned) {
          onSubjectsAssigned();
        }
      } else {
        alert(
          `❌ Error: ${data.error || "No se pudieron asignar las materias"}`
        );
      }
    } catch (error) {
      console.error("Error asignando materias:", error);
      alert("❌ Error al asignar materias");
    } finally {
      setLoading(false);
    }
  };

  if (assigned) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-green-500 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-green-700">
            Tienes {subjectsCount} materias asignadas
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-yellow-800">
            📚 Materias no asignadas
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            Parece que no tienes materias asignadas. Haz clic para asignarlas
            automáticamente.
          </p>
        </div>
        <button
          onClick={assignSubjects}
          disabled={loading}
          className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Asignando..." : "Asignar Materias"}
        </button>
      </div>
    </div>
  );
}
