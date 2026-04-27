import type { Metadata } from "next"
import { FormatoPrintClient } from "@/components/formatos/formato-print-client"

export const metadata: Metadata = {
  title: "Imprimir formato",
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ImprimirFormatoPage({ params }: Props) {
  const { id } = await params
  return <FormatoPrintClient id={id} />
}
