import type { Metadata } from "next"
import RecursosHome from "@/components/recursos-home"

export const metadata: Metadata = {
  title: "Recursos",
}

export default function RecursosPage() {
  return <RecursosHome />
}
