"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { confirm } from "@/components/ui/confirm-dialog"
import { supabase } from "@/lib/supabase/client"
import { crearBorradorEvaluacion } from "@/lib/desempeno/crear-borrador"
import { cargarEvaluacionesVencidas, guardarEvaluacionTardia, type EvaluacionVencida } from "@/lib/desempeno/regularizacion/servicio"
import { validarEvaluacion, type DesempenoData } from "@/lib/types/desempeno"

export function useRegularizacion(enabled: boolean) {
  const router = useRouter()
  const [pendientes, setPendientes] = useState<EvaluacionVencida[]>([])
  const [selected, setSelected] = useState<EvaluacionVencida | null>(null)
  const [data, setData] = useState<DesempenoData | null>(null)
  const [motivo, setMotivo] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [baseline, setBaseline] = useState("")
  const request = useRef(0)
  const dirty = Boolean(data && (JSON.stringify(data) !== baseline || motivo))

  const confirmarSalida = useCallback(async () => {
    if (!dirty) return true
    return confirm({
      title: "Cambios sin guardar",
      description: "Si continúas, se perderá la captura tardía en curso.",
      confirmLabel: "Descartar cambios",
      cancelLabel: "Seguir capturando",
      tone: "destructive",
      appearance: "minimal",
    })
  }, [dirty])

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null
      if (!anchor || anchor.target === "_blank" || anchor.origin !== window.location.origin || anchor.href === window.location.href) return
      event.preventDefault()
      void confirmarSalida().then((accepted) => {
        if (accepted) router.push(`${anchor.pathname}${anchor.search}${anchor.hash}`)
      })
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("click", onDocumentClick, true)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("click", onDocumentClick, true)
    }
  }, [dirty, confirmarSalida, router])

  const reload = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setPendientes(await cargarEvaluacionesVencidas())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar las evaluaciones vencidas.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    let active = true
    void Promise.resolve().then(() => {
      if (active) void reload()
    })
    return () => { active = false }
  }, [enabled, reload])

  const abrir = useCallback(async (entry: EvaluacionVencida) => {
    const id = ++request.current
    setSelected(entry)
    setData(null)
    setError("")
    setSuccess("")
    setMotivo("")
    setLoadingDraft(true)
    try {
      const { data: incidencias, error: queryError } = await supabase
        .from("incidencias")
        .select("categoria, valor, notas, mes")
        .eq("numero_empleado", entry.numero)
      if (queryError) throw queryError
      if (id !== request.current) return
      const draft = crearBorradorEvaluacion(entry, entry.periodo, incidencias ?? [])
      setBaseline(JSON.stringify(draft))
      setData(draft)
    } catch (cause) {
      if (id !== request.current) return
      setError(cause instanceof Error ? cause.message : "No se pudo preparar la evaluación.")
    } finally {
      if (id === request.current) setLoadingDraft(false)
    }
  }, [])

  const cerrar = useCallback(async () => {
    if (!(await confirmarSalida())) return
    ++request.current
    setSelected(null)
    setData(null)
    setError("")
    setLoadingDraft(false)
  }, [confirmarSalida])

  const guardar = useCallback(async () => {
    if (!data || !selected || saving) return
    const validation = validarEvaluacion(data)
    if (!validation.valida) {
      setError(validation.errores[0] ?? "Completa la evaluación.")
      return
    }
    if (!motivo.trim()) {
      setError("Explica el motivo de la captura tardía.")
      return
    }
    setSaving(true)
    setError("")
    try {
      await guardarEvaluacionTardia(data, motivo)
      setSuccess(`${selected.nombre} · ${selected.periodo}: evaluación guardada con registro de captura tardía.`)
      setSelected(null)
      setData(null)
      setBaseline("")
      await reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la evaluación tardía.")
    } finally {
      setSaving(false)
    }
  }, [data, selected, saving, motivo, reload])

  return { pendientes, selected, data, setData, motivo, setMotivo, loading, loadingDraft, saving, error, success, abrir, cerrar, guardar, reload }
}
