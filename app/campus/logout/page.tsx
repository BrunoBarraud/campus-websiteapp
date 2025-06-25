"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Acá iría signOut() si usaras next-auth
    // signOut();

    // Por ahora solo redirige al home
    router.push("/");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <p className="text-lg">Cerrando sesión...</p>
    </div>
  );
};

export default LogoutPage;
