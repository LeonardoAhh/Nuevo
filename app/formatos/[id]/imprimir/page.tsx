import type { Metadata } from "next"
import { FormatoPrintClient } from "@/components/formatos/formato-print-client"

export const metadata: Metadata = {
  title: "Imprimir formato",
  robots: { index: false, follow: false },
}

interface Props {
  params: { id: string }
}

export default function ImprimirFormatoPage({ params }: Props) {
  return <FormatoPrintClient id={params.id} />
}
