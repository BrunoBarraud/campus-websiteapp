"use client";

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiBook,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import { User, Subject } from "@/lib/types";
import CampusLayout from "@/components/layouts/CampusLayout";
import SimpleModal from "@/components/common/SimpleModal";

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  subject?: Subject | null;
  teachers: User[];
}

function EditSubjectModal({
  isOpen,
  onClose,
  onSave,
  subject,
  teachers,
}: EditSubjectModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    year: 1,
    semester: 1,
    division: "A",
    teacher_id: "",
    image_url: "",
  });

  // Actualizar los datos cuando cambie el subject
  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || "",
        code: subject.code || "",
        description: subject.description || "",
        year: subject.year || 1,
        semester: subject.semester || 1,
        division: subject.division || "A",
        teacher_id: subject.teacher_id || "",
        image_url: subject.image_url || "",
      });
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
        year: 1,
        semester: 1,
        division: "A",
        teacher_id: "",
        image_url: "",
      });
    }
  }, [subject]);

  const handleSave = () => {
    if (formData.name.trim() && formData.code.trim()) {
      onSave({
        id: subject?.id,
        ...formData,
        name: formData.name.trim(),
        code: formData.code.trim(),
      });
      onClose();
    }
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        subject
          ? `✏️ Editar Materia: ${subject.name}`
          : "➕ Crear Nueva Materia"
      }
    >
      <div
        style={{
          backgroundColor: "#f0f9ff",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
          border: "2px solid #0ea5e9",
        }}
      >
        <p
          style={{
            color: "#0c4a6e",
            fontWeight: "bold",
            textAlign: "center",
            margin: 0,
          }}
        >
          📚{" "}
          {subject
            ? "Modificar información de la materia"
            : "Completar información de la nueva materia"}
        </p>
        <p
          style={{
            color: "#6b7280",
            textAlign: "center",
            marginTop: "8px",
            margin: "8px 0 0 0",
          }}
        >
          {subject
            ? "Actualiza los datos necesarios y guarda los cambios"
            : "Ingresa todos los datos requeridos para crear la materia"}
        </p>
      </div>

      {/* Nombre */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: "8px",
            color: "#374151",
          }}
        >
          📖 Nombre de la Materia: *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{
            width: "100%",
            padding: "12px",
            border: "2px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "16px",
            backgroundColor: "white",
            transition: "border-color 0.2s",
          }}
          placeholder="Ej: Matemática, Lengua y Literatura, Historia..."
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
        />
      </div>

      {/* Código */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: "8px",
            color: "#374151",
          }}
        >
          🏷️ Código de la Materia: *
        </label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          style={{
            width: "100%",
            padding: "12px",
            border: "2px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "16px",
            backgroundColor: "white",
            transition: "border-color 0.2s",
          }}
          placeholder="Ej: MAT1A, LEN2B, HIS3A..."
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
        />
      </div>

      {/* Descripción */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: "8px",
            color: "#374151",
          }}
        >
          📝 Descripción de la Materia:
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          style={{
            width: "100%",
            padding: "12px",
            border: "2px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "16px",
            backgroundColor: "white",
            resize: "vertical",
            transition: "border-color 0.2s",
          }}
          placeholder="Describe brevemente el contenido y objetivos de la materia..."
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
        />
      </div>

      {/* Año y División */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
              color: "#374151",
            }}
          >
            🎓 Año Académico:
          </label>
          <select
            value={formData.year}
            onChange={(e) =>
              setFormData({ ...formData, year: parseInt(e.target.value) })
            }
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: "white",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          >
            {[1, 2, 3, 4, 5, 6].map((year) => (
              <option key={year} value={year}>
                {year}° Año
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
              color: "#374151",
            }}
          >
            📋 División:
          </label>
          <select
            value={formData.division}
            onChange={(e) =>
              setFormData({ ...formData, division: e.target.value })
            }
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: "white",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          >
            {["A", "B"].map((division) => (
              <option key={division} value={division}>
                División {division}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Profesor */}
      <div style={{ marginBottom: "24px" }}>
        <div>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
              color: "#374151",
            }}
          >
            👨‍🏫 Profesor Asignado:
          </label>
          <select
            value={formData.teacher_id}
            onChange={(e) =>
              setFormData({ ...formData, teacher_id: e.target.value })
            }
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: "white",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          >
            <option value="">➖ Sin profesor asignado</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                👨‍🏫 {teacher.name} ({teacher.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: "12px 24px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
            transition: "background-color 0.2s",
            fontWeight: "bold",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#4b5563")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#6b7280")
          }
        >
          ❌ Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!formData.name.trim() || !formData.code.trim()}
          style={{
            padding: "12px 24px",
            backgroundColor:
              formData.name.trim() && formData.code.trim()
                ? "#10b981"
                : "#9ca3af",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor:
              formData.name.trim() && formData.code.trim()
                ? "pointer"
                : "not-allowed",
            transition: "background-color 0.2s",
            fontWeight: "bold",
          }}
          onMouseOver={(e) => {
            if (formData.name.trim() && formData.code.trim()) {
              e.currentTarget.style.backgroundColor = "#059669";
            }
          }}
          onMouseOut={(e) => {
            if (formData.name.trim() && formData.code.trim()) {
              e.currentTarget.style.backgroundColor = "#10b981";
            }
          }}
        >
          {subject ? "💾 Actualizar Materia" : "➕ Crear Materia"}
        </button>
      </div>
    </SimpleModal>
  );
}

