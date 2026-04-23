"use client"

import { useEffect, useState, useTransition } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MessageSquare, RotateCcw, Search } from "lucide-react"
import { toast } from "sonner"

interface Consulta {
  numero: string
  phone: string | null
  queried_at: string
}

export default function WhatsAppDashboard() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()

  async function fetchConsultas() {
    setLoading(true)
    const { data, error } = await supabase
      .from("whatsapp_consultas")
      .select("numero, phone, queried_at")
      .order("queried_at", { ascending: false })
    if (error) {
      console.error("[WhatsApp dashboard] Supabase error:", error)
      toast.error(`Error al cargar consultas: ${error.message}`)
    } else {
      console.log("[WhatsApp dashboard] Consultas cargadas:", data?.length ?? 0)
      setConsultas(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchConsultas() }, [])

  async function handleReset(numero: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/whatsapp/reset/${numero}`, { method: "DELETE" })
        if (!res.ok) throw new Error()
        toast.success(`Consulta de #${numero} eliminada`)
        setConsultas((prev) => prev.filter((c) => c.numero !== numero))
      } catch {
        toast.error("Error al eliminar consulta")
      }
    })
  }

  const filtered = consultas.filter(
    (c) => c.numero.includes(search) || (c.phone ?? "").includes(search)
  )

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare size={16} />
          <span>
            <span className="font-semibold text-foreground">{consultas.length}</span> empleados consultaron
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          1 consulta por empleado
        </Badge>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
        <Input
          placeholder="Buscar por número o teléfono..."
          className="pl-8 h-9 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">N° Empleado</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Fecha consulta</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                  {search ? "Sin resultados" : "Nadie ha consultado aún"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.numero}>
                  <TableCell className="font-mono font-medium">#{c.numero}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.phone?.replace("whatsapp:", "") ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.queried_at).toLocaleString("es-MX", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                      onClick={() => handleReset(c.numero)}
                    >
                      <RotateCcw size={12} />
                      Resetear
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
