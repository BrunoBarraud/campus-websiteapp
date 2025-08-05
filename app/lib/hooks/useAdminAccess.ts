// 🔒 Hook para verificar si el usuario es administrador
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useAdminAccess() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (status === "loading") {
      return; // Aún cargando la sesión
    }

    if (!session) {
      // No hay sesión, redirigir al login
      router.replace("/campus/auth/login");
      return;
    }

    if (session.user?.role !== "admin") {
      // No es admin, redirigir al dashboard
      router.replace("/campus/dashboard");
      return;
    }

    // Es admin, permitir acceso
    setHasAccess(true);
    setIsLoading(false);
  }, [session, status, router]);

  return {
    isLoading: status === "loading" || isLoading,
    hasAccess,
    userRole: session?.user?.role,
    isAdmin: session?.user?.role === "admin",
  };
}
