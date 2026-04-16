"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar, Filter, Search, UserMinus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import type { BajaNotification } from "@/lib/hooks/useBajaNotifications"

type TipoFilter = "all" | "manual" | "scheduled"

export default function NotificationHistory() {
  const [notifications, setNotifications] = useState<BajaNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tipo, setTipo] = useState<TipoFilter>("all")
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from("baja_notifications")
      .select("*")
      .gte("created_at", `${dateFrom}T00:00:00`)
      .lte("created_at", `${dateTo}T23:59:59`)
      .order("created_at", { ascending: false })

    if (tipo !== "all") {
      query = query.eq("tipo", tipo)
    }

    const { data } = await query
    setNotifications((data as BajaNotification[]) || [])
    setLoading(false)
  }, [dateFrom, dateTo, tipo])

  useEffect(() => {
    fetch()
  }, [fetch])

  const filtered = notifications.filter((n) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      n.employee_name.toLowerCase().includes(q) ||
      (n.employee_numero?.toLowerCase().includes(q) ?? false) ||
      (n.motivo?.toLowerCase().includes(q) ?? false)
    )
  })

  const formatDate = (d: string) => {
    try {
      return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(d.includes("T") ? d : d + "T00:00:00"))
    } catch {
      return d
    }
  }

  const formatDateTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={18} />
            Historial de Notificaciones
          </CardTitle>
          <CardDescription>
            Últimos 30 días de notificaciones de baja. Usa los filtros para buscar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Input
                  placeholder="Nombre, número, motivo…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearch("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="scheduled">Programada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{filtered.length} notificación{filtered.length !== 1 ? "es" : ""}</span>
            {filtered.length > 0 && (
              <>
                <span>·</span>
                <span>{filtered.filter((n) => !n.read).length} sin leer</span>
              </>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
              Cargando…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Sin notificaciones en este rango
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Estado</th>
                      <th className="text-left px-3 py-2 font-medium">Empleado</th>
                      <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">No.</th>
                      <th className="text-left px-3 py-2 font-medium">Fecha baja</th>
                      <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Motivo</th>
                      <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">Creada</th>
                      <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((n) => (
                      <tr key={n.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2">
                          {n.read ? (
                            <Badge variant="outline" className="text-[10px]">Leída</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">Nueva</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          <div className="flex items-center gap-1.5">
                            <UserMinus size={12} className="text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{n.employee_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground">
                          {n.employee_numero ? `#${n.employee_numero}` : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className="text-muted-foreground" />
                            {formatDate(n.fecha_baja)}
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">
                          <span className="truncate max-w-[200px] block">{n.motivo || "—"}</span>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground text-xs">
                          {formatDateTime(n.created_at)}
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          <Badge variant="secondary" className="text-[10px]">
                            {(n as any).tipo === "scheduled" ? "Programada" : "Manual"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
