import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/app/components/auth/AuthProvider";

import ConditionalNav from "@/app/ConditionalNav";
import { ToastProvider } from "@/components/ui/toast-provider";

const font = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Campus Virtual | Instituto Privado Dalmacio Vélez Sarsfield",
  description:
    "Campus Virtual del Instituto Privado Dalmacio Vélez Sarsfield - Accede a tus cursos, recursos académicos y más",
  other: {
    "color-scheme": "light dark",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        className={`${font.className} antialiased bg-white text-gray-900 transition-colors duration-300`}
      >
        <NextAuthProvider>
          <div id="app-content">
            <ConditionalNav />
            {children}
            <ToastProvider />
          </div>
        </NextAuthProvider>
      </body>
    </html>
  );
}
