import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CourseCard from "@/components/dashboard/CourseCard";

const DashboardPage = () => {
  const cursos = [
    { id: 1, title: "Matemática", teacher: "Prof. Pérez" },
    { id: 2, title: "Lengua", teacher: "Prof. Gómez" },
    { id: 3, title: "Historia", teacher: "Prof. Álvarez" },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Mis Cursos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {cursos.map((curso) => (
          <CourseCard key={curso.id} course={curso} />
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;