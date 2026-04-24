"use client"

import { useMemo, useState } from "react"
import { Loader2, Save, Search, Settings2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useReglasCRUD, TRANSICION_LABEL, TRANSICION_ORDEN } from "@/lib/hooks/useGeneradorExamen"
import { useRole } from "@/lib/hooks"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import type { TransicionKey } from "@/lib/hooks/useGeneradorExamen"
import { CATALOGO_ORGANIZACIONAL } from "@/lib/catalogo"

const DEPARTAMENTOS = Object.keys(CATALOGO_ORGANIZACIONAL)

// Semantic tones (tokens from globals.css) — adapt to light/dark and accent.
// D→C = warming / next step (warning), C→B = info, B→A = final / success.
const TRANSICION_COLOR: Record<TransicionKey, string> = {
  D_C: "bg-warning/10 border-warning/30",
  C_B: "bg-info/10 border-info/30",
  B_A: "bg-success/10 border-success/30",
}

export default function ReglasExamenContent() {
  const { isReadOnly } = useRole()
  const { reglas, loading, error, guardar, toggleActivo } = useReglasCRUD()
  const [saving, setSaving] = useState<string | null>(null) // "DEP_TRANSICION"
  const [editValues, setEditValues] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState("")

  const filteredDeps = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return DEPARTAMENTOS
    return DEPARTAMENTOS.filter((d) => d.toLowerCase().includes(q))
  }, [filter])

  const getKey = (dep: string, t: TransicionKey) => `${dep}__${t}`

  const getRegla = (dep: string, t: TransicionKey) =>
    reglas.find((r) => r.departamento === dep && r.transicion === t)

  const getValue = (dep: string, t: TransicionKey): number => {
    const k = getKey(dep, t)
    if (editValues[k] !== undefined) return editValues[k]
    return getRegla(dep, t)?.num_preguntas ?? 20
  }

  const handleChange = (dep: string, t: TransicionKey, val: string) => {
    const n = parseInt(val)
    if (isNaN(n) || n < 1) return
    setEditValues((prev) => ({ ...prev, [getKey(dep, t)]: n }))
  }

  const handleSave = async (dep: string, t: TransicionKey) => {
    const k = getKey(dep, t)
    const val = editValues[k]
    if (val === undefined) return
    setSaving(k)
    try {
      await guardar(dep, t, val)
      setEditValues((prev) => {
        const next = { ...prev }
        delete next[k]
        return next
      })
    } catch {
      // error visible en la UI
    } finally {
      setSaving(null)
    }
  }

  const isDirty = (dep: string, t: TransicionKey) =>
    editValues[getKey(dep, t)] !== undefined

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 size={20} className="mr-2 animate-spin" />
        Cargando reglas...
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 pb-6 space-y-4">
      <ReadOnlyBanner />
      <div className="flex items-center gap-2 mb-1">
        <Settings2 size={16} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Define cuántas preguntas aleatorias se generan por departamento y categoría de promoción.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filtrar departamento..."
          className={`pl-9 ${filter ? "pr-9" : ""}`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {filter && (
          <button
            onClick={() => setFilter("")}
            aria-label="Limpiar filtro"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {filteredDeps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Search size={40} className="mb-3 opacity-30" />
          <p className="text-base font-medium">Sin coincidencias</p>
          <p className="text-sm mt-1">Ningún departamento coincide con &quot;{filter}&quot;.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDeps.map((dep) => (
          <Card key={dep}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">{dep}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {TRANSICION_ORDEN.map((t) => {
                const regla = getRegla(dep, t)
                const key = getKey(dep, t)
                const dirty = isDirty(dep, t)
                const isSaving = saving === key

                return (
                  <div
                    key={t}
                    className={`rounded-lg border px-3 py-2 transition-opacity ${TRANSICION_COLOR[t]} ${regla && !regla.activo ? "opacity-50" : ""}`}
                  >
                    {/* Fila superior: toggle + etiqueta + estado */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <Switch
                        checked={regla?.activo ?? true}
                        onCheckedChange={(v) => regla && toggleActivo(regla.id, v)}
                        disabled={isReadOnly || !regla}
                        className="shrink-0"
                      />
                      <span className="font-bold text-sm flex-1">{TRANSICION_LABEL[t]}</span>
                      {dirty ? (
                        <Button
                          size="sm"
                          className="h-9 text-xs px-3"
                          onClick={() => handleSave(dep, t)}
                          disabled={isReadOnly || isSaving}
                        >
                          {isSaving ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <><Save size={12} className="mr-1" />Guardar</>
                          )}
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                          {regla ? "Guardado" : "Sin regla"}
                        </Badge>
                      )}
                    </div>

                    {/* Fila inferior: input + label */}
                    <div className="flex items-center gap-2 ml-10">
                      <Input
                        type="number"
                        min={1}
                        max={200}
                        value={getValue(dep, t)}
                        onChange={(e) => handleChange(dep, t, e.target.value)}
                        aria-label={`Preguntas para ${dep} ${TRANSICION_LABEL[t]}`}
                        className="w-24 h-9 text-sm text-center"
                        disabled={regla && !regla.activo}
                      />
                      <span className="text-xs text-muted-foreground">preguntas aleatorias</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  )
}
