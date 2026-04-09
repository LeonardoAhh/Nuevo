"use client"

import { useState } from "react"
import { Loader2, Save, Settings2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useReglasCRUD, TRANSICION_LABEL, TRANSICION_ORDEN } from "@/lib/hooks/useGeneradorExamen"
import type { TransicionKey } from "@/lib/hooks/useGeneradorExamen"
import { CATALOGO_ORGANIZACIONAL } from "@/lib/catalogo"

const DEPARTAMENTOS = Object.keys(CATALOGO_ORGANIZACIONAL)

const TRANSICION_COLOR: Record<TransicionKey, string> = {
  D_C: "bg-orange-50 border-orange-200 dark:bg-orange-900/20",
  C_B: "bg-blue-50 border-blue-200 dark:bg-blue-900/20",
  B_A: "bg-green-50 border-green-200 dark:bg-green-900/20",
}

export default function ReglasExamenContent() {
  const { reglas, loading, error, guardar, toggleActivo } = useReglasCRUD()
  const [saving, setSaving] = useState<string | null>(null) // "DEP_TRANSICION"
  const [editValues, setEditValues] = useState<Record<string, number>>({})

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
    <div className="px-6 pt-2 pb-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Settings2 size={16} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Define cuántas preguntas aleatorias se generan por departamento y categoría de promoción.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {DEPARTAMENTOS.map((dep) => (
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
                        disabled={!regla}
                        className="shrink-0"
                      />
                      <span className="font-bold text-sm flex-1">{TRANSICION_LABEL[t]}</span>
                      {dirty ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => handleSave(dep, t)}
                          disabled={isSaving}
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
                        className="w-20 h-7 text-sm text-center"
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
    </div>
  )
}
