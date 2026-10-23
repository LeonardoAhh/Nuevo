import { ClipboardList, Search } from "lucide-react"

type Estado = "inicio" | "sin-coincidencias" | "sin-pendientes"

const mensajes: Record<Estado, { titulo: string; descripcion: string }> = {
  inicio: {
    titulo: "Busca una evaluación vencida",
    descripcion: "Ingresa un número, nombre o periodo para encontrar la evaluación que necesitas capturar.",
  },
  "sin-coincidencias": {
    titulo: "Sin coincidencias",
    descripcion: "Prueba con otro número, nombre o periodo.",
  },
  "sin-pendientes": {
    titulo: "No hay evaluaciones vencidas",
    descripcion: "No hay capturas tardías pendientes por ahora.",
  },
}

export function EstadoVacioRegularizacion({ estado }: { estado: Estado }) {
  const { titulo, descripcion } = mensajes[estado]

  return <div className="flex min-h-[50svh] flex-col items-center justify-center gap-8 px-4 py-12 text-center sm:min-h-[65svh]">
    <div aria-hidden="true" className="relative w-full max-w-xs">
      <div className="absolute inset-x-4 -bottom-3 top-3 rounded-xl border border-border bg-muted/40" />
      <div className="relative rounded-xl border border-border bg-card p-5 text-left">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
            <ClipboardList className="size-5" />
          </span>
          <span className="space-y-2">
            <span className="block h-2 w-28 rounded-full bg-foreground/20" />
            <span className="block h-2 w-20 rounded-full bg-muted-foreground/20" />
          </span>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-md border border-border px-3 py-3 text-muted-foreground">
          <Search className="size-4 shrink-0" />
          <span className="h-2 w-24 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-md border border-border p-3">
            <div className="h-2 w-3/4 rounded-full bg-muted-foreground/20" />
            <div className="mt-2 h-2 w-1/2 rounded-full bg-muted-foreground/10" />
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="h-2 w-2/3 rounded-full bg-muted-foreground/20" />
            <div className="mt-2 h-2 w-1/3 rounded-full bg-muted-foreground/10" />
          </div>
        </div>
      </div>
    </div>
    <div className="max-w-sm space-y-2" role="status">
      <h3 className="text-base font-semibold text-foreground">{titulo}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{descripcion}</p>
    </div>
  </div>
}
