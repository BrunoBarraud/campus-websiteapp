'use client';
import { usePathname } from 'next/navigation';
import ResponsiveNav from "@/components/Home/Navbar/ResponsiveNav";
import Nav from "@/components/Home/Navbar/Nav";

export default function ConditionalNav() {
  const pathname = usePathname();
  
  // En rutas del campus, solo mostrar la navbar básica con logo
  // sin elementos de navegación adicionales
  if (pathname?.startsWith('/campus')) {
    return <Nav />;
  }
  
  return <ResponsiveNav />;
}
