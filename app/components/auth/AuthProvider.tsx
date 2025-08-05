"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <SessionProvider>{children}</SessionProvider>;
}
