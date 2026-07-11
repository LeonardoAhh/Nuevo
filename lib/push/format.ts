/**
 * Single source of truth for push-notification content.
 *
 * Every push the app sends is built through `buildPush()` so the format
 * stays consistent across the two senders (`useBajaNotifications.create`
 * and the `baja-warnings` cron). No emojis by design.
 *
 * Shape:
 *   title: short, action-first. Max ~40 chars so iOS banner doesn't truncate.
 *   body:  one line of concrete context. Max ~60 chars.
 *   tag:   stable per-entity so duplicate pushes collapse.
 *   url:   where the bell/app should land on click.
 */

export type PushKind = "baja-created" | "baja-warning" | "rg-warning" | "contrato-warning"

export interface PushPayload {
  title: string
  body: string
  tag: string
  url: string
  /** Entity id — forwarded to the app via postMessage on notification click. */
  id?: string
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

/**
 * Format an ISO date (YYYY-MM-DD) as a compact Spanish label: "20 abr 2026".
 * Returns the input unchanged if it doesn't match the expected shape.
 */
export function formatFechaCorta(iso: string): string {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return iso
  const [, yyyy, mm, dd] = m
  return `${parseInt(dd, 10)} ${MESES[parseInt(mm, 10) - 1]} ${yyyy}`
}

/**
 * "hoy" / "mañana" / "en 3 días" — used in the push title.
 */
export function labelDiasRestantes(days: number): string {
  if (days <= 0) return "hoy"
  if (days === 1) return "mañana"
  return `en ${days} días`
}

interface BajaCreatedArgs {
  kind: "baja-created"
  id: string
  employeeName: string
  employeeNumero: string | null
  fechaBaja: string
}

interface BajaWarningArgs {
  kind: "baja-warning"
  id: string
  daysBefore: number
  employeeName: string
  employeeNumero: string | null
  fechaBaja: string
}

interface RgWarningArgs {
  kind: "rg-warning"
  id: string
  daysBefore: number
  nombre: string
  puesto: string
  departamento: string
}

interface ContratoWarningArgs {
  kind: "contrato-warning"
  id: string
  daysBefore: number
  nombre: string
  tipoContrato: string
  departamento: string
}

export type BuildPushArgs =
  | BajaCreatedArgs
  | BajaWarningArgs
  | RgWarningArgs
  | ContratoWarningArgs

export function buildPush(args: BuildPushArgs): PushPayload {
  switch (args.kind) {
    case "baja-created": {
      const numero = args.employeeNumero ? ` · #${args.employeeNumero}` : ""
      return {
        title: `Nueva baja — ${args.employeeName}`,
        body: `Fecha de baja: ${formatFechaCorta(args.fechaBaja)}${numero}`,
        tag: `baja-${args.id}`,
        url: "/",
        id: args.id,
      }
    }
    case "baja-warning": {
      const numero = args.employeeNumero ? ` · #${args.employeeNumero}` : ""
      return {
        title: `Baja ${labelDiasRestantes(args.daysBefore)} — ${args.employeeName}`,
        body: `${formatFechaCorta(args.fechaBaja)}${numero}`,
        tag: `baja-${args.id}-${args.daysBefore}d`,
        url: "/",
        id: args.id,
      }
    }
    case "rg-warning": {
      return {
        title: `RG-REC-048 vence ${labelDiasRestantes(args.daysBefore)} — ${args.nombre}`,
        body: `${args.puesto} · ${args.departamento}`,
        tag: `rg-${args.id}-${args.daysBefore}d`,
        url: "/",
        id: args.id,
      }
    }
    case "contrato-warning": {
      return {
        title: `Contrato vence ${labelDiasRestantes(args.daysBefore)} — ${args.nombre}`,
        body: `${args.tipoContrato} · ${args.departamento}`,
        tag: `contrato-${args.id}-${args.daysBefore}d`,
        url: "/",
        id: args.id,
      }
    }
  }
}
