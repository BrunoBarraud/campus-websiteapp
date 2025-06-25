import React from "react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="bg-white shadow-md p-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mis Cursos</h1>
      </header>
      <main className="container mx-auto">{children}</main>
    </div>
  );
};

export default DashboardLayout;