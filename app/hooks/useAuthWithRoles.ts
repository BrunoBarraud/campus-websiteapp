"use client";
import { useSession } from "next-auth/react";
import { UserRole, ROLE_CONFIG } from "@/app/types/auth";

export interface UserWithRole {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  year?: number;
  division?: string;
  subjects?: string[];
  permissions?: string[];
}

export const useAuthWithRoles = () => {
  const { data: session, status } = useSession();

  const user = session?.user as UserWithRole | undefined;

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role) return false;

    // Los administradores tienen todos los permisos
    if (user.role === "administrador") return true;

    // Verificar permisos específicos por rol
    const roleConfig = ROLE_CONFIG[user.role];
    if (!roleConfig) return false;

    return roleConfig.permissions.includes(permission as any);
  };

  const isRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const getRoleDisplayName = (): string => {
    if (!user?.role) return "Usuario";
    return ROLE_CONFIG[user.role]?.displayName || "Usuario";
  };

  const getRoleColor = (): string => {
    if (!user?.role) return "gray";
    return ROLE_CONFIG[user.role]?.color || "gray";
  };

  const getRedirectPath = (): string => {
    if (!user?.role) return "/campus/dashboard";
    return ROLE_CONFIG[user.role]?.redirectTo || "/campus/dashboard";
  };

  return {
    user,
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    hasPermission,
    isRole,
    getRoleDisplayName,
    getRoleColor,
    getRedirectPath,
  };
};
