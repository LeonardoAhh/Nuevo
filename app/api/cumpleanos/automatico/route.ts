import { createClient } from "@supabase/supabase-js"
import { getNextBirthday, getTodayInTimeZone, type BirthdayTable } from "@/lib/cumpleanos"
import { sendBirthdayEmail } from "@/lib/email/client"

interface BirthdayRecord {
  id: string
  tabla: BirthdayTable
  numero: string | null
  nombre: string
  email: string | null
  fecha_nacimiento: string
  cumple_enviado_year: number | null
  tipo_contrato?: string | null
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    return Response.json({ error: "Configuración del servidor incompleta" }, { status: 500 })
  }

  try {
    const db = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const [{ data: employees, error: employeesError }, { data: newHires, error: newHiresError }] =
      await Promise.all([
        db
          .from("employees")
          .select("id, numero, nombre, email, fecha_nacimiento, cumple_enviado_year")
          .not("fecha_nacimiento", "is", null)
          .not("email", "is", null),
        db
          .from("nuevo_ingreso")
          .select("id, numero, nombre, email, fecha_nacimiento, cumple_enviado_year, tipo_contrato")
          .not("fecha_nacimiento", "is", null)
          .not("email", "is", null),
      ])

    if (employeesError) throw new Error(employeesError.message)
    if (newHiresError) throw new Error(newHiresError.message)

    const byNumber = new Map<string, BirthdayRecord>()
    const withoutNumber: BirthdayRecord[] = []
    for (const employee of (employees ?? []) as Omit<BirthdayRecord, "tabla">[]) {
      const record: BirthdayRecord = { ...employee, tabla: "employees" }
      if (record.numero) byNumber.set(record.numero, record)
      else withoutNumber.push(record)
    }
    for (const newHire of (newHires ?? []) as Omit<BirthdayRecord, "tabla">[]) {
      const record: BirthdayRecord = { ...newHire, tabla: "nuevo_ingreso" }
      if (!record.numero) withoutNumber.push(record)
      else if (!byNumber.has(record.numero) || record.tipo_contrato !== "Indeterminado") {
        byNumber.set(record.numero, record)
      }
    }

    const currentYear = getTodayInTimeZone().year
    const birthdaysToday = [...byNumber.values(), ...withoutNumber].filter(
      (record) =>
        record.email &&
        record.cumple_enviado_year !== currentYear &&
        getNextBirthday(record.fecha_nacimiento).diasParaCumpleanios === 0,
    )
    const results: Array<{ nombre: string; ok: boolean }> = []

    for (const record of birthdaysToday) {
      const { data: claimed, error: claimError } = await db
        .from(record.tabla)
        .update({ cumple_enviado_year: currentYear })
        .eq("id", record.id)
        .or(`cumple_enviado_year.is.null,cumple_enviado_year.neq.${currentYear}`)
        .select("id")

      if (claimError || !claimed?.length) {
        results.push({ nombre: record.nombre, ok: false })
        continue
      }

      try {
        await sendBirthdayEmail({
          to: record.email!,
          nombre: record.nombre,
        })
        results.push({ nombre: record.nombre, ok: true })
      } catch (error) {
        const { error: rollbackError } = await db
          .from(record.tabla)
          .update({ cumple_enviado_year: record.cumple_enviado_year })
          .eq("id", record.id)
          .eq("cumple_enviado_year", currentYear)
        if (rollbackError) console.error("[cron/cumpleanos] Falló la reversión", rollbackError.message)
        console.error("[cron/cumpleanos] Falló el envío", error)
        results.push({ nombre: record.nombre, ok: false })
      }
    }

    return Response.json({
      fecha: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date()),
      procesados: results.length,
      enviados: results.filter((result) => result.ok).length,
    })
  } catch (error) {
    console.error("[GET /api/cumpleanos/automatico]", error)
    return Response.json({ error: "No se pudo ejecutar el envío automático" }, { status: 500 })
  }
}
