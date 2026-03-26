import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "../app/components/auth/AuthProvider";
import { ThemeProvider } from "@/app/lib/contexts/ThemeProvider";
import { cookies, headers } from "next/headers";
import { getSchoolByHost } from "@/app/lib/schools";
import ConditionalNav from "@/app/ConditionalNav";
import { ToastProvider } from "@/components/ui/toast-provider";

const font = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host");
  const schoolCookie = (await cookies()).get("campus_school")?.value;
  const cookieParams = schoolCookie ? new URLSearchParams({ school: schoolCookie }) : undefined;
  const school = getSchoolByHost(host, cookieParams);

  return {
    title: `Campus Virtual | ${school.name}`,
    description: `Campus Virtual de ${school.name} - Accede a tus cursos, recursos académicos y más`,
    other: {
      "color-scheme": "light dark",
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host");
  const schoolCookie = (await cookies()).get("campus_school")?.value;
  const cookieParams = schoolCookie ? new URLSearchParams({ school: schoolCookie }) : undefined;
  const school = getSchoolByHost(host, cookieParams);

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
        className={`${font.className} antialiased transition-colors duration-300`}
      >
        <ThemeProvider school={school}>
          <NextAuthProvider>
            <div id="app-content">
              <ConditionalNav />
              {children}
              <ToastProvider />
            </div>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
