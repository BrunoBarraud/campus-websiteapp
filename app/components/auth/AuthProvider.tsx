'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <SessionProvider>{children}</SessionProvider>;
}
