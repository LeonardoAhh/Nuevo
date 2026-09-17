import {
  BIRTHDAY_IMPORT_LIMIT,
  normalizeBirthdayDate,
  type BirthdayTable,
} from "@/lib/cumpleanos"
import { requireBirthdayAccess } from "@/lib/server/cumpleanos-auth"
import type { SupabaseClient } from "@supabase/supabase-js"

interface ImportRecord {
  numero: string
  fecha_nacimiento: string
  email: string
}

interface ResolvedRecord extends ImportRecord {
  id: string
  tabla: BirthdayTable
  nombre: string
  fecha_nacimiento_actual: string | null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseRecords(value: unknown): { records: ImportRecord[]; errors: string[] } {
  if (!Array.isArray(value) || value.length === 0 || value.length > BIRTHDAY_IMPORT_LIMIT) {
    return { records: [], errors: [`El archivo debe contener entre 1 y ${BIRTHDAY_IMPORT_LIMIT} registros.`] }
  }

  const records: ImportRecord[] = []
  const errors: string[] = []
  const seenNumbers = new Set<string>()

  value.forEach((item, index) => {
    const row = index + 1
    if (!item || typeof item !== "object") {
      errors.push(`Fila ${row}: el registro no es válido.`)
      return
    }

    const candidate = item as Partial<ImportRecord>
    const numero = typeof candidate.numero === "string" ? candidate.numero.trim() : ""
    const email = typeof candidate.email === "string" ? candidate.email.trim().toLowerCase() : ""
    const rawDate = typeof candidate.fecha_nacimiento === "string" ? candidate.fecha_nacimiento : ""
    const date = normalizeBirthdayDate(rawDate)

    if (!numero || numero.length > 50) errors.push(`Fila ${row}: número de empleado inválido.`)
    if (!EMAIL_PATTERN.test(email) || email.length > 254) errors.push(`Fila ${row}: correo inválido.`)
    if ("error" in date) errors.push(`Fila ${row}: ${date.error}`)
    if (seenNumbers.has(numero)) errors.push(`Fila ${row}: número de empleado duplicado.`)

    if (numero && EMAIL_PATTERN.test(email) && email.length <= 254 && !("error" in date) && !seenNumbers.has(numero)) {
      records.push({ numero, email, fecha_nacimiento: date.iso })
      seenNumbers.add(numero)
    }
  })

  return { records, errors }
}

async function resolveRecords(
  db: SupabaseClient,
  records: ImportRecord[],
) {
  const numbers = records.map((record) => record.numero)
  const [{ data: employees, error: employeesError }, { data: newHires, error: newHiresError }] =
    await Promise.all([
      db.from("employees").select("id, numero, nombre, fecha_nacimiento").in("numero", numbers),
      db.from("nuevo_ingreso").select("id, numero, nombre, fecha_nacimiento, tipo_contrato").in("numero", numbers),
    ])

  if (employeesError) throw new Error(employeesError.message)
  if (newHiresError) throw new Error(newHiresError.message)

  const matches = new Map<
    string,
    { id: string; tabla: BirthdayTable; nombre: string; fecha_nacimiento_actual: string | null }
  >()
  for (const employee of employees ?? []) {
    if (employee.numero) {
      matches.set(employee.numero, {
        id: employee.id,
        tabla: "employees",
        nombre: employee.nombre,
        fecha_nacimiento_actual: employee.fecha_nacimiento,
      })
    }
  }
  for (const newHire of newHires ?? []) {
    if (newHire.numero && (!matches.has(newHire.numero) || newHire.tipo_contrato !== "Indeterminado")) {
      matches.set(newHire.numero, {
        id: newHire.id,
        tabla: "nuevo_ingreso",
        nombre: newHire.nombre,
        fecha_nacimiento_actual: newHire.fecha_nacimiento,
      })
    }
  }

  const resolved: ResolvedRecord[] = []
  const notFound: string[] = []
  for (const record of records) {
    const match = matches.get(record.numero)
    if (!match) notFound.push(record.numero)
    else resolved.push({ ...record, ...match })
  }

  return { resolved, notFound }
}

export async function POST(request: Request) {
  const access = await requireBirthdayAccess(["dev"])
  if (!access.authorized) return access.response

  try {
    const body = await request.json()
    const action = body?.action
    if (action !== "preview" && action !== "save") {
      return Response.json({ error: "Acción no válida" }, { status: 400 })
    }

    const parsed = parseRecords(body?.registros)
    if (parsed.errors.length) {
      const summary = parsed.errors.slice(0, 20).join(" ")
      const suffix = parsed.errors.length > 20 ? ` Hay ${parsed.errors.length - 20} errores adicionales.` : ""
      return Response.json({ error: summary + suffix }, { status: 400 })
    }

    const { resolved, notFound } = await resolveRecords(access.db, parsed.records)
    if (action === "preview") {
      return Response.json({
        registros: resolved.map(({ fecha_nacimiento_actual: _currentDate, ...record }) => record),
        noEncontrados: notFound,
      })
    }

    const results = []
    let resetSendStatusCount = 0
    for (const record of resolved) {
      const birthdayChanged = record.fecha_nacimiento_actual !== record.fecha_nacimiento
      const { error } = await access.db
        .from(record.tabla)
        .update({
          fecha_nacimiento: record.fecha_nacimiento,
          email: record.email,
          ...(birthdayChanged ? { cumple_enviado_year: null } : {}),
        })
        .eq("id", record.id)

      if (!error && birthdayChanged) resetSendStatusCount += 1

      results.push({
        numero: record.numero,
        nombre: record.nombre,
        ok: !error,
        error: error ? "No se pudo actualizar el registro" : undefined,
      })
    }

    return Response.json({
      resultados: results,
      exitosos: results.filter((result) => result.ok).length,
      total: results.length,
      noEncontrados: notFound,
      estadosEnvioReiniciados: resetSendStatusCount,
    })
  } catch (error) {
    console.error("[POST /api/cumpleanos/importar]", error)
    return Response.json({ error: "No se pudo procesar la importación" }, { status: 500 })
  }
}
