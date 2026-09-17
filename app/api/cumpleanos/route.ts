import {
  BIRTHDAY_LOOKAHEAD_DAYS,
  BIRTHDAY_YEAR_DAYS,
  getNextBirthday,
  getTodayInTimeZone,
  type BirthdayTable,
} from "@/lib/cumpleanos"
import { requireBirthdayAccess } from "@/lib/server/cumpleanos-auth"

export interface CumpleanosEntry {
  id: string
  tabla: BirthdayTable
  numero: string | null
  nombre: string
  departamento: string | null
  area: string | null
  email: string | null
  fecha_nacimiento: string
  edad: number
  diasParaCumpleanios: number
  fechaCumpleanios: string
  yaEnviado: boolean
}

interface RawBirthdayRecord {
  id: string
  tabla: BirthdayTable
  numero: string | null
  nombre: string
  departamento: string | null
  area: string | null
  email: string | null
  fecha_nacimiento: string
  cumple_enviado_year: number | null
  tipo_contrato?: string | null
}

export async function GET(request: Request) {
  const access = await requireBirthdayAccess(["dev", "admin"])
  if (!access.authorized) return access.response

  try {
    const url = new URL(request.url)
    const requestedDays = Number.parseInt(
      url.searchParams.get("dias") ?? String(BIRTHDAY_LOOKAHEAD_DAYS),
      10,
    )
    const days = Number.isFinite(requestedDays)
      ? Math.min(Math.max(requestedDays, 0), BIRTHDAY_YEAR_DAYS)
      : BIRTHDAY_LOOKAHEAD_DAYS

    const [{ data: employees, error: employeesError }, { data: newHires, error: newHiresError }] =
      await Promise.all([
        access.db
          .from("employees")
          .select("id, numero, nombre, departamento, area, email, fecha_nacimiento, cumple_enviado_year")
          .not("fecha_nacimiento", "is", null),
        access.db
          .from("nuevo_ingreso")
          .select("id, numero, nombre, departamento, area, email, fecha_nacimiento, cumple_enviado_year, tipo_contrato")
          .not("fecha_nacimiento", "is", null),
      ])

    if (employeesError) throw new Error(`Error al consultar employees: ${employeesError.message}`)
    if (newHiresError) throw new Error(`Error al consultar nuevo_ingreso: ${newHiresError.message}`)

    const recordsByNumber = new Map<string, RawBirthdayRecord>()
    const recordsWithoutNumber: RawBirthdayRecord[] = []

    for (const employee of (employees ?? []) as Omit<RawBirthdayRecord, "tabla">[]) {
      const record: RawBirthdayRecord = { ...employee, tabla: "employees" }
      if (!record.numero) recordsWithoutNumber.push(record)
      else recordsByNumber.set(record.numero, record)
    }

    for (const newHire of (newHires ?? []) as Omit<RawBirthdayRecord, "tabla">[]) {
      const record: RawBirthdayRecord = { ...newHire, tabla: "nuevo_ingreso" }
      if (!record.numero) {
        recordsWithoutNumber.push(record)
        continue
      }

      const existing = recordsByNumber.get(record.numero)
      if (!existing) {
        recordsByNumber.set(record.numero, record)
      } else if (record.tipo_contrato !== "Indeterminado") {
        recordsByNumber.set(record.numero, {
          ...record,
          email: record.email || existing.email,
          cumple_enviado_year: record.cumple_enviado_year ?? existing.cumple_enviado_year,
        })
      } else {
        recordsByNumber.set(record.numero, {
          ...existing,
          email: existing.email || record.email,
          cumple_enviado_year: existing.cumple_enviado_year ?? record.cumple_enviado_year,
        })
      }
    }

    const now = new Date()
    const currentYear = getTodayInTimeZone(now).year
    const result: CumpleanosEntry[] = []

    for (const record of [...recordsByNumber.values(), ...recordsWithoutNumber]) {
      const birthday = getNextBirthday(record.fecha_nacimiento, now)
      if (birthday.diasParaCumpleanios > days) continue

      result.push({
        id: record.id,
        tabla: record.tabla,
        numero: record.numero,
        nombre: record.nombre,
        departamento: record.departamento,
        area: record.area,
        email: record.email,
        fecha_nacimiento: record.fecha_nacimiento,
        ...birthday,
        yaEnviado: record.cumple_enviado_year === currentYear,
      })
    }

    result.sort((a, b) =>
      a.diasParaCumpleanios - b.diasParaCumpleanios || a.nombre.localeCompare(b.nombre, "es"),
    )

    return Response.json({ empleados: result })
  } catch (error) {
    console.error("[GET /api/cumpleanos]", error)
    return Response.json({ error: "No se pudo cargar la información de cumpleaños" }, { status: 500 })
  }
}
