"use client"

import Dashboard from "@/components/Dashboard"
import PromocionesContent from "@/components/content/promociones"
import { usePromociones } from "@/lib/hooks/usePromociones"

function PromocionesWrapper() {
  const { empleados, loading, error, recargar } = usePromociones()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <svg className="animate-spin mr-2 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Cargando empleados...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
        Error al cargar datos: {error}
      </div>
    )
  }

  return <PromocionesContent empleados={empleados} onDatosActualizados={recargar} />
}

export default function PromocionesPage() {
  return (
    <Dashboard
      pageTitle="Promociones"
      content={
        <div className="px-6 pt-2 pb-6">
          <PromocionesWrapper />
        </div>
      }
    />
  )
}