export default function SubjectsManagementPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedDivision, setSelectedDivision] = useState<string | "all">(
    "all"
  );
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  useEffect(() => {
    loadSubjects();
    loadTeachers();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [subjects, searchTerm, selectedYear, selectedDivision]);

  const loadTeachers = async () => {
    try {
      console.log("👨‍🏫 Cargando profesores...");

      // Crear una API simple para obtener profesores
      const response = await fetch("/api/users?role=teacher");

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          console.log("✅ Profesores cargados:", result.data.length);
          setTeachers(result.data);
        } else {
          console.warn("⚠️ No se pudieron cargar los profesores");
          setTeachers([]);
        }
      } else {
        console.error(
          "❌ Error al cargar profesores - Status:",
          response.status
        );
        setTeachers([]);
      }
    } catch (error) {
      console.error("💥 Error al cargar profesores:", error);
      setTeachers([]);
    }
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);
      console.log("🔄 Cargando materias...");

      // Usar directamente la API pública que hemos simplificado
      const response = await fetch("/api/subjects");
      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("📊 Response data:", result);

        if (result.success && Array.isArray(result.data)) {
          console.log("✅ Materias cargadas:", result.data.length);
          setSubjects(result.data);
        } else {
          console.warn("⚠️ Respuesta inesperada de la API:", result);
          setSubjects([]);
        }
      } else {
        const errorText = await response.text();
        console.error(
          "❌ Error al cargar materias - Status:",
          response.status,
          "Response:",
          errorText
        );

        // Si aún falla, intentar con la API de admin
        console.log("🔄 Intentando con API de admin...");
        const adminResponse = await fetch("/api/admin/subjects");
        console.log("📡 Admin API Response status:", adminResponse.status);

        if (adminResponse.ok) {
          const adminResult = await adminResponse.json();
          if (adminResult.success && Array.isArray(adminResult.data)) {
            console.log(
              "✅ Materias cargadas desde admin API:",
              adminResult.data.length
            );
            setSubjects(adminResult.data);
          }
        }
      }
    } catch (error) {
      console.error("💥 Error al cargar materias:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubjects = () => {
    let filtered = subjects;

    if (searchTerm) {
      filtered = filtered.filter(
        (subject) =>
          subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedYear !== "all") {
      filtered = filtered.filter((subject) => subject.year === selectedYear);
    }

    if (selectedDivision !== "all") {
      filtered = filtered.filter(
        (subject) => subject.division === selectedDivision
      );
    }

    setFilteredSubjects(filtered);
  };

  const handleCreateSubject = () => {
    setEditingSubject(null);
    setShowModal(true);
    // Scroll suave hacia arriba con un pequeño retraso para mejor UX
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleEditSubject = (subject: Subject) => {
    console.log("🔧 Editando materia:", subject.name);
    setEditingSubject(subject);
    setShowModal(true);
    // Scroll suave hacia arriba con un pequeño retraso para mejor UX
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleSaveSubject = async (subjectData: any) => {
    try {
      console.log("💾 Guardando materia:", subjectData);

      if (editingSubject) {
        // Actualizar materia existente - usando API de admin
        console.log(`🔄 Actualizando materia con ID: ${editingSubject.id}`);
        const response = await fetch(
          `/api/admin/subjects/${editingSubject.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subjectData),
          }
        );

        console.log("📡 Response status:", response.status);

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Materia actualizada exitosamente:", result);
          alert("✅ Materia actualizada exitosamente");
          loadSubjects();
        } else {
          const errorData = await response.json();
          console.error("❌ Error al actualizar materia:", errorData);
          alert(
            `❌ Error al actualizar: ${errorData.error || "Error desconocido"}`
          );
        }
      } else {
        // Crear nueva materia - usando API de admin
        console.log("➕ Creando nueva materia");
        const response = await fetch("/api/admin/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subjectData),
        });

        console.log("📡 Response status:", response.status);

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Materia creada exitosamente:", result);
          alert("✅ Materia creada exitosamente");
          loadSubjects();
        } else {
          const errorData = await response.json();
          console.error("❌ Error al crear materia:", errorData);
          alert(`❌ Error al crear: ${errorData.error || "Error desconocido"}`);
        }
      }
    } catch (error) {
      console.error("💥 Error inesperado al guardar materia:", error);
      alert(`💥 Error inesperado: ${error}`);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta materia?")) {
      try {
        console.log(`🗑️ Eliminando materia con ID: ${subjectId}`);
        const response = await fetch(`/api/subjects/${subjectId}`, {
          method: "DELETE",
        });

        console.log("📡 Delete response status:", response.status);

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Materia eliminada exitosamente:", result);
          alert("✅ Materia eliminada exitosamente");
          loadSubjects();
        } else {
          const errorData = await response.json();
          console.error("❌ Error al eliminar materia:", errorData);
          alert(
            `❌ Error al eliminar: ${errorData.error || "Error desconocido"}`
          );
        }
      } catch (error) {
        console.error("💥 Error inesperado al eliminar materia:", error);
        alert(`💥 Error inesperado: ${error}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <CampusLayout>
      <div className="p-6 min-h-screen bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Materias
            </h1>
            <p className="text-gray-600">
              Administra las materias del campus, asigna profesores y configura
              años académicos
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiBook className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Materias
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {subjects.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FiUser className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Con Profesor
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {subjects.filter((s) => s.teacher_id).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FiCalendar className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Años Activos
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {new Set(subjects.map((s) => s.year)).size}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FiBook className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Sin Asignar
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {subjects.filter((s) => !s.teacher_id).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <input
                type="text"
                placeholder="Buscar materias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              />
              <select
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(
                    e.target.value === "all" ? "all" : parseInt(e.target.value)
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los años</option>
                {[1, 2, 3, 4, 5, 6].map((year) => (
                  <option key={year} value={year}>
                    {year}°
                  </option>
                ))}
              </select>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las divisiones</option>
                <option value="A">División A</option>
                <option value="B">División B</option>
              </select>
            </div>
            <button
              onClick={handleCreateSubject}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 w-full lg:w-auto justify-center"
            >
              <FiPlus className="w-4 h-4" />
              <span>Nueva Materia</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-4">
                <FiBook className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                  {subjects.length === 0
                    ? "No hay materias creadas"
                    : "No se encontraron materias"}
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  {subjects.length === 0
                    ? "Comienza creando tu primera materia para el campus virtual"
                    : "Intenta ajustar los filtros de búsqueda"}
                </p>
                {subjects.length === 0 && (
                  <button
                    onClick={handleCreateSubject}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Crear Primera Materia</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Materia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Año
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Profesor
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubjects.map((subject) => (
                      <tr
                        key={subject.id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {subject.image_url && (
                              <img
                                src={subject.image_url}
                                alt={subject.name}
                                className="w-10 h-10 rounded-lg object-cover mr-3"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/40x40/f3f4f6/9ca3af?text=?";
                                }}
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {subject.name}
                              </div>
                              {subject.description && (
                                <div className="text-xs text-gray-500 truncate max-w-xs sm:hidden">
                                  {subject.description}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 sm:hidden">
                                {subject.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                          {subject.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {subject.year}°
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                          {subject.teacher?.name || (
                            <span className="text-gray-400 italic">
                              Sin asignar
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditSubject(subject)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(subject.id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal */}
          <EditSubjectModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSave={handleSaveSubject}
            subject={editingSubject}
            teachers={teachers}
          />
        </div>
      </div>
    </CampusLayout>
  );
}
