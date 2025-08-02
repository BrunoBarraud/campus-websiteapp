"use client";
import React, { useState, useEffect } from "react";

interface DatabaseInfo {
  structure?: {
    success: boolean;
    users?: any[];
    error?: string;
  };
  roles?: {
    success: boolean;
    roles?: Record<string, number>;
    error?: string;
  };
}

export default function DatabaseExplorer() {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [usersByRole, setUsersByRole] = useState<any[]>([]);

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const fetchDatabaseInfo = async () => {
    try {
      const response = await fetch("/api/explore-db");
      const data = await response.json();
      console.log("Database info:", data);
      setDbInfo(data);
    } catch (error) {
      console.error("Error fetching database info:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByRole = async (role: string) => {
    setSelectedRole(role);
    try {
      const response = await fetch(
        `/api/explore-db?action=users-by-role&role=${role}`
      );
      const data = await response.json();
      if (data.success) {
        setUsersByRole(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users by role:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Explorando la base de datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Explorador de Base de Datos - Campus Virtual
        </h1>

        {/* Información de Roles */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Distribución de Roles
          </h2>
          {dbInfo?.roles?.success ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(dbInfo.roles.roles || {}).map(([role, count]) => (
                <div
                  key={role}
                  className="bg-blue-50 p-4 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => fetchUsersByRole(role)}
                >
                  <h3 className="font-semibold text-blue-800 capitalize">
                    {role}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">{count}</p>
                  <p className="text-sm text-blue-600">usuarios</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600">Error: {dbInfo?.roles?.error}</p>
          )}
        </div>

        {/* Estructura de Usuarios */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Estructura de la Tabla de Usuarios
          </h2>
          {dbInfo?.structure?.success ? (
            <div className="overflow-x-auto">
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(dbInfo.structure.users?.[0] || {}, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-red-600">Error: {dbInfo?.structure?.error}</p>
          )}
        </div>

        {/* Usuarios por Rol */}
        {selectedRole && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Usuarios con rol:{" "}
              <span className="capitalize text-blue-600">{selectedRole}</span>
            </h2>
            {usersByRole.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detalles
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersByRole.map((user, index) => (
                      <tr key={user.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.year &&
                            user.division &&
                            `${user.year}° ${user.division}`}
                          {user.subjects &&
                            `Materias: ${user.subjects.join(", ")}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">
                No se encontraron usuarios con el rol seleccionado.
              </p>
            )}
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Información sobre la Base de Datos
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  • Haz clic en cada rol para ver los usuarios correspondientes
                </p>
                <p>
                  • Esta información nos ayudará a diseñar el sistema de
                  autenticación
                </p>
                <p>
                  • Los roles disponibles son: administrador, profesor, alumno
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
