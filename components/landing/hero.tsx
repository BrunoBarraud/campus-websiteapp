import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardMockup } from "./dashboard-mockup"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-24 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,53,53,0.08),rgba(255,255,255,0))]" />
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent bg-accent/20 px-4 py-1.5 text-sm font-medium text-accent-foreground">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Plataforma Educativa
            </div>
            
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Bienvenido al Campus Virtual
            </h1>
            
            <p className="max-w-lg text-pretty text-lg text-muted-foreground md:text-xl">
              Tu plataforma educativa digital centralizada. Conectamos estudiantes, docentes y familias en un solo lugar.
            </p>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" className="font-semibold" asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button size="lg" variant="outline" className="font-semibold" asChild>
                <Link href="/registro">Registrarse</Link>
              </Button>
            </div>
          </div>

          <div className="relative flex items-center justify-center lg:justify-end">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
