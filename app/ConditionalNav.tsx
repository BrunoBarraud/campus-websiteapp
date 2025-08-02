"use client";
import { usePathname } from "next/navigation";
import Nav from "@/components/Home/Navbar/Nav";

export default function ConditionalNav() {
  const pathname = usePathname();

  // No mostrar navbar en rutas del campus porque CampusLayout tiene su propia navbar
  if (pathname?.startsWith("/campus")) {
    return null;
  }

  return <Nav />;
}
