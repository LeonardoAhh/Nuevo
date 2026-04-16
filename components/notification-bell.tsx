"use client"

import { useState, useCallback, useRef } from "react"
import { Bell, Plus, Trash2, CheckCheck, UserMinus, Calendar, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  useBajaNotifications,
  type BajaNotificationInsert,
} from "@/lib/hooks/useBajaNotifications"
import { supabase } from "@/lib/supabase/client"

export default function NotificationBell() {
  const {
    notifications,
    loading,
    unreadCount,
    create,
    markAsRead,
    markAllAsRead,
    remove,
  } = useBajaNotifications()

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Form state
  const [form, setForm] = useState<BajaNotificationInsert>({
    employee_name: "",
    employee_numero: "",
    motivo: "",
    fecha_baja: new Date().toISOString().slice(0, 10),
  })

  const resetForm = () => {
    setForm({
      employee_name: "",
      employee_numero: "",
      motivo: "",
      fecha_baja: new Date().toISOString().slice(0, 10),
    })
    setLookupError(null)
  }

  // Lookup employee by number — searches both tables
  const lookupEmployee = useCallback(async (numero: string) => {
    if (!numero.trim()) {
      setForm((f) => ({ ...f, employee_name: "" }))
      setLookupError(null)
      return
    }
    setLookupLoading(true)
    setLookupError(null)

    // Try employees table first, then nuevo_ingreso
    const { data: emp } = await supabase
      .from("employees")
      .select("nombre, puesto, departamento")
      .eq("numero", numero.trim())
      .maybeSingle()

    if (emp) {
      setForm((f) => ({ ...f, employee_name: emp.nombre }))
      setLookupLoading(false)
      return
    }

    const { data: ni } = await supabase
      .from("nuevo_ingreso")
      .select("nombre, puesto, departamento")
      .eq("numero", numero.trim())
      .maybeSingle()

    if (ni) {
      setForm((f) => ({ ...f, employee_name: ni.nombre }))
    } else {
      setForm((f) => ({ ...f, employee_name: "" }))
      setLookupError("Empleado no encontrado")
    }
    setLookupLoading(false)
  }, [])

  const handleNumeroChange = (value: string) => {
    setForm((f) => ({ ...f, employee_numero: value, employee_name: "" }))
    setLookupError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => lookupEmployee(value), 400)
  }

  const handleCreate = async () => {
    if (!form.employee_name.trim() || !form.fecha_baja) return
    setSubmitting(true)
    try {
      await create(form)
      resetForm()
      setDialogOpen(false)
    } catch (e) {
      console.error("Error creating notification:", e)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (d: string) => {
    try {
      return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(d + "T00:00:00"))
    } catch {
      return d
    }
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "ahora"
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    const days = Math.floor(hrs / 24)
    return `hace ${days}d`
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notificaciones"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center pointer-events-none"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-80 sm:w-96 p-0 max-h-[70dvh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Notificaciones de Baja</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => markAllAsRead()}
                >
                  <CheckCheck size={14} />
                  <span className="hidden sm:inline">Marcar leídas</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-primary"
                onClick={() => {
                  setPopoverOpen(false)
                  setDialogOpen(true)
                }}
              >
                <Plus size={14} />
                Crear
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Cargando…
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Sin notificaciones
              </div>
            ) : (
              <ul className="divide-y">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer ${
                      !n.read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (!n.read) markAsRead(n.id)
                    }}
                  >
                    <div
                      className={`mt-0.5 flex-shrink-0 rounded-full p-1.5 ${
                        !n.read
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <UserMinus size={14} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {n.employee_name}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      {n.employee_numero && (
                        <p className="text-xs text-muted-foreground">
                          #{n.employee_numero}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar size={10} />
                        Baja: {formatDate(n.fecha_baja)}
                      </div>
                      {n.motivo && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.motivo}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        remove(n.id)
                      }}
                      aria-label="Eliminar notificación"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus size={18} className="text-destructive" />
              Nueva notificación de Baja
            </DialogTitle>
            <DialogDescription>
              Ingresa el número del empleado para buscar sus datos
              automáticamente.
            </DialogDescription>
          </DialogHeader>

          {/* Botones arriba en móvil */}
          <div className="grid grid-cols-2 gap-2 sm:hidden">
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setDialogOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={
                !form.employee_name.trim() || !form.fecha_baja || submitting
              }
              onClick={handleCreate}
            >
              {submitting ? "Guardando…" : "Registrar baja"}
            </Button>
          </div>

          <div className="grid gap-4 py-2">
            {/* Número de empleado — campo principal */}
            <div className="grid gap-2">
              <Label htmlFor="emp-num">
                No. empleado <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="emp-num"
                  placeholder="Ej. 1234"
                  value={form.employee_numero ?? ""}
                  onChange={(e) => handleNumeroChange(e.target.value)}
                  autoFocus
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {lookupLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Search size={14} />
                  )}
                </div>
              </div>
              {lookupError && (
                <p className="text-xs text-destructive">{lookupError}</p>
              )}
            </div>

            {/* Nombre — auto-rellenado, solo lectura */}
            <div className="grid gap-2">
              <Label htmlFor="emp-name">Nombre del empleado</Label>
              <Input
                id="emp-name"
                placeholder="Se rellena automáticamente"
                value={form.employee_name}
                readOnly
                className="bg-muted/50"
              />
            </div>

            {/* Fecha de baja */}
            <div className="grid gap-2">
              <Label htmlFor="fecha-baja">
                Fecha de baja <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fecha-baja"
                type="date"
                value={form.fecha_baja}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fecha_baja: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea
                id="motivo"
                placeholder="Motivo de la baja (opcional)"
                rows={3}
                value={form.motivo ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, motivo: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Botones en desktop (abajo) */}
          <DialogFooter className="hidden sm:flex">
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setDialogOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={
                !form.employee_name.trim() || !form.fecha_baja || submitting
              }
              onClick={handleCreate}
            >
              {submitting ? "Guardando…" : "Registrar baja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
