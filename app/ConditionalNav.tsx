"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ResponsiveNav from "@/components/Home/Navbar/ResponsiveNav";
import Nav from "@/components/Home/Navbar/Nav";

export default function ConditionalNav() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // En rutas del campus, solo mostrar la navbar básica con logo
  // sin elementos de navegación adicionales
  if (pathname?.startsWith("/campus")) {
    return (
      <Nav
        onMenuClick={() => {
          window.dispatchEvent(new Event("campus-open-sidebar"));
        }}
      />
    );
  }

  return <ResponsiveNav />;
}
