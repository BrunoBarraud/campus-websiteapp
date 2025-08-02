// Tipos de usuario y roles
export type UserRole = "alumno" | "profesor" | "administrador";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  // Propiedades específicas para alumnos
  year?: number;
  division?: string;
  // Propiedades específicas para profesores
  subjects?: string[];
  // Propiedades específicas para administradores
  permissions?: string[];
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Configuración de roles y permisos
export const ROLE_CONFIG = {
  alumno: {
    displayName: "Alumno",
    permissions: [
      "view_courses",
      "submit_assignments",
      "view_grades",
      "send_messages",
    ],
    redirectTo: "/campus/dashboard",
    color: "blue",
  },
  profesor: {
    displayName: "Profesor",
    permissions: [
      "view_courses",
      "grade_assignments",
      "manage_students",
      "send_messages",
      "create_content",
    ],
    redirectTo: "/campus/profesor/dashboard",
    color: "green",
  },
  administrador: {
    displayName: "Administrador",
    permissions: [
      "manage_users",
      "manage_courses",
      "view_reports",
      "system_settings",
      "full_access",
    ],
    redirectTo: "/campus/admin/dashboard",
    color: "red",
  },
} as const;
