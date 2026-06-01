import { Suspense } from "react"
import RecontratacionPrintPage from "@/components/content/recontratacion-print-page"

export default function ImprimirRecontratacionPage() {
  return (
    <Suspense>
      <RecontratacionPrintPage />
    </Suspense>
  )
}
