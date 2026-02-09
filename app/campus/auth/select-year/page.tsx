"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SelectYearPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Ruta legacy: el flujo actual usa el dashboard bloqueado + perfil
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/campus/auth/login");
      return;
    }

    router.replace("/campus/dashboard");
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Redirigiendo...</h1>
        <p className="text-gray-600">Esta pantalla ya no se usa.</p>
      </div>
    </div>
  );
}
