"use client"

import { Calendar, Filter, Search, UserMinus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  useNotificationHistory,
  formatDateMX,
  formatDateTimeMX,
  type TipoFilter,
} from "@/lib/hooks/useNotificationHistory"

export default function NotificationHistory() {
  const {
    loading, notifications, totalCount, unreadCount,
    search, setSearch, tipo, setTipo,
    dateFrom, setDateFrom, dateTo, setDateTo,
  } = useNotificationHistory()

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
            <span>{totalCount} notificación{totalCount !== 1 ? "es" : ""}</span>
            {totalCount > 0 && (
              <>
                <span>·</span>
                <span>{unreadCount} sin leer</span>
              </>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-20 hidden sm:block shrink-0" />
                    <Skeleton className="h-4 w-24 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : notifications.length === 0 ? (
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
                    {notifications.map((n) => (
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
                            {formatDateMX(n.fecha_baja)}
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">
                          <span className="truncate max-w-[200px] block">{n.motivo || "—"}</span>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground text-xs">
                          {formatDateTimeMX(n.created_at)}
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
