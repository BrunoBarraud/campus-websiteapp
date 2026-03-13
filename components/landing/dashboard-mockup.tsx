import { BookOpen, Calendar, GraduationCap, MessageSquare, TrendingUp, Users } from "lucide-react"

export function DashboardMockup() {
  return (
    <div className="relative w-full max-w-lg">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 blur-2xl" />
      
      <div className="relative rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-primary/5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-destructive/60" />
            <div className="h-3 w-3 rounded-full bg-accent" />
            <div className="h-3 w-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-muted-foreground">campus-virtual.edu.ar</span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Panel del Estudiante</p>
                <p className="text-xs text-muted-foreground">Bienvenido/a de vuelta</p>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DashboardCard
              icon={BookOpen}
              label="Tareas Pendientes"
              value="5"
              color="primary"
            />
            <DashboardCard
              icon={TrendingUp}
              label="Promedio General"
              value="8.5"
              color="accent"
            />
            <DashboardCard
              icon={Calendar}
              label="Próximos Exámenes"
              value="3"
              color="accent"
            />
            <DashboardCard
              icon={MessageSquare}
              label="Mensajes Nuevos"
              value="2"
              color="primary"
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Próxima clase</span>
              <span className="text-xs text-accent font-semibold">En 30 min</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Matemática - Prof. García</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: "primary" | "accent"
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-md ${
            color === "primary" ? "bg-primary/10" : "bg-accent/20"
          }`}
        >
          <Icon
            className={`h-4 w-4 ${
              color === "primary" ? "text-primary" : "text-accent-foreground"
            }`}
          />
        </div>
      </div>
      <p className="mt-2 text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
