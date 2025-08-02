"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, UserRole, AuthResponse } from "@/app/types/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay una sesión guardada al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem("campus_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("campus_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      // Simulación de autenticación - En producción esto sería una llamada a tu API
      const response = await simulateLogin(email, password);

      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem("campus_user", JSON.stringify(response.user));
        return response;
      } else {
        return {
          success: false,
          error: response.error || "Error de autenticación",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error de conexión",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("campus_user");
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Los administradores tienen todos los permisos
    if (user.role === "administrador") return true;

    // Verificar permisos específicos por rol
    const rolePermissions = getRolePermissions(user.role);
    return rolePermissions.includes(permission);
  };

  const isRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    hasPermission,
    isRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Función para simular login - Reemplazar con llamada real a la API
const simulateLogin = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Usuarios de prueba
  const testUsers: { [key: string]: User } = {
    "alumno@ipdvs.edu.ar": {
      id: "1",
      email: "alumno@ipdvs.edu.ar",
      name: "Juan Pérez",
      role: "alumno",
      year: 5,
      division: "A",
    },
    "profesor@ipdvs.edu.ar": {
      id: "2",
      email: "profesor@ipdvs.edu.ar",
      name: "María García",
      role: "profesor",
      subjects: ["Matemáticas", "Física"],
    },
    "admin@ipdvs.edu.ar": {
      id: "3",
      email: "admin@ipdvs.edu.ar",
      name: "Carlos Rodríguez",
      role: "administrador",
      permissions: ["full_access"],
    },
  };

  const user = testUsers[email];

  if (user && password === "password123") {
    return {
      success: true,
      user,
      token: "mock_jwt_token_" + user.id,
    };
  } else {
    return {
      success: false,
      error: "Credenciales inválidas",
    };
  }
};

// Función auxiliar para obtener permisos por rol
const getRolePermissions = (role: UserRole): string[] => {
  const permissions = {
    alumno: [
      "view_courses",
      "submit_assignments",
      "view_grades",
      "send_messages",
    ],
    profesor: [
      "view_courses",
      "grade_assignments",
      "manage_students",
      "send_messages",
      "create_content",
    ],
    administrador: [
      "manage_users",
      "manage_courses",
      "view_reports",
      "system_settings",
      "full_access",
    ],
  };

  return permissions[role] || [];
};
