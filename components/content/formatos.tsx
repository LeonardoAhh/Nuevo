"use client"

import { useState } from "react"
import { ErrorState } from "@/components/ui/error-state"
import { FormatoEditor } from "@/components/formatos/formato-editor"
import { FormatoList } from "@/components/formatos/formato-list"
import { useFormatos } from "@/lib/hooks/useFormatos"
import { useRole } from "@/lib/hooks/useRole"
import type { Formato, FormatoDraft } from "@/lib/formatos/types"

type Mode =
  | { kind: "list" }
  | { kind: "edit"; formato: Formato }
  | { kind: "create" }

export default function FormatosContent() {
  const { items, loading, error, save, setActivo, remove, duplicate, reload } =
    useFormatos()
  const { canEdit } = useRole()
  const [mode, setMode] = useState<Mode>({ kind: "list" })
  const [saving, setSaving] = useState(false)

  if (error) {
    return (
      <div className="px-4 sm:px-6 py-8">
        <ErrorState
          title="Error al cargar formatos"
          description={error}
          primaryAction={{ label: "Reintentar", onClick: () => void reload() }}
        />
      </div>
    )
  }

  const handleSave = async (draft: FormatoDraft) => {
    setSaving(true)
    try {
      const saved = await save(draft)
      if (saved) {
        setMode({ kind: "list" })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 py-4">
      {mode.kind === "list" && (
        <FormatoList
          items={items}
          loading={loading}
          canEdit={canEdit}
          onEdit={(f) => setMode({ kind: "edit", formato: f })}
          onNew={() => setMode({ kind: "create" })}
          onDuplicate={duplicate}
          onSetActivo={setActivo}
          onDelete={remove}
        />
      )}

      {mode.kind === "create" && (
        <FormatoEditor
          saving={saving}
          canEdit={canEdit}
          onSave={handleSave}
          onCancel={() => setMode({ kind: "list" })}
        />
      )}

      {mode.kind === "edit" && (
        <FormatoEditor
          initial={mode.formato}
          saving={saving}
          canEdit={canEdit}
          onSave={handleSave}
          onCancel={() => setMode({ kind: "list" })}
        />
      )}
    </div>
  )
}
