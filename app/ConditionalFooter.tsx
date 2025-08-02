'use client';
import { usePathname } from 'next/navigation';
import Footer from "@/components/Home/Footer/Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // No mostrar footer en rutas del campus (ya que el CampusLayout maneja su propio footer)
  if (pathname?.startsWith('/campus')) {
    return null;
  }
  
  return <Footer />;
}
