"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileQuestion, Plus, ShieldAlert } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRole } from "@/lib/hooks"
import { notify } from "@/lib/notify"
import { supabase } from "@/lib/supabase/client"
import { describeSupabaseError } from "@/lib/supabase/errors"
import { ReglamentoIncumplimientoFormDialog } from "@/components/content/reglamento-incumplimiento-form-dialog"
import {
  useReglamentoIncumplimientos,
  type ReglamentoIncumplimiento,
} from "@/lib/hooks/useReglamentoIncumplimientos"

interface ReglamentoIncumplimientosPageProps {
  numeroEmpleado: string
}

function formatMonth(month: string): string {
  const date = new Date(`${month}-01T00:00:00Z`)
  const label = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
  return label.charAt(0).toLocaleUpperCase("es-MX") + label.slice(1)
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function today(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function recordDate(record: ReglamentoIncumplimiento): string {
  return `${record.mes}-${String(record.dia).padStart(2, "0")}`
}

function isValidDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function ReglamentoIncumplimientosPage({
  numeroEmpleado,
}: ReglamentoIncumplimientosPageProps) {
  const { canEdit } = useRole()
  const {
    loading, saving, error, fetchByEmpleado, reloadByEmpleado, saveForEmpleadoDia,
  } = useReglamentoIncumplimientos()
  const [records, setRecords] = useState<ReglamentoIncumplimiento[]>([])
  const [nombreEmpleado, setNombreEmpleado] = useState<string | null>(null)
  const [identityError, setIdentityError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState(today)
  const [formCount, setFormCount] = useState("1")
  const [formError, setFormError] = useState<string | null>(null)
  const newRecordRef = useRef<HTMLButtonElement>(null)

  const load = useCallback(async () => {
    setRecords(await reloadByEmpleado(numeroEmpleado))
  }, [numeroEmpleado, reloadByEmpleado])

  useEffect(() => {
    let active = true
    void fetchByEmpleado(numeroEmpleado).then(data => {
      if (active) setRecords(data)
    })
    supabase
      .from("employees")
      .select("nombre")
      .eq("numero", numeroEmpleado)
      .maybeSingle()
      .then(({ data, error: dbError }) => {
        if (!active) return
        if (dbError) {
          setIdentityError(describeSupabaseError(dbError, "Error al cargar el empleado"))
          return
        }
        setNombreEmpleado(data?.nombre ?? null)
      })

    return () => {
      active = false
    }
  }, [fetchByEmpleado, numeroEmpleado])

  const months = useMemo(() => {
    const grouped = new Map<string, ReglamentoIncumplimiento[]>()
    for (const record of records) {
      const days = grouped.get(record.mes) ?? []
      days.push(record)
      grouped.set(record.mes, days)
    }
    return [...grouped.entries()].map(([month, days]) => ({
      month,
      days,
      total: days.reduce((sum, day) => sum + day.cantidad, 0),
    }))
  }, [records])

  const existingDateRecord = records.find(record => recordDate(record) === formDate)

  const openForm = () => {
    const date = today()
    const existing = records.find(record => recordDate(record) === date)
    setFormDate(date)
    setFormCount(String(existing?.cantidad ?? 1))
    setFormError(null)
    setShowForm(true)
  }

  const handleDateChange = (date: string) => {
    const existing = records.find(record => recordDate(record) === date)
    setFormDate(date)
    setFormCount(String(existing?.cantidad ?? 1))
    setFormError(null)
  }

  const handleSave = async () => {
    if (!isValidDate(formDate)) {
      setFormError("Selecciona una fecha válida.")
      return
    }

    const cantidad = Number(formCount)
    if (!Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > 2_147_483_647) {
      setFormError("La cantidad debe ser un entero mayor que cero.")
      return
    }

    const existing = records.find(record => recordDate(record) === formDate)
    if (existing && existing.cantidad === cantidad) {
      setFormError(`Ya hay ${formatCount(existing.cantidad, "incumplimiento", "incumplimientos")} registrado(s) para esta fecha. Si hubo reincidencia, valida y captura la nueva cantidad total.`)
      return
    }

    if (existing) {
      const confirmed = await notify.confirm({
        title: "Actualizar cantidad del día",
        description: `Ya hay ${formatCount(existing.cantidad, "incumplimiento", "incumplimientos")} para el ${formDate}. Confirma que la nueva cantidad total, considerando la reincidencia, sea ${cantidad}.`,
        confirmLabel: "Actualizar cantidad",
        tone: "warning",
      })
      if (!confirmed) return
    }

    setFormError(null)
    const result = await saveForEmpleadoDia(
      numeroEmpleado,
      formDate,
      cantidad,
      existing?.cantidad ?? null,
    )
    if (!result.success) {
      setFormError(result.error ?? "No se pudo guardar el incumplimiento.")
      void load()
      return
    }

    const [year, month, day] = formDate.split("-")
    const updatedRecord: ReglamentoIncumplimiento = {
      numero_empleado: numeroEmpleado,
      mes: `${year}-${month}`,
      dia: Number(day),
      cantidad,
    }
    setRecords(current => [
      ...current.filter(record => recordDate(record) !== formDate),
      updatedRecord,
    ].sort((first, second) =>
      second.mes.localeCompare(first.mes) || first.dia - second.dia,
    ))
    setShowForm(false)
    notify.success(existing ? "Cantidad actualizada." : "Incumplimiento capturado.")
  }

  return (
    <div className="space-y-6">
      <Link
        href="/plantilla"
        className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a plantilla
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">Núm. {numeroEmpleado}</p>
          <h2 className="break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {nombreEmpleado ?? "Empleado"}
          </h2>
          <p className="text-sm text-muted-foreground">Incumplimientos del reglamento interno</p>
        </div>
        {canEdit && (
          <Button
            ref={newRecordRef}
            type="button"
            className="h-11 w-full shrink-0 sm:w-auto"
            onClick={openForm}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nuevo incumplimiento
          </Button>
        )}
      </header>

      {identityError && (
        <Alert variant="destructive" role="alert">
          <ShieldAlert className="size-4" aria-hidden="true" />
          <AlertDescription>{identityError}</AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="records-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <h3 id="records-title" className="text-xl font-semibold tracking-tight text-foreground">
            Meses con incumplimientos
          </h3>
          {!loading && months.length > 0 && (
            <Badge variant="outline" className="border-border bg-card font-medium text-muted-foreground">
              {months.length} {months.length === 1 ? "mes" : "meses"}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground" role="status">
            <ShieldAlert className="size-4" aria-hidden="true" />
            Cargando incumplimientos...
          </div>
        ) : error ? (
          <div className="space-y-3">
            <Alert variant="destructive" role="alert">
              <ShieldAlert className="size-4" aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => void load()}>
              Reintentar
            </Button>
          </div>
        ) : months.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-12 text-center">
            <FileQuestion className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-medium text-foreground">Sin incumplimientos</p>
            <p className="text-sm text-muted-foreground">
              No hay días con registros para este empleado.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {months.map(({ month, days, total }) => (
              <section key={month} className="rounded-xl border border-border bg-card p-4 sm:p-6">
                <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-lg font-semibold tracking-tight text-foreground">{formatMonth(month)}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatCount(total, "incumplimiento", "incumplimientos")}
                  </p>
                </header>
                <ul className="divide-y divide-border">
                  {days.map(({ dia, cantidad }) => (
                    <li key={dia} className="flex min-h-11 items-center justify-between gap-4 py-2 text-sm">
                      <span className="font-medium text-foreground">Día {dia}</span>
                      <span className="text-muted-foreground">
                        {formatCount(cantidad, "incumplimiento", "incumplimientos")}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      {canEdit && (
        <ReglamentoIncumplimientoFormDialog
          open={showForm}
          onOpenChange={open => {
            setShowForm(open)
            if (!open) setFormError(null)
          }}
          saving={saving}
          date={formDate}
          count={formCount}
          existingCount={existingDateRecord?.cantidad ?? null}
          employeeName={nombreEmpleado ?? "Empleado"}
          employeeNumber={numeroEmpleado}
          error={formError}
          onDateChange={handleDateChange}
          onCountChange={setFormCount}
          onErrorChange={setFormError}
          onSave={handleSave}
          onReturnFocus={() => newRecordRef.current?.focus()}
        />
      )}
    </div>
  )
}
