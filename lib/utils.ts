import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generarFolioExamen(id: string, numeroEmpleado?: string | null, fecha?: string) {
  const uuidShort = id.split("-")[0].substring(0, 4).toUpperCase()
  const num = numeroEmpleado ? numeroEmpleado.trim() : "0000"
  let year = new Date().getFullYear().toString().slice(-2)
  if (fecha) {
    try {
      year = new Date(fecha).getFullYear().toString().slice(-2)
    } catch (e) {}
  }
  return `EX-${year}-${num}-${uuidShort}`
}
