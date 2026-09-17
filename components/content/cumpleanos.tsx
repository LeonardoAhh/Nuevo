"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  CalendarDays,
  CalendarRange,
  Cake,
  CheckCircle2,
  Clock3,
  FileJson,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { CumpleanosImportModal } from "@/components/content/cumpleanos-import-modal"
import {
  BIRTHDAY_LOOKAHEAD_DAYS,
  BIRTHDAY_PERIODS,
  BIRTHDAY_YEAR_DAYS,
  birthdayEntryKey,
} from "@/lib/cumpleanos"
import { useCumpleanos } from "@/lib/hooks/useCumpleanos"
import type { CumpleanosEntry } from "@/lib/hooks/useCumpleanos"
import { useRole } from "@/lib/hooks/useRole"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

const DATE_FORMATTER = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
})

const PAGE_SIZE = 8

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")
    .trim()
}

function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatBirthday(iso: string) {
  return DATE_FORMATTER.format(parseIsoDate(iso))
}

interface BirthdayRowProps {
  entry: CumpleanosEntry
  canEdit: boolean
  selected: boolean
  sending: boolean
  onToggle: () => void
  onSend: (entry: CumpleanosEntry) => Promise<void>
}

function BirthdayRow({ entry, canEdit, selected, sending, onToggle, onSend }: BirthdayRowProps) {
  const withinSendWindow = entry.diasParaCumpleanios <= BIRTHDAY_LOOKAHEAD_DAYS
  const selectable = Boolean(entry.email) && !entry.yaEnviado && withinSendWindow
  const canSend = Boolean(entry.email)
  const selectionId = `birthday-${entry.tabla}-${entry.id}`

  return (
    <li
      className={cn(
        "min-w-0 rounded-xl border border-border/70 bg-card p-4 transition-colors",
        selected && "border-primary/40 bg-primary/[0.03]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {canEdit && (
          <label
            htmlFor={selectionId}
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 has-[:disabled]:cursor-not-allowed"
          >
            <Checkbox
              id={selectionId}
              checked={selected}
              onCheckedChange={onToggle}
              disabled={!selectable}
              aria-label={`Seleccionar a ${entry.nombre}`}
            />
          </label>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="min-w-0 break-words text-sm font-semibold leading-5 text-foreground">
              {entry.nombre}
            </h3>
            {entry.numero && (
              <span className="font-mono text-xs text-muted-foreground">#{entry.numero}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {entry.yaEnviado && (
            <Badge variant="secondary" className="hidden gap-1 text-xs text-[hsl(var(--success))] sm:inline-flex">
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Enviado
            </Badge>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              disabled={!canSend || sending}
              onClick={() => onSend(entry)}
              aria-label={
                !withinSendWindow
                  ? `Enviar felicitación atrasada a ${entry.nombre}`
                  : entry.yaEnviado
                    ? `Reenviar felicitación a ${entry.nombre}`
                  : !entry.email
                    ? `${entry.nombre} no tiene correo registrado`
                    : `Enviar felicitación a ${entry.nombre}`
              }
            >
              {sending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
            </Button>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 border-t border-border/60 pt-3 sm:grid-cols-[1fr_1.35fr]">
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Cumpleaños
          </dt>
          <dd className="mt-0.5 text-sm text-foreground">
            {formatBirthday(entry.fechaCumpleanios)} · {entry.edad} años
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Correo
          </dt>
          <dd className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-foreground">
            <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 truncate">{entry.email || "Sin correo registrado"}</span>
          </dd>
        </div>
      </dl>

      {entry.yaEnviado && (
        <div className="mt-3 sm:hidden">
          <Badge variant="secondary" className="gap-1 text-xs text-[hsl(var(--success))]">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Enviado
          </Badge>
        </div>
      )}
    </li>
  )
}

interface BirthdaySectionProps {
  title: string
  entries: CumpleanosEntry[]
  icon: React.ReactNode
  canEdit: boolean
  selectedIds: Set<string>
  sendingId: string | null
  onToggle: (key: string) => void
  onSend: (entry: CumpleanosEntry) => Promise<void>
  prominent?: boolean
}

function BirthdaySection({
  title,
  entries,
  icon,
  canEdit,
  selectedIds,
  sendingId,
  onToggle,
  onSend,
  prominent = false,
}: BirthdaySectionProps) {
  return (
    <section
      aria-labelledby={`section-${title.replaceAll(" ", "-").toLowerCase()}`}
      className={cn("space-y-3", prominent && "rounded-xl bg-primary/[0.025] p-3")}
    >
      <div className="flex items-center gap-3 px-1">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
          {icon}
        </span>
        <h2
          id={`section-${title.replaceAll(" ", "-").toLowerCase()}`}
          className="min-w-0 flex-1 text-sm font-semibold text-foreground"
        >
          {title}
        </h2>
        <Badge variant="secondary" aria-label={`${entries.length} colaboradores`}>
          {entries.length}
        </Badge>
      </div>

      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => {
          const key = birthdayEntryKey(entry)
          return (
            <BirthdayRow
              key={key}
              entry={entry}
              canEdit={canEdit}
              selected={selectedIds.has(key)}
              sending={sendingId === key}
              onToggle={() => onToggle(key)}
              onSend={onSend}
            />
          )
        })}
      </ul>
    </section>
  )
}

function LoadingState() {
  return (
    <div className="space-y-4" role="status" aria-label="Cargando cumpleaños">
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-36 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
    </div>
  )
}

interface SendResponse {
  exitosos: number
  total: number
  resultados: Array<{ nombre: string; ok: boolean; error?: string }>
  error?: string
}

export default function CumpleanosContent() {
  const { canEdit } = useRole()
  const { loading, error, todos, recargar } = useCumpleanos(BIRTHDAY_YEAR_DAYS)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendingBulk, setSendingBulk] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")

  const upcomingEntries = useMemo(
    () => todos.filter((entry) => entry.diasParaCumpleanios <= BIRTHDAY_LOOKAHEAD_DAYS),
    [todos],
  )

  const filteredEntries = useMemo(() => {
    const query = normalizeSearchValue(searchQuery)
    if (!query) return upcomingEntries

    return todos.filter((entry) =>
      normalizeSearchValue(
        [entry.nombre, entry.numero, entry.email]
          .filter(Boolean)
          .join(" "),
      ).includes(query),
    )
  }, [searchQuery, todos, upcomingEntries])

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageEntries = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredEntries.slice(start, start + PAGE_SIZE)
  }, [filteredEntries, safePage])

  const selectable = useMemo(
    () =>
      pageEntries.filter(
        (entry) =>
          entry.email &&
          !entry.yaEnviado &&
          entry.diasParaCumpleanios <= BIRTHDAY_LOOKAHEAD_DAYS,
      ),
    [pageEntries],
  )
  const allSelected =
    selectable.length > 0 && selectable.every((entry) => selectedIds.has(birthdayEntryKey(entry)))
  const selectedCount = selectable.filter((entry) => selectedIds.has(birthdayEntryKey(entry))).length

  function toggleSelection(key: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds(
      allSelected ? new Set() : new Set(selectable.map((entry) => birthdayEntryKey(entry))),
    )
  }

  function handlePageChange(nextPage: number) {
    setSelectedIds(new Set())
    setPage(nextPage)
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setSelectedIds(new Set())
    setPage(1)
  }

  async function sendRecords(entries: CumpleanosEntry[], manualOverride = false) {
    const response = await fetch("/api/cumpleanos/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registros: entries.map(({ id, tabla, yaEnviado }) => ({
          id,
          tabla,
          permitirReenvio: manualOverride && yaEnviado,
          permitirFueraDePeriodo: manualOverride,
        })),
      }),
    })
    const payload = (await response.json()) as SendResponse
    if (!response.ok) throw new Error(payload.error ?? "No se pudo completar el envío")
    return payload
  }

  async function handleSendOne(entry: CumpleanosEntry) {
    const key = birthdayEntryKey(entry)
    setSendingId(key)
    try {
      const result = await sendRecords([entry], true)
      if (result.exitosos === 1) {
        notify.success(`Felicitación enviada a ${entry.nombre.split(" ")[0]}`)
        setSelectedIds((current) => {
          const next = new Set(current)
          next.delete(key)
          return next
        })
        await recargar()
      } else {
        notify.error(result.resultados[0]?.error ?? "No se pudo enviar la felicitación")
      }
    } catch (sendError) {
      notify.error(sendError instanceof Error ? sendError.message : "No se pudo enviar la felicitación")
    } finally {
      setSendingId(null)
    }
  }

  async function handleSendSelected() {
    const selected = selectable.filter((entry) => selectedIds.has(birthdayEntryKey(entry)))
    if (!selected.length) return

    setSendingBulk(true)
    try {
      const result = await sendRecords(selected)
      if (result.exitosos === result.total) {
        notify.success(`${result.exitosos} correos enviados`)
      } else if (result.exitosos === 0) {
        notify.error(result.resultados.find((item) => !item.ok)?.error ?? "No se pudo enviar el correo")
      } else {
        const firstError = result.resultados.find((item) => !item.ok)?.error
        notify.warning(
          `${result.exitosos} de ${result.total} correos enviados${firstError ? `. ${firstError}` : ""}`,
        )
      }
      setSelectedIds(new Set())
      await recargar()
    } catch (sendError) {
      notify.error(sendError instanceof Error ? sendError.message : "No se pudo completar el envío")
    } finally {
      setSendingBulk(false)
    }
  }

  if (loading) return <LoadingState />

  if (error) {
    return (
      <Card role="alert">
        <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
          <AlertCircle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="flex-1 text-sm">No se pudo cargar la información de cumpleaños.</p>
          <Button variant="outline" size="sm" onClick={() => void recargar()}>
            <RefreshCw aria-hidden="true" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  const periodGroups = [
    {
      ...BIRTHDAY_PERIODS[0],
      entries: pageEntries.filter((entry) => entry.diasParaCumpleanios === 0),
      icon: <Cake className="size-4" />,
    },
    {
      ...BIRTHDAY_PERIODS[1],
      entries: pageEntries.filter(
        (entry) => entry.diasParaCumpleanios >= 1 && entry.diasParaCumpleanios <= 7,
      ),
      icon: <CalendarDays className="size-4" />,
    },
    {
      ...BIRTHDAY_PERIODS[2],
      entries: pageEntries.filter(
        (entry) => entry.diasParaCumpleanios >= 8 && entry.diasParaCumpleanios <= 30,
      ),
      icon: <CalendarRange className="size-4" />,
    },
    {
      ...BIRTHDAY_PERIODS[3],
      entries: pageEntries.filter(
        (entry) =>
          entry.diasParaCumpleanios >= 31 &&
          entry.diasParaCumpleanios <= BIRTHDAY_LOOKAHEAD_DAYS,
      ),
      icon: <Clock3 className="size-4" />,
    },
  ]
  const periods = searchQuery.trim()
    ? [
        {
          key: "resultados",
          label: "Resultados",
          entries: pageEntries,
          icon: <Search className="size-4" />,
        },
      ]
    : periodGroups

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Buscar colaborador"
            aria-label="Buscar por nombre, número o correo"
            className="h-10 pl-9 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="min-h-10 lg:ml-1">
          {canEdit && selectable.length > 0 && (
            <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 text-sm focus-within:ring-2 focus-within:ring-ring">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Seleccionar todos los colaboradores disponibles" />
              <span aria-live="polite">
                {selectedCount > 0 ? `${selectedCount} seleccionados` : "Seleccionar todos"}
              </span>
            </label>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {selectedCount > 0 && (
            <Button size="sm" disabled={sendingBulk} onClick={() => void handleSendSelected()}>
              {sendingBulk ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              Enviar {selectedCount} {selectedCount === 1 ? "correo" : "correos"}
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <FileJson aria-hidden="true" />
              Empleados
            </Button>
          )}
          <Button variant="outline" size="icon" className="size-9" onClick={() => void recargar()} aria-label="Actualizar cumpleaños">
            <RefreshCw aria-hidden="true" />
          </Button>
        </div>
      </div>

      {upcomingEntries.length === 0 && !searchQuery.trim() ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Cake className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Sin cumpleaños próximos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                No hay registros dentro de los próximos {BIRTHDAY_LOOKAHEAD_DAYS} días.
              </p>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                Importar información
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Sin resultados</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                No encontramos colaboradores que coincidan con “{searchQuery.trim()}”.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleSearchChange("")}>
              Limpiar búsqueda
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {periods.filter((period) => period.entries.length > 0).map((period, index) => (
            <BirthdaySection
              key={period.key}
              title={period.label}
              entries={period.entries}
              icon={period.icon}
              prominent={index === 0 && period.entries.length > 0}
              canEdit={canEdit}
              selectedIds={selectedIds}
              sendingId={sendingId}
              onToggle={toggleSelection}
              onSend={handleSendOne}
            />
          ))}
          {totalPages > 1 && (
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between [&>nav]:mb-0">
              <p className="text-sm text-muted-foreground">
                Mostrando {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredEntries.length)} de {filteredEntries.length}
              </p>
              <PaginationBar
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}

      {canEdit && (
        <CumpleanosImportModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setPage(1)
            void recargar()
          }}
        />
      )}
    </div>
  )
}
