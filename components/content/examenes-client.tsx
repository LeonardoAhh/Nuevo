"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, BookOpen, Settings2 } from "lucide-react"
import { notify } from "@/lib/notify"
import { useExamenes } from "@/lib/hooks/useExamenes"
import ExamenesContent from "@/components/content/examenes"
import GeneradorExamenContent from "@/components/content/generador-examen"
import ReglasExamenContent from "@/components/content/reglas-examen"

type TabKey = "generador" | "banco" | "reglas"

export default function ExamenesClient() {
  const [tab, setTab] = useState<TabKey>("generador")
  // Lazy-mount tabs: only instantiate a tab's heavy hook the first time the
  // user visits it. This avoids running Supabase queries for all three tabs
  // on /examenes entry.
  const [mounted, setMounted] = useState<Record<TabKey, boolean>>({
    generador: true,
    banco: false,
    reglas: false,
  })

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        const key = v as TabKey
        setTab(key)
        setMounted((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
      }}
      className="w-full"
    >
      <div className="px-4 sm:px-6 pt-2">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="generador" className="gap-1.5 flex-1 sm:flex-none">
            <FileText size={14} />
            <span className="hidden xs:inline">Generar Examen</span>
            <span className="xs:hidden">Generar</span>
          </TabsTrigger>
          <TabsTrigger value="banco" className="gap-1.5 flex-1 sm:flex-none">
            <BookOpen size={14} />
            <span className="hidden xs:inline">Banco de Preguntas</span>
            <span className="xs:hidden">Banco</span>
          </TabsTrigger>
          <TabsTrigger value="reglas" className="gap-1.5 flex-1 sm:flex-none">
            <Settings2 size={14} />
            Reglas
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="generador" className="mt-0">
        {mounted.generador && <GeneradorExamenContent />}
      </TabsContent>

      <TabsContent value="banco" className="mt-0">
        {mounted.banco && <BancoTab />}
      </TabsContent>

      <TabsContent value="reglas" className="mt-0">
        {mounted.reglas && <ReglasExamenContent />}
      </TabsContent>
    </Tabs>
  )
}

function BancoTab() {
  const {
    preguntas,
    loading,
    error,
    buscar,
    crear,
    actualizar,
    eliminar,
    contarTotal,
  } = useExamenes()
  const [totalBanco, setTotalBanco] = useState<number | null>(null)

  useEffect(() => {
    if (error) notify.error(`Error al cargar datos: ${error}`)
  }, [error])

  // Count once on first mount so the empty state can show "N preguntas en el banco".
  useEffect(() => {
    let cancelled = false
    contarTotal().then((n) => {
      if (!cancelled) setTotalBanco(n)
    })
    return () => {
      cancelled = true
    }
  }, [contarTotal])

  return (
    <ExamenesContent
      preguntas={preguntas}
      loading={loading}
      error={error}
      totalBanco={totalBanco}
      onBuscar={buscar}
      onCrear={crear}
      onActualizar={actualizar}
      onEliminar={eliminar}
    />
  )
}
