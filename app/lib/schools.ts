export interface SchoolConfig {
  id: string;
  name: string;
  subdomain: string;
  primaryColor: string;
  secondaryColor: string;
  primaryForeground: string;
  navBg?: string;
  navText?: string;
  logoUrl?: string;
}

export const SCHOOLS: Record<string, SchoolConfig> = {
  velez: {
    id: "velez",
    name: "Instituto Privado Dalmacio Vélez Sarsfield",
    subdomain: "velez",
    primaryColor: "#f59e0b", // yellow-500
    secondaryColor: "#fbbf24", // amber-400
    primaryForeground: "#111827",
    navBg: "#4c0519", // rose-950
    navText: "#ffffff",
    logoUrl: "/images/logo-velez.png",
  },
  sanjose: {
    id: "sanjose",
    name: "Instituto Privado San José",
    subdomain: "sanjose",
    primaryColor: "#0056b3", // Blue
    secondaryColor: "#ffcc00", // Yellow
    primaryForeground: "#ffffff",
    navBg: "#ffffff",
    navText: "#1f2937",
    logoUrl: "/images/logo-sanjose.png",
  },
  virgennina: {
    id: "virgennina",
    name: "Instituto Privado Virgen Niña",
    subdomain: "virgennina",
    primaryColor: "#4f46e5", // Indigo (placeholder)
    secondaryColor: "#818cf8",
    primaryForeground: "#ffffff",
    navBg: "#ffffff",
    navText: "#1f2937",
    logoUrl: "/images/logo-virgennina.png",
  },
};

export const DEFAULT_SCHOOL = SCHOOLS.velez;

export function getSchoolByHost(host: string | null, searchParams?: URLSearchParams): SchoolConfig {
  // 1. Prioridad: Parámetro de URL (útil para testing en Vercel)
  if (searchParams) {
    const schoolParam = searchParams.get('school');
    if (schoolParam && SCHOOLS[schoolParam]) {
      return SCHOOLS[schoolParam];
    }
  }

  if (!host) return DEFAULT_SCHOOL;

  const normalizedHost = host.toLowerCase().split(':')[0];
  const vercelPreviewPrefix = normalizedHost.split('---')[0];
  if (vercelPreviewPrefix && SCHOOLS[vercelPreviewPrefix]) {
    return SCHOOLS[vercelPreviewPrefix];
  }
  
  // Extract subdomain (handle localhost and production)
  // Example: velez.localhost:3000 -> velez
  // Example: velez.tuaulavirtual.com.ar -> velez
  const parts = normalizedHost.split('.');
  
  // Simple subdomain extraction for localhost: subdomain.localhost:port
  if (normalizedHost.includes('localhost')) {
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== 'www') {
      return SCHOOLS[parts[0]] || DEFAULT_SCHOOL;
    }
  } else {
    // Production extraction: subdomain.domain.com
    if (normalizedHost.endsWith('.vercel.app')) {
      if (parts.length >= 4) {
        return SCHOOLS[parts[0]] || DEFAULT_SCHOOL;
      }
    }

    if (parts.length >= 3) {
      return SCHOOLS[parts[0]] || DEFAULT_SCHOOL;
    }
  }

  return DEFAULT_SCHOOL;
}
