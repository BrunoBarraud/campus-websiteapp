"use client";
import { useSession as useNextAuthSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useNextAuthSession();

  return {
    user: session?.user as
      | {
          id: string;
          email: string;
          name: string;
          role: "student" | "teacher" | "admin";
          year?: number;
          division?: string;
          avatar?: string;
          settings?: any;
        }
      | undefined,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    status,
  };
}

// Hook para verificar permisos por rol
export function useRoleAccess() {
  const { user } = useAuth();

  const hasRole = (role: "student" | "teacher" | "admin") => {
    return user?.role === role;
  };

  const isAdmin = () => hasRole("admin");
  const isTeacher = () => hasRole("teacher");
  const isStudent = () => hasRole("student");

  const canAccess = (allowedRoles: ("student" | "teacher" | "admin")[]) => {
    return user?.role ? allowedRoles.includes(user.role) : false;
  };

  return {
    user,
    hasRole,
    isAdmin,
    isTeacher,
    isStudent,
    canAccess,
  };
}
