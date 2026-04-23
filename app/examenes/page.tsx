"use client"

import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import ExamenesContent from "@/components/content/examenes"
import GeneradorExamenContent from "@/components/content/generador-examen"
import ReglasExamenContent from "@/components/content/reglas-examen"
import { useExamenes } from "@/lib/hooks/useExamenes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, BookOpen, Settings2 } from "lucide-react"
import { useEffect } from "react"
import { notify } from "@/lib/notify"

export const metadata: Metadata = {
  title: "Exámenes",
}

export default function ExamenesPage() {
  const { preguntas, loading, error, buscar, crear, actualizar, eliminar } = useExamenes()

  useEffect(() => {
    if (error) notify.error(`Error al cargar datos: ${error}`)
  }, [error])

  return (
    <Dashboard
      pageTitle="Exámenes"
      content={
        <Tabs defaultValue="generador" className="w-full">
          <div className="px-6 pt-2">
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
            <GeneradorExamenContent />
          </TabsContent>

          <TabsContent value="banco" className="mt-0">
            <ExamenesContent
              preguntas={preguntas}
              loading={loading}
              error={error}
              onBuscar={buscar}
              onCrear={crear}
              onActualizar={actualizar}
              onEliminar={eliminar}
            />
          </TabsContent>

          <TabsContent value="reglas" className="mt-0">
            <ReglasExamenContent />
          </TabsContent>
        </Tabs>
      }
    />
  )
}
