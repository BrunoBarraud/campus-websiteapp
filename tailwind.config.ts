import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Deshabilitar el dark mode automático basado en el sistema
  darkMode: 'class', // Cambiar de 'media' (que responde al sistema) a 'class' (manual)
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        surface: "var(--surface)",
        muted: "var(--muted)",
        border: "var(--border)",
      },
      boxShadow: {
        'soft': '0 10px 25px -8px rgba(0,0,0,0.08)',
        'elevated': '0 20px 40px -12px rgba(0,0,0,0.12)'
      },
      borderRadius: {
        'xl': '14px'
      }
    },
  },
  plugins: [],
};

export default config;
