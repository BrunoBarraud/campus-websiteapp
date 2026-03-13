/**
 * schools.ts
 * Configuración de temas por escuela.
 * En el futuro estos datos vendrán de la base de datos (tabla `schools`).
 * Por ahora se definen acá como configuración estática.
 */

export interface SchoolTheme {
  name: string
  subdomain: string
  logo_url: string
  '--primary': string
  '--primary-light': string
  '--primary-rgb': string
  '--primary-surface': string
  '--primary-text': string
  '--primary-foreground': string
  '--secondary': string
  '--secondary-rgb': string
}

// ─── Temas por escuela ────────────────────────────────────────────────────────

export const SCHOOL_THEMES: Record<string, SchoolTheme> = {

  // ── Landing Page Principal (Campus Virtual) ───────────────────────────────
  landing: {
    name: 'Campus Virtual',
    subdomain: '',
    logo_url: '/images/logos/campus-virtual.png',
    '--primary': '#2563eb',          // Azul principal
    '--primary-light': '#3b82f6',    // Azul más claro
    '--primary-rgb': '37, 99, 235',
    '--primary-surface': '#eff6ff',
    '--primary-text': '#1e40af',
    '--primary-foreground': '#ffffff',
    '--secondary': '#6366f1',        // Indigo
    '--secondary-rgb': '99, 102, 241',
  },

  // ── Vélez Sarsfield ────────────────────────────────────────────────────────
  velez: {
    name: 'Instituto Vélez Sarsfield',
    subdomain: 'velez',
    logo_url: '/images/logos/velez.png',
    '--primary': '#4c0519',          // Vino tinto oscuro
    '--primary-light': '#4c0519',    // Vino tinto más claro
    '--primary-rgb': '76, 5, 25',
    '--primary-surface': '#fef3c7',
    '--primary-text': '#78350f',
    '--primary-foreground': '#fbbf24', // Amber-400 (ámbar brillante)
    '--secondary': '#fbbf24',        // Amarillo como acento secundario
    '--secondary-rgb': '245, 158, 11',
  },

  // ── Instituto San José (ISTJ) ──────────────────────────────────────────────
  sanjose: {
    name: 'Instituto San José',
    subdomain: 'sanjose',
    logo_url: '/images/logos/sanjose.jpg',
    '--primary': '#008BCC',          // Celeste institucional
    '--primary-light': '#33A8DC',
    '--primary-rgb': '0, 139, 204',
    '--primary-surface': '#E0F4FC',
    '--primary-text': '#005A85',
    '--primary-foreground': '#ffffff',
    '--secondary': '#FCE321',        // Amarillo (notificaciones, badges)
    '--secondary-rgb': '252, 227, 33',
  },

  // ── Instituto Privado Virgen Niña ──────────────────────────────────────────
  virgennina: {
    name: 'Instituto Privado Virgen Niña',
    subdomain: 'virgennina',
    logo_url: '/images/logos/virgennina.png',
    '--primary': '#343E8A',          // Azul marino institucional
    '--primary-light': '#4B56A8',
    '--primary-rgb': '52, 62, 138',
    '--primary-surface': '#ECEFFE',
    '--primary-text': '#1A2460',
    '--primary-foreground': '#ffffff',
    '--secondary': '#DE2328',        // Rojo (botones de acción, alertas)
    '--secondary-rgb': '222, 35, 40',
  },

}


// Tema por defecto (Landing page principal)
const DEFAULT_THEME = SCHOOL_THEMES.landing

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extrae el subdominio del host.
 * Ejemplos:
 *   velez.localhost:3000        → "velez"
 *   sanjose.tuaulavirtual.com.ar → "sanjose"
 *   localhost:3000              → null
 *   tuaulavirtual.com.ar        → null
 */
export function getSubdomainFromHost(host: string): string | null {
  const hostname = host.split(':')[0] // quitar el puerto
  const parts = hostname.split('.')

  // Casos donde no hay subdominio real:
  if (parts.length < 2) return null       // solo "localhost"
  if (parts[0] === 'www') return null     // www no cuenta
  if (parts[0] === 'tuaulavirtual') return null // dominio raíz
  if (parts.length === 1) return null     // dominio simple

  // Si es "localhost" solo (sin subdominio), retorna null
  if (hostname === 'localhost') return null

  return parts[0]
}

/**
 * Devuelve las variables CSS del tema para una escuela.
 * Prioridad: subdomain del host → DEV_SCHOOL env var → tema default (Vélez)
 */
export function getSchoolTheme(subdomain: string | null): SchoolTheme {
  // En desarrollo sin subdominio, usar DEV_SCHOOL como fallback
  const key = subdomain ?? process.env.DEV_SCHOOL ?? null
  return (key && SCHOOL_THEMES[key]) ? SCHOOL_THEMES[key] : DEFAULT_THEME
}

/**
 * Extrae solo las variables CSS (sin name y subdomain) para inyectar en style={}
 */
export function getThemeCssVars(theme: SchoolTheme): React.CSSProperties {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name: _name, subdomain: _subdomain, ...cssVars } = theme
  return cssVars as React.CSSProperties
}
