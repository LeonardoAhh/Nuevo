import { sendBirthdayEmail } from "@/lib/email/client"
import {
  BIRTHDAY_LOOKAHEAD_DAYS,
  BIRTHDAY_SEND_BATCH_LIMIT,
  getNextBirthday,
  getTodayInTimeZone,
  type BirthdayTable,
} from "@/lib/cumpleanos"
import { requireBirthdayAccess } from "@/lib/server/cumpleanos-auth"

interface SendRequestRecord {
  id: string
  tabla: BirthdayTable
  permitirReenvio: boolean
  permitirFueraDePeriodo: boolean
}

interface SendResult {
  id: string
  nombre: string
  ok: boolean
  error?: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parseRecords(value: unknown): SendRequestRecord[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > BIRTHDAY_SEND_BATCH_LIMIT) {
    return null
  }

  const unique = new Map<string, SendRequestRecord>()
  for (const item of value) {
    if (!item || typeof item !== "object") return null
    const record = item as Partial<SendRequestRecord>
    if (
      typeof record.id !== "string" ||
      !UUID_PATTERN.test(record.id) ||
      (record.tabla !== "employees" && record.tabla !== "nuevo_ingreso")
    ) {
      return null
    }
    unique.set(`${record.tabla}:${record.id}`, {
      id: record.id,
      tabla: record.tabla,
      permitirReenvio: record.permitirReenvio === true,
      permitirFueraDePeriodo: record.permitirFueraDePeriodo === true,
    })
  }

  return [...unique.values()]
}

export async function POST(request: Request) {
  const access = await requireBirthdayAccess(["dev"])
  if (!access.authorized) return access.response

  try {
    const body = await request.json()
    const records = parseRecords(body?.registros)
    if (!records) {
      return Response.json({ error: "La selección de colaboradores no es válida" }, { status: 400 })
    }

    const currentYear = getTodayInTimeZone().year
    const results: SendResult[] = []

    for (const record of records) {
      const { data: employee, error: readError } = await access.db
        .from(record.tabla)
        .select("id, nombre, email, fecha_nacimiento, cumple_enviado_year")
        .eq("id", record.id)
        .maybeSingle()

      if (readError || !employee) {
        results.push({ id: record.id, nombre: "Colaborador", ok: false, error: "Registro no encontrado" })
        continue
      }

      if (!employee.email || !employee.fecha_nacimiento) {
        results.push({ id: record.id, nombre: employee.nombre, ok: false, error: "Falta correo o fecha de nacimiento" })
        continue
      }

      const birthday = getNextBirthday(employee.fecha_nacimiento)
      if (
        birthday.diasParaCumpleanios > BIRTHDAY_LOOKAHEAD_DAYS &&
        !record.permitirFueraDePeriodo
      ) {
        results.push({ id: record.id, nombre: employee.nombre, ok: false, error: "Cumpleaños fuera del periodo permitido" })
        continue
      }

      const alreadySent = employee.cumple_enviado_year === currentYear
      if (alreadySent && !record.permitirReenvio) {
        results.push({ id: record.id, nombre: employee.nombre, ok: false, error: "La felicitación ya fue enviada este año" })
        continue
      }

      const previousSentYear = employee.cumple_enviado_year as number | null
      let claimedForFirstSend = false
      if (!alreadySent) {
        const { data: claimed, error: claimError } = await access.db
          .from(record.tabla)
          .update({ cumple_enviado_year: currentYear })
          .eq("id", record.id)
          .or(`cumple_enviado_year.is.null,cumple_enviado_year.neq.${currentYear}`)
          .select("id")

        if (claimError || !claimed?.length) {
          results.push({ id: record.id, nombre: employee.nombre, ok: false, error: "No se pudo reservar el envío" })
          continue
        }
        claimedForFirstSend = true
      }

      try {
        await sendBirthdayEmail({
          to: employee.email,
          nombre: employee.nombre,
        })
        results.push({ id: record.id, nombre: employee.nombre, ok: true })
      } catch (error) {
        if (claimedForFirstSend) {
          const { error: rollbackError } = await access.db
            .from(record.tabla)
            .update({ cumple_enviado_year: previousSentYear })
            .eq("id", record.id)
            .eq("cumple_enviado_year", currentYear)

          if (rollbackError) {
            console.error("[POST /api/cumpleanos/enviar] No se pudo revertir la reserva", rollbackError.message)
          }
        }
        console.error("[POST /api/cumpleanos/enviar] Falló el proveedor de correo", error)
        const configurationMissing =
          error instanceof Error && error.message.includes("RESEND_API_KEY")
        results.push({
          id: record.id,
          nombre: employee.nombre,
          ok: false,
          error: configurationMissing
            ? "Falta configurar RESEND_API_KEY en el servidor"
            : "El proveedor de correo rechazó el envío",
        })
      }
    }

    const successful = results.filter((result) => result.ok).length
    return Response.json({ resultados: results, exitosos: successful, total: records.length })
  } catch (error) {
    console.error("[POST /api/cumpleanos/enviar]", error)
    return Response.json({ error: "No se pudo procesar el envío" }, { status: 500 })
  }
}
