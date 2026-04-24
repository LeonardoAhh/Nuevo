import { FileQuestion } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background text-foreground">
      <ErrorState
        icon={FileQuestion}
        code="Error 404"
        title="Página no disponible"
        description="El recurso que buscas fue movido o ya no existe. Revisa el enlace o vuelve al inicio."
        primaryAction={{ label: "Volver al inicio", href: "/" }}
      />
    </main>
  )
}
