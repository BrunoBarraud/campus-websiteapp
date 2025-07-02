import type { Metadata } from "next";
import {Poppins} from "next/font/google";
import "./globals.css";
import ResponsiveNav from "@/components/Home/Navbar/ResponsiveNav";
import { NextAuthProvider } from "../app/components/auth/AuthProvider";

const font =  Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Campus Virtual | Instituto Privado Dalmacio Vélez Sarsfield",
  description: "Travel Landing Page built with Next.js and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${font.className} antialiased`}>
        <NextAuthProvider>
          <ResponsiveNav />
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
