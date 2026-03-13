import { Building2, CheckCircle2, LineChart, MessageCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: CheckCircle2,
    title: "Gestión de Tareas",
    description:
      "Asigna, entrega y corrige tareas de forma simple. Los estudiantes reciben notificaciones automáticas de nuevas actividades.",
  },
  {
    icon: LineChart,
    title: "Calificaciones en Tiempo Real",
    description:
      "Acceso instantáneo a notas y promedios. Padres y estudiantes siempre informados del rendimiento académico.",
  },
  {
    icon: MessageCircle,
    title: "Comunicación Directa",
    description:
      "Mensajería integrada entre docentes, estudiantes y familias. Notificaciones importantes al instante.",
  },
  {
    icon: Building2,
    title: "Plataforma Multi-institución",
    description:
      "Ideal para redes de escuelas. Administra múltiples instituciones desde un solo panel centralizado.",
  },
]

export function Features() {
  return (
    <section id="caracteristicas" className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Todo lo que tu institución necesita
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Una plataforma completa diseñada para simplificar la gestión educativa y mejorar la comunicación.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-border/60 bg-card transition-shadow hover:shadow-lg hover:shadow-primary/5"
            >
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
