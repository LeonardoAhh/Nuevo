"use client"

import Link from "next/link"
import { Archive, ArchiveRestore, Copy, Pencil, Plus, Printer, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { confirm } from "@/components/ui/confirm-dialog"
import { formatRevision, type Formato } from "@/lib/formatos/types"

interface Props {
  items: Formato[]
  loading: boolean
  canEdit: boolean
  onEdit: (f: Formato) => void
  onNew: () => void
  onDuplicate: (id: string) => Promise<unknown>
  onSetActivo: (id: string, activo: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function FormatoList({
  items,
  loading,
  canEdit,
  onEdit,
  onNew,
  onDuplicate,
  onSetActivo,
  onDelete,
}: Props) {
  const activos = items.filter((f) => f.activo)
  const archivados = items.filter((f) => !f.activo)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold">Plantillas de examen</h2>
          <p className="text-xs text-muted-foreground">
            Encabezado estandarizado para todas; cada plantilla guarda su código y revisión.
          </p>
        </div>
        {canEdit && (
          <Button onClick={onNew} size="sm" className="gap-1.5">
            <Plus size={14} /> Nuevo formato
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <>
          <Section
            title="Activos"
            empty="No hay formatos activos. Crea el primero."
            items={activos}
            canEdit={canEdit}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onSetActivo={onSetActivo}
            onDelete={onDelete}
          />
          {archivados.length > 0 && (
            <Section
              title="Archivados"
              empty="Sin archivos archivados."
              items={archivados}
              canEdit={canEdit}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onSetActivo={onSetActivo}
              onDelete={onDelete}
            />
          )}
        </>
      )}
    </div>
  )
}

function Section({
  title,
  items,
  empty,
  canEdit,
  onEdit,
  onDuplicate,
  onSetActivo,
  onDelete,
}: {
  title: string
  items: Formato[]
  empty: string
  canEdit: boolean
  onEdit: (f: Formato) => void
  onDuplicate: (id: string) => Promise<unknown>
  onSetActivo: (id: string, activo: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        <p className="rounded-md border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      </div>
    )
  }
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-md border border-border/60 bg-card">
        {items.map((f) => (
          <li key={f.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="truncate text-sm font-medium">{f.nombre_examen}</p>
                {!f.activo && (
                  <Badge variant="outline" className="text-xs">
                    Archivado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {f.codigo} · {formatRevision(f.revision)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link
                  href={`/formatos/${f.id}/imprimir`}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                >
                  <Printer size={14} /> Imprimir
                </Link>
              </Button>
              {canEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onEdit(f)}
                  >
                    <Pencil size={14} /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onDuplicate(f.id)}
                  >
                    <Copy size={14} /> Duplicar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onSetActivo(f.id, !f.activo)}
                  >
                    {f.activo ? <Archive size={14} /> : <ArchiveRestore size={14} />}
                    {f.activo ? "Archivar" : "Restaurar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Eliminar "${f.nombre_examen}"`,
                        description:
                          "Esta acción no se puede deshacer. Se borrará la plantilla y su contenido.",
                        confirmLabel: "Eliminar",
                        tone: "destructive",
                      })
                      if (ok) await onDelete(f.id)
                    }}
                  >
                    <Trash2 size={14} /> Eliminar
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
