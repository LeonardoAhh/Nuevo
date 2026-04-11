import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ChevronRight, XCircle } from "lucide-react"

// Demo data for one alert
const EVALS = [
  {
    id: "1",
    nombre: "MONTIEL JIMENEZ MARIA",
    departamento: "CALIDAD",
    dias: 15,
    fecha: "27/03/2026",
  },
  {
    id: "2",
    nombre: "GARCIA GARCIA ELIZABETH",
    departamento: "CALIDAD",
    dias: 13,
    fecha: "29/03/2026",
  },
]

export function EvalVencidasDrawerDemo() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null as null | typeof EVALS[0])

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <XCircle className="mr-2 h-4 w-4" />
        Evaluación 1er Mes — Vencidas
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-w-full w-full sm:w-[420px]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <XCircle className="text-destructive" />
              Evaluación 1er Mes — Vencidas
            </DrawerTitle>
            <DrawerDescription>
              {EVALS.length} evaluaciones con fecha pasada sin calificación
            </DrawerDescription>
          </DrawerHeader>
          <div className="divide-y">
            {EVALS.map((evalItem) => (
              <div key={evalItem.id} className="flex flex-col gap-1 py-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-base">{evalItem.nombre}</div>
                    <div className="text-xs text-muted-foreground">{evalItem.departamento}</div>
                  </div>
                  <div className="text-xs text-destructive font-bold">Hace {evalItem.dias} días</div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-destructive">Vencida</span>
                  <span className="text-xs text-muted-foreground">{evalItem.fecha}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="xs" variant="outline">Calificar</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="start">
                      <div className="mb-2">
                        <div className="font-semibold text-base">Calificar</div>
                        <div className="text-xs text-muted-foreground">Ingresa la calificación para esta evaluación.</div>
                      </div>
                      <form className="flex flex-col gap-3 mt-2">
                        <Input type="number" min={0} max={100} placeholder="Calificación" />
                        <Button type="submit" size="sm">Guardar</Button>
                      </form>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end p-4 border-t">
            <DrawerClose asChild>
              <Button variant="ghost">Cerrar</Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
