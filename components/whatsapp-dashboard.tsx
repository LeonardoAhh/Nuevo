"use client"

import { useEffect, useState, useTransition, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MessageSquare, RotateCcw, Search, X, RefreshCw } from "lucide-react"
import { notify } from "@/lib/notify"

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

  const fetchConsultas = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("whatsapp_consultas")
      .select("numero, phone, queried_at")
      .order("queried_at", { ascending: false })
    if (error) {
      console.error("[WhatsApp dashboard] Supabase error:", error)
      notify.error(`Error al cargar consultas: ${error.message}`)
    } else {
      setConsultas(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchConsultas() }, [fetchConsultas])

  async function handleReset(numero: string) {
    const ok = await notify.confirm({
      title: "Resetear consulta",
      description: `El empleado #${numero} podrá volver a consultar su cumplimiento por WhatsApp. Esta acción no se puede deshacer.`,
      confirmLabel: "Resetear",
      tone: "destructive",
    })
    if (!ok) return

    startTransition(async () => {
      try {
        const res = await fetch(`/api/whatsapp/reset/${numero}`, { method: "DELETE" })
        if (!res.ok) throw new Error()
        notify.success(`Consulta de #${numero} eliminada`)
        setConsultas((prev) => prev.filter((c) => c.numero !== numero))
      } catch {
        notify.error("Error al eliminar consulta")
      }
    })
  }

  const filtered = consultas.filter(
    (c) => c.numero.includes(search) || (c.phone ?? "").includes(search),
  )

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
        <Button
          variant="outline"
          size="icon"
          onClick={fetchConsultas}
          disabled={loading}
          title="Actualizar"
          aria-label="Actualizar consultas"
          className="shrink-0 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por número o teléfono..."
          aria-label="Buscar consultas de WhatsApp"
          className={`pl-8 h-9 text-sm ${search ? "pr-9" : ""}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
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
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
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
                      className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={isPending}
                      onClick={() => handleReset(c.numero)}
                      aria-label={`Resetear consulta del empleado #${c.numero}`}
                    >
                      <RotateCcw size={14} />
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
