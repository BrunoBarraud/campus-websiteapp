"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Evitar problemas de hidratación
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return <SessionProvider>{children}</SessionProvider>;
}
